from django.core.management.base import BaseCommand
from utils.populate_india_location_data import populate_india_location_data

class Command(BaseCommand):
    help = "Populate India, its states, and cities (idempotent and safe)"

    def handle(self, *args, **options):
        populate_india_location_data()
