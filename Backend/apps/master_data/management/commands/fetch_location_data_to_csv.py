"""
Django management command to fetch location data from API and save to CSV files.
This script fetches countries, states, and cities data and stores them in CSV format
for later bulk upload to avoid API rate limit issues.

Usage:
``````
# Fetch all countries
python manage.py fetch_location_data_to_csv

# Fetch only India
python manage.py fetch_location_data_to_csv --countries IN

# Fetch multiple countries
python manage.py fetch_location_data_to_csv --countries IN US GB
``````
"""

import requests
import time
import csv
import os
from datetime import datetime
from django.core.management.base import BaseCommand
from django.conf import settings
import logging

# API Configuration
DELAY = 0.5  # Increased delay to avoid rate limits
API_KEY = settings.LOCATION_API_KEY
BASE_URL = settings.LOCATION_API_BASE_URL
HEADERS = {"X-CSCAPI-KEY": API_KEY}

# Output directory for CSV files
OUTPUT_DIR = "location_data_csvs"

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

# Configure logging
logging.basicConfig(
    filename="logs/fetch_location_data.log",
    filemode="a",
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    level=logging.INFO,
)


class Command(BaseCommand):
    help = "Fetch location data from API and save to CSV files"

    def __init__(self):
        super().__init__()
        self.countries_data = []
        self.states_data = []
        self.cities_data = []
        self.request_count = 0
        self.max_requests_per_minute = 100  # Adjust based on API limits

    def add_arguments(self, parser):
        parser.add_argument(
            '--countries',
            nargs='+',
            type=str,
            help='Specific country codes to fetch (e.g., IN US). If not provided, fetches all countries.'
        )

    def handle(self, *args, **options):
        start_time = time.time()
        
        # Create output directory if it doesn't exist
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        os.makedirs("logs", exist_ok=True)
        
        msg = "🌍 Starting location data fetching to CSV..."
        self.stdout.write(self.style.MIGRATE_HEADING(msg))
        logging.info(msg)

        # Fetch countries
        countries = self.fetch_data(f"{BASE_URL}/countries")
        
        if not countries:
            self.stdout.write(self.style.ERROR("❌ Failed to fetch countries"))
            return

        # Filter countries if specific ones are requested
        specific_countries = options.get('countries')
        if specific_countries:
            countries = [c for c in countries if c['iso2'] in specific_countries]
            msg = f"📍 Filtering for countries: {', '.join(specific_countries)}"
            self.stdout.write(msg)
            logging.info(msg)

        # Process each country
        for idx, country in enumerate(countries, 1):
            self.stdout.write(f"\n{'='*60}")
            msg = f"[{idx}/{len(countries)}] Processing: {country['name']} ({country['iso2']})"
            self.stdout.write(self.style.SUCCESS(msg))
            logging.info(msg)
            
            # Add country to data
            self.countries_data.append({
                'country_name': country['name'],
                'country_code': country['iso2']
            })
            
            # Fetch states for this country
            states = self.fetch_data(f"{BASE_URL}/countries/{country['iso2']}/states")
            
            if not states:
                msg = f"  🌆 No states found for {country['name']}, fetching cities directly..."
                self.stdout.write(msg)
                logging.info(msg)
                
                # Fetch cities directly for countries without states
                cities = self.fetch_data(f"{BASE_URL}/countries/{country['iso2']}/cities")
                self.process_cities(cities, None, country)
            else:
                # Process each state
                for state_idx, state in enumerate(states, 1):
                    msg = f"  [{state_idx}/{len(states)}] 🏙️  State: {state['name']}"
                    self.stdout.write(msg)
                    logging.info(msg)
                    
                    # Add state to data
                    self.states_data.append({
                        'state_name': state['name'],
                        'state_code': state['iso2'],
                        'country_code': country['iso2']
                    })
                    
                    # Fetch cities for this state
                    cities = self.fetch_data(
                        f"{BASE_URL}/countries/{country['iso2']}/states/{state['iso2']}/cities"
                    )
                    self.process_cities(cities, state, country)
                    
            # Progress update
            self.stdout.write(f"  📊 Progress: {len(self.cities_data)} cities collected so far")

        # Save all data to CSV files
        self.save_to_csv()
        
        total_time = round(time.time() - start_time, 2)
        msg = f"\n✅ Completed in {total_time} seconds. Total API calls: {self.request_count}"
        self.stdout.write(self.style.SUCCESS(msg))
        logging.info(msg)
        
        # Print summary
        self.print_summary()

    def fetch_data(self, url):
        """Fetch data from API with rate limiting and error handling"""
        try:
            # Rate limiting
            if self.request_count > 0 and self.request_count % self.max_requests_per_minute == 0:
                msg = f"⏸️  Rate limit pause (made {self.request_count} requests)..."
                self.stdout.write(self.style.WARNING(msg))
                time.sleep(60)  # Wait 1 minute
            
            time.sleep(DELAY)  # Delay between requests
            
            response = requests.get(url, headers=HEADERS, timeout=30)
            self.request_count += 1
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:  # Too Many Requests
                msg = f"⚠️  Rate limit hit, waiting 60 seconds..."
                self.stdout.write(self.style.WARNING(msg))
                logging.warning(msg)
                time.sleep(60)
                return self.fetch_data(url)  # Retry
            else:
                msg = f"❌ HTTP Error {e.response.status_code}: {url}"
                self.stdout.write(self.style.ERROR(msg))
                logging.error(msg)
                return []
                
        except requests.exceptions.RequestException as e:
            msg = f"⚠️  Request failed for {url}: {str(e)}"
            self.stdout.write(self.style.WARNING(msg))
            logging.warning(msg)
            return []

    def process_cities(self, cities, state, country):
        """Process and add cities to the data list"""
        if not cities:
            return
            
        for city in cities:
            city_name = city.get('name', '')
            
            # Determine category (only for India)
            category = 'C'  # Default category
            if country['iso2'] == 'IN' and city_name in CATEGORY_A_CITIES:
                category = 'A'
            
            city_data = {
                'city_name': city_name,
                'city_code': city.get('id', ''),
                'state_name': state['name'] if state else '',
                'country_code': country['iso2'],
                'category': category
            }
            
            self.cities_data.append(city_data)

    def save_to_csv(self):
        """Save collected data to CSV files"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save countries
        countries_file = os.path.join(OUTPUT_DIR, f"countries_{timestamp}.csv")
        with open(countries_file, 'w', newline='', encoding='utf-8') as f:
            if self.countries_data:
                writer = csv.DictWriter(f, fieldnames=['country_name', 'country_code'])
                writer.writeheader()
                writer.writerows(self.countries_data)
        
        msg = f"💾 Saved {len(self.countries_data)} countries to {countries_file}"
        self.stdout.write(self.style.SUCCESS(msg))
        logging.info(msg)
        
        # Save states
        states_file = os.path.join(OUTPUT_DIR, f"states_{timestamp}.csv")
        with open(states_file, 'w', newline='', encoding='utf-8') as f:
            if self.states_data:
                writer = csv.DictWriter(f, fieldnames=['state_name', 'state_code', 'country_code'])
                writer.writeheader()
                writer.writerows(self.states_data)
        
        msg = f"💾 Saved {len(self.states_data)} states to {states_file}"
        self.stdout.write(self.style.SUCCESS(msg))
        logging.info(msg)
        
        # Save cities
        cities_file = os.path.join(OUTPUT_DIR, f"cities_{timestamp}.csv")
        with open(cities_file, 'w', newline='', encoding='utf-8') as f:
            if self.cities_data:
                writer = csv.DictWriter(
                    f, 
                    fieldnames=['city_name', 'city_code', 'state_name', 'country_code', 'category']
                )
                writer.writeheader()
                writer.writerows(self.cities_data)
        
        msg = f"💾 Saved {len(self.cities_data)} cities to {cities_file}"
        self.stdout.write(self.style.SUCCESS(msg))
        logging.info(msg)

    def print_summary(self):
        """Print summary of collected data"""
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("📊 DATA COLLECTION SUMMARY"))
        self.stdout.write("="*60)
        self.stdout.write(f"Countries collected: {len(self.countries_data)}")
        self.stdout.write(f"States collected: {len(self.states_data)}")
        self.stdout.write(f"Cities collected: {len(self.cities_data)}")
        
        # Category A cities count (India only)
        category_a_count = sum(1 for city in self.cities_data if city['category'] == 'A')
        self.stdout.write(f"Category A cities (India): {category_a_count}")
        
        self.stdout.write(f"\nTotal API requests made: {self.request_count}")
        self.stdout.write("="*60)