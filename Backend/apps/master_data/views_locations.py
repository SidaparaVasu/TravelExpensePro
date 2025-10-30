import requests
from django.core.cache import cache
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status

from django.conf import settings
BASE_URL = settings.LOCATION_API_BASE_URL
API_KEY = settings.LOCATION_API_KEY  # get free key from countrystatecity.in

HEADERS = {"X-CSCAPI-KEY": API_KEY}

class CountryListView(APIView):
    def get(self, request):
        cache_key = "countries_list"
        data = cache.get(cache_key)
        if not data:
            r = requests.get(f"{BASE_URL}/countries", headers=HEADERS)
            if r.status_code != 200:
                return Response({"error": "External API failed"}, status=r.status_code)
            data = r.json()
            cache.set(cache_key, data, 86400)  # cache for 1 day
        return Response(data)

class StateListView(APIView):
    def get(self, request):
        country = request.query_params.get("country")
        if not country:
            return Response({"error": "country parameter required"}, status=400)

        cache_key = f"states_{country}"
        data = cache.get(cache_key)
        if not data:
            r = requests.get(f"{BASE_URL}/countries/{country}/states", headers=HEADERS)
            if r.status_code != 200:
                return Response({"error": "External API failed"}, status=r.status_code)
            data = r.json()
            cache.set(cache_key, data, 86400)
        return Response(data)

class CityListView(APIView):
    def get(self, request):
        country = request.query_params.get("country")
        state = request.query_params.get("state")
        if not country or not state:
            return Response({"error": "country and state required"}, status=400)

        cache_key = f"cities_{country}_{state}"
        data = cache.get(cache_key)
        if not data:
            r = requests.get(f"{BASE_URL}/countries/{country}/states/{state}/cities", headers=HEADERS)
            if r.status_code != 200:
                return Response({"error": "External API failed"}, status=r.status_code)
            data = r.json()
            cache.set(cache_key, data, 86400)
        return Response(data)
