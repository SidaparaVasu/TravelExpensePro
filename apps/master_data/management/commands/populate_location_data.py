import requests
import time
import os
from datetime import datetime
from django.core.management.base import BaseCommand
from apps.master_data.models import CountryMaster, StateMaster, CityMaster, CityCategoriesMaster
from django.conf import settings
import logging
from django.db import IntegrityError

DELAY = 0.3  # delay between requests
API_KEY = settings.LOCATION_API_KEY
BASE_URL = settings.LOCATION_API_BASE_URL
HEADERS = {"X-CSCAPI-KEY": API_KEY}

# Cities to assign category 'A' in India
CATEGORY_A_CITIES = {
    "Agra", "Ahmedabad", "Aligarh", "Allahabad", "Amritsar", "Asansol", "Bareilly", "Belgaum",
    "Bhadrawati", "Bhavnagar", "Bhilai", "Bikaner", "Bokaro", "Burnpur", "Cochin", "Coimbatore",
    "Coonoor", "Dhanbad", "Durg", "Durgapur", "Faridabad", "Ghaziabad", "Gorakhpur", "Guntur",
    "Gurgaon", "Gwalior", "Hubli", "Indore", "Jabalpur", "Jodhpur", "Jalandhar", "Jammu",
    "Jamshedpur", "Kalyan", "Kanpur", "Kochi", "Kolhapur", "Kota", "Kozhikode", "Ludhiana",
    "Madurai", "Mangalore", "Meerut", "Moradabad", "Mysore", "Nagpur", "Paradip", "Pune",
    "Rourkela", "Salem", "Secundrabad", "Surat", "Thane", "Tinsukia", "Tiruchirapally",
    "Vadodara", "Varanasi", "Vijayawada", "Vijayanagaram", "Visakhapatnam", "Wayanad"
}

# Log file
LOG_FILE = "populate_geography.log"
# 🪵 Configure logging
logging.basicConfig(
    filename="logs/location_population.log",
    filemode="a",
    format="%(asctime)s — %(levelname)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO,
)

class Command(BaseCommand):
    help = "Populate Country, State, and City data from countrystatecity.in API"

    def handle(self, *args, **options):
        start_time = time.time()
        msg = "🌍 Starting location data population..."
        self.stdout.write(self.style.MIGRATE_HEADING(msg))
        logging.info(msg)

        countries = self.fetch_data(f"{BASE_URL}/countries")
        for country in countries:
            country_obj, _ = CountryMaster.objects.get_or_create(
                country_name=country["name"],
                defaults={"country_code": country["iso2"]}
            )
            msg = f"✅ Country: {country_obj.country_name}"
            self.stdout.write(msg)
            logging.info(msg)

            states = self.fetch_data(f"{BASE_URL}/countries/{country['iso2']}/states")

            if not states:
                msg = f"  🌆 No states found for {country_obj.country_name}, adding cities directly."
                self.stdout.write(msg)
                logging.info(msg)
                cities = self.fetch_data(f"{BASE_URL}/countries/{country['iso2']}/cities")
                self.add_cities(cities, None, country_obj)
            else:
                for state in states:
                    state_obj, _ = StateMaster.objects.get_or_create(
                        state_name=state["name"],
                        country=country_obj,
                        defaults={"state_code": state["iso2"]}
                    )
                    msg = f"  🏙️ State: {state_obj.state_name}"
                    self.stdout.write(msg)
                    logging.info(msg)

                    cities = self.fetch_data(f"{BASE_URL}/countries/{country['iso2']}/states/{state['iso2']}/cities")
                    self.add_cities(cities, state_obj, country_obj)

        total_time = round(time.time() - start_time, 2)
        msg = f"✅ Completed in {total_time} seconds."
        self.stdout.write(self.style.SUCCESS(msg))
        logging.info(msg)

    def fetch_data(self, url):
        try:
            response = requests.get(url, headers=HEADERS)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            msg = f"⚠️ Skipped due to error: {e}"
            self.stdout.write(self.style.WARNING(msg))
            logging.warning(msg)
            return []

    def add_cities(self, cities, state_obj, country_obj):
        for city in cities:
            try:
                city_obj, created = CityMaster.objects.get_or_create(
                    city_name=city["name"],
                    country=country_obj,
                    state=state_obj
                )
                if created:
                    msg = f"    🏘️ City added: {city_obj.city_name}"
                    self.stdout.write(msg)
                    logging.info(msg)
            except IntegrityError:
                msg = f"    ⚠️ Duplicate city skipped: {city['name']}"
                self.stdout.write(self.style.WARNING(msg))
                logging.warning(msg)
