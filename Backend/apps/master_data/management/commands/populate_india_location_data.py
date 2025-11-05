import requests
import time
from datetime import datetime
from django.core.management.base import BaseCommand
from apps.master_data.models import CountryMaster, StateMaster, CityMaster, CityCategoriesMaster

DELAY = 0.3  # delay between requests

COUNTRIESNOW_STATES_URL = "https://countriesnow.space/api/v0.1/countries/states"
COUNTRIESNOW_CITIES_URL = "https://countriesnow.space/api/v0.1/countries/state/cities"

# Cities that should be assigned Category 'A' initially
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

def log(message):
    print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} - {message}")

class Command(BaseCommand):
    help = "Populate India, its states, and cities using APIs safely (idempotent, timestamped)"

    
    def handle(self, *args, **options):
        
        start_time = time.time()

        # Step 0: Ensure City Categories Exist
        log("🔍 Checking for city categories")
        category_a, _ = CityCategoriesMaster.objects.get_or_create(name='A')
        category_b, _ = CityCategoriesMaster.objects.get_or_create(name='B')
        category_c, _ = CityCategoriesMaster.objects.get_or_create(name='C')
        log("✅ City categories verified or created ('A', 'B', 'C')")
        
        # Step 1: Add India to CountryMaster (if not exists)
        india, _ = CountryMaster.objects.get_or_create(
            country_name="India",
            defaults={"country_code": "IN"}
        )
        log("✅ India present in CountryMaster")

        # Step 2: Fetch states for India (skip API call if states already exist)
        existing_states = StateMaster.objects.filter(country=india).values_list('state_name', flat=True)
        if existing_states:
            states_list = list(existing_states)
            log(f"ℹ️ Existing states found, skipping API call: {len(states_list)} states")
        else:
            response = requests.post(COUNTRIESNOW_STATES_URL, json={"country": "India"})
            response.raise_for_status()
            states_data = response.json()
            if states_data["error"]:
                log("⚠️ Could not fetch states for India")
                return
            states_list = [s["name"] for s in states_data["data"]["states"]]

        # Step 3: Populate states safely
        for state_name in states_list:
            state_obj, _ = StateMaster.objects.get_or_create(
                state_name=state_name,
                country=india
            )
            log(f"✅ State ready: {state_name}")
            time.sleep(DELAY)

        # Step 4: Populate cities safely
        category_a = CityCategoriesMaster.objects.filter(name='A').first()
        default_category = CityCategoriesMaster.objects.exclude(name='A').first() or category_a

        for state_name in states_list:
            state_obj = StateMaster.objects.get(state_name=state_name, country=india)
            existing_cities = CityMaster.objects.filter(state=state_obj).values_list('city_name', flat=True)

            if existing_cities:
                log(f"ℹ️ Existing cities for {state_name}, skipping API call: {len(existing_cities)} cities")
                cities_list = []  # We'll still add missing ones later
            else:
                response = requests.post(
                    COUNTRIESNOW_CITIES_URL,
                    json={"country": "India", "state": state_name}
                )
                response.raise_for_status()
                cities_data = response.json()
                if cities_data["error"]:
                    log(f"⚠️ Could not fetch cities for {state_name}")
                    continue
                cities_list = cities_data["data"]

            for city_name in cities_list:
                city_name_clean = city_name.strip()
                city_obj, created = CityMaster.objects.get_or_create(
                    city_name=city_name_clean,
                    state=state_obj,
                    defaults={
                        "category": category_a if city_name_clean.lower() in [c.lower() for c in CATEGORY_A_CITIES] else default_category
                    }
                )
                if created:
                    log(f"✅ Added city: {city_name_clean}")
                else:
                    log(f"ℹ️ City already exists: {city_name_clean}")

            time.sleep(DELAY)

        log("🎉 India, its states, and cities populated successfully (idempotent)!")
        end_time = time.time()
        print(f"⏱ Total execution time: {end_time - start_time:.2f} seconds")
