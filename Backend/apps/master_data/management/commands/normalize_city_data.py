import unicodedata
from django.core.management.base import BaseCommand
from apps.master_data.models import CityMaster


def normalize_name(name: str) -> str:
    if not name:
        return name

    # Convert to NFKD form to remove diacritics
    name = unicodedata.normalize("NFKD", name)

    # Remove combining marks (accents)
    name = "".join([c for c in name if not unicodedata.combining(c)])

    # Remove corrupted Unicode characters
    replace_chars = ["┼", "½", "─", "ü", "Ç", "ü", "ā", "ī", "ś", "ž"]
    for ch in replace_chars:
        name = name.replace(ch, "")

    # Final cleanup
    name = name.strip()
    name = " ".join(name.split())   # remove extra spaces
    name = name.title()             # Ranchi, Port Blair, Etc.

    return name


def generate_city_code(name: str) -> str:
    clean = name.replace(" ", "")
    return clean[:3].upper() if len(clean) >= 3 else clean.upper()


class Command(BaseCommand):
    help = "Normalize existing CityMaster city names and generate city codes"

    def handle(self, *args, **kwargs):
        cities = CityMaster.objects.all()

        updated = 0

        for city in cities:
            old_name = city.city_name
            new_name = normalize_name(old_name)

            if not city.city_code:
                city_code = generate_city_code(new_name)
            else:
                city_code = city.city_code  # keep existing if present

            if new_name != old_name or not city.city_code:
                city.city_name = new_name
                city.city_code = city_code
                city.save()
                updated += 1
                self.stdout.write(f"Updated: {old_name} → {new_name}, code={city_code}")

        self.stdout.write(self.style.SUCCESS(f"Normalization complete. Total updated: {updated}"))
