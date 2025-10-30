import time
from datetime import datetime
from django.core.management.base import BaseCommand
from apps.master_data.models import CountryMaster, StateMaster, CityMaster, CityCategoriesMaster

DELAY = 0.1  # optional, for logging clarity

CATEGORY_A_CITIES = [
    "Agra", "Ahmedabad", "Aligarh", "Allahabad", "Amritsar", "Asansol", "Bareilly", "Belgaum",
    "Bhadrawati", "Bhavnagar", "Bhilai", "Bikaner", "Bokaro", "Burnpur", "Cochin", "Coimbatore",
    "Coonoor", "Dhanbad", "Durg", "Durgapur", "Faridabad", "Ghaziabad", "Gorakhpur", "Guntur",
    "Gurgaon", "Gwalior", "Hubli", "Indore", "Jabalpur", "Jodhpur", "Jalandhar", "Jammu",
    "Jamshedpur", "Kalyan", "Kanpur", "Kochi", "Kolhapur", "Kota", "Kozhikode", "Ludhiana",
    "Madurai", "Mangalore", "Meerut", "Moradabad", "Mysore", "Nagpur", "Paradip", "Pune",
    "Rourkela", "Salem", "Secundrabad", "Surat", "Thane", "Tinsukia", "Tiruchirapally",
    "Vadodara", "Varanasi", "Vijayawada", "Vijayanagaram", "Visakhapatnam", "Wayanad"
]

# Existing mapping of states to cities (India)
INDIA_STATE_CITY_MAPPING = {
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
    "Uttar Pradesh": ["Agra", "Aligarh", "Allahabad", "Bareilly", "Ghaziabad", "Gorakhpur", "Kanpur", "Meerut", "Moradabad", "Varanasi"],
    "Maharashtra": ["Mumbai", "Pune", "Thane", "Nagpur", "Kalyan", "Kolhapur"],
    "Tamil Nadu": ["Coimbatore", "Madurai", "Salem", "Tiruchirapally", "Coonoor"],
    "Karnataka": ["Bengaluru", "Mysore", "Hubli", "Belgaum", "Mangalore"],
    "Rajasthan": ["Jodhpur", "Bikaner", "Kota"],
    "Kerala": ["Kochi", "Cochin", "Wayanad", "Kozhikode"],
    "Punjab": ["Amritsar", "Jalandhar"],
    "Jharkhand": ["Dhanbad", "Jamshedpur", "Bokaro"],
    "Odisha": ["Paradip", "Rourkela"],
    "Andhra Pradesh": ["Vijayawada", "Visakhapatnam", "Guntur", "Vijayanagaram"],
    "Chhattisgarh": ["Bhilai", "Durg"],
    "West Bengal": ["Asansol", "Burnpur"],
    "Telangana": ["Secundrabad", "Hyderabad"]
    # Add more states/cities as needed
}

class Command(BaseCommand):
    help = "Populate only Category A cities from local mapping (no API)"

    def handle(self, *args, **options):
        start_time = datetime.now()
        self.stdout.write(f"⏱ Script started at {start_time}")

        # Ensure India exists
        india, _ = CountryMaster.objects.get_or_create(country_name="India", country_code="IN")
        self.stdout.write(f"✅ Country: {india.country_name}")

        # Ensure Category A exists
        category_a, _ = CityCategoriesMaster.objects.get_or_create(name="A", defaults={"description": "Category A"})
        self.stdout.write(f"✅ Category: {category_a.name}")

        # Populate states and cities
        for state_name, cities in INDIA_STATE_CITY_MAPPING.items():
            state_obj, _ = StateMaster.objects.get_or_create(state_name=state_name, country=india)
            self.stdout.write(f"✅ State: {state_name}")

            added_count = 0
            for city_name in cities:
                if city_name in CATEGORY_A_CITIES:
                    city_obj, created = CityMaster.objects.get_or_create(
                        city_name=city_name,
                        state=state_obj,
                        defaults={"category": category_a}
                    )
                    if created:
                        added_count += 1
                        self.stdout.write(f"   ➕ Added city: {city_name} (Category A)")
            self.stdout.write(f"✅ Total Category A cities added for {state_name}: {added_count}")
            time.sleep(DELAY)

        end_time = datetime.now()
        total_time = end_time - start_time
        self.stdout.write(f"🎉 Script finished at {end_time} (Total time: {total_time})")
