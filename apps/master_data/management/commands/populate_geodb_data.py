import requests
import time
from django.conf import settings
from apps.master_data.models import CountryMaster, StateMaster, CityMaster, CityCategoriesMaster

# API_KEY = settings.GEODB_API_KEY
# BASE_URL = settings.GEODB_BASE_URL

BASE_URL = "https://countriesnow.space/api/v0.1"
# HEADERS = {
#     "X-RapidAPI-Key": API_KEY,
#     "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com"
# }


def fetch_country_codes():
    response = requests.get("https://restcountries.com/v3.1/all")
    response.raise_for_status()
    data = response.json()
    # Returns dict: { "India": "IN", "United States": "US", ... }
    return {c["name"]["common"]: c["cca2"] for c in data}

# Fetch all countries
def fetch_countries():
    url = f"{BASE_URL}/countries/positions"
    response = requests.get(url)
    response.raise_for_status()
    data = response.json()["data"]
    return [c["name"] for c in data]

# Fetch states for a given country
def fetch_states(country_name):
    url = f"{BASE_URL}/countries/states"
    response = requests.post(url, json={"country": country_name})
    response.raise_for_status()
    data = response.json()
    if data["error"]:
        return []
    return [s["name"] for s in data["data"]["states"]]

# Fetch cities for a given country + state
def fetch_cities(country_name, state_name):
    url = f"{BASE_URL}/countries/state/cities"
    response = requests.post(url, json={"country": country_name, "state": state_name})
    response.raise_for_status()
    data = response.json()
    if data["error"]:
        return []
    return data["data"]

# Populate countries
def populate_countries():
    print("Fetching countries...")
    country_codes = fetch_country_codes()
    countries = fetch_countries()
    for c in countries:
        code = country_codes.get(c, "")
        CountryMaster.objects.get_or_create(country_name=c, country_code=code)
    print(f"✅ Populated {len(countries)} countries.")
    return countries

# Populate states
def populate_states():
    default_category = CityCategoriesMaster.objects.first()
    for country in CountryMaster.objects.all():
        states = fetch_states(country.country_name)
        for s in states:
            StateMaster.objects.get_or_create(
                state_name=s,
                country=country
            )
        print(f"✅ Populated {len(states)} states for {country.country_name}")
        time.sleep(0.3)  # respect rate limit

# Populate cities
def populate_cities():
    default_category = CityCategoriesMaster.objects.first()
    for state in StateMaster.objects.all():
        cities = fetch_cities(state.country.country_name, state.state_name)
        for city_name in cities:
            CityMaster.objects.get_or_create(
                city_name=city_name,
                state=state,
                category=default_category
            )
        print(f"✅ Populated {len(cities)} cities for {state.state_name}")
        time.sleep(0.3)  # respect rate limit


from django.core.management.base import BaseCommand
class Command(BaseCommand):
    help = "Export 'countriesnow' API data to populate location models (city, state, country)"
    
    populate_countries()
    time.sleep(1)
    populate_states()
    time.sleep(1)
    populate_cities()
    print("🎉 All location data populated successfully from 'countriesnow' API!")
