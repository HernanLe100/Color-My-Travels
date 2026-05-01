from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity

import requests
import pycountry
import os
from request_guards import apply_navigation_guard

from threading import Lock

geo_cache = {}
cache_lock = Lock()

_GEOAPIFY_KEY = os.getenv("GEOAPIFY_KEY")

# --------------------------------------------------

map_bp = Blueprint("map", __name__)
#apply_navigation_guard(map_bp)

geo_cache = {}

# --------------------------------------------------

@map_bp.route("/geo", methods=["GET"])
@jwt_required()
def get_geo():
    country = request.args.get("country")
    level = request.args.get("level") # ADM0 or ADM1

    if not country or not level:
        return jsonify({"error": "Missing country or level"}), 400

    key = f"{country}-{level}"

    # cache hit
    with cache_lock:
        if key in geo_cache:
            return jsonify(geo_cache[key])

    try:
        meta_url = f"https://www.geoboundaries.org/api/current/gbOpen/{country}/{level}"
        meta_res = requests.get(meta_url)

        if meta_res.status_code != 200:
            return jsonify({"error": "Failed to fetch metadata"}), 500

        meta = meta_res.json()

        # get the actual GeoJSON link
        geojson_url = meta.get("simplifiedGeometryGeoJSON")

        geo_res = requests.get(geojson_url)

        if geo_res.status_code != 200:
            return jsonify({"error": "Failed to fetch GeoJSON"}), 500

        geo_data = geo_res.json()

        # store in cache
        with cache_lock:
            geo_cache[key] = geo_data

        return jsonify(geo_data)

    except Exception as e:
        print("Geo fetch error:", e)
        return jsonify({"error": str(e)}), 500

from concurrent.futures import ThreadPoolExecutor, as_completed

@map_bp.route("/geo_batch", methods=["POST"])
#@jwt_required()
def geo_batch():
    data = request.json
    countries = data.get("countries", [])
    levels = data.get("levels", ["ADM0", "ADM1"])

    results = {}

    def fetch_one(country, level):
        key = f"{country}-{level}"

        # check cache safely
        with cache_lock:
            if key in geo_cache:
                return key, geo_cache[key]

        try:
            meta_url = f"https://www.geoboundaries.org/api/current/gbOpen/{country}/{level}"
            meta = requests.get(meta_url, timeout=5).json()
            geojson_url = meta.get("simplifiedGeometryGeoJSON")
            geo_data = requests.get(geojson_url, timeout=10).json()

            # store safely
            with cache_lock:
                geo_cache[key] = geo_data

            return key, geo_data

        except Exception as e:
            print("Error:", key, e)
            return key, None

    futures = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        for country in countries:
            for level in levels:
                futures.append(executor.submit(fetch_one, country, level))

        for future in as_completed(futures):
            key, value = future.result()
            if value:
                results[key] = value

    return jsonify(results)

def iso2_to_iso3(code):
    if not code:
        return None

    try:
        country = pycountry.countries.get(alpha_2=code)
        return country.alpha_3 if country else None
    except:
        return None
    
# gets location info from coords
@map_bp.route("/coord_location", methods=["GET"])
@jwt_required()
def coord_location():
    lat = request.args.get("lat")
    lng = request.args.get("lng")

    if lat is None or lng is None:
        return jsonify({"error": "Missing lat/lng"}), 400

    try:
        lat = float(lat)
        lng = float(lng)
    except ValueError:
        return jsonify({"error": "Invalid lat/lng"}), 400
    
    url = f"https://api.geoapify.com/v1/geocode/reverse?lat={lat}&lon={lng}"
    res = requests.get(
        url,
        headers={"Accept": "application/json"}, 
        params={
            "apiKey": _GEOAPIFY_KEY,
            "format": "json", 
            "limit": 1
        },
        timeout=5
    )
    
    if res.status_code != 200:
        return jsonify({
            "error": "Geoapify reverse failed",
            "status": res.status_code,
            "body": res.text[:200]
        }), 500
        
    data = res.json()
    
    features = data.get("results", [])

    if not features:
        return jsonify({})
    
    feature = features[0]
    
    city = feature.get("city") 
    state = feature.get("state") or feature.get("state_district") or feature.get("county") 
    country_iso3 = iso2_to_iso3( feature.get("country_code") )
    adm1_code = feature.get("iso3166_2")
    lat = feature.get("lat")
    lng = feature.get("lon")

    print(city)
    print(state)
    print(country_iso3)
    print(adm1_code)
    print(lat)
    print(lng)
    print()

    return jsonify({
        "city": city,
        "state": state,
        "adm1": adm1_code,
        "country": country_iso3,
        "lat": lat,
        "lng": lng
    })

@map_bp.route("/search")
@jwt_required()
def search():
    q = request.args.get("q")

    if not q:
        return jsonify({"error": "Missing query"}), 400
    
    
    url = f"https://api.geoapify.com/v1/geocode/autocomplete?text={q}"
    
    res = requests.get(
        url, 
        headers={"Accept": "application/json"}, 
        params={
            "apiKey": _GEOAPIFY_KEY,
            "format": "json", 
            "type": "city",
            "limit": 5
        },
        timeout=5
    )
    
    if res.status_code != 200:
        return jsonify({
            "error": "Geoapify failed",
            "status": res.status_code,
            "body": res.text[:200]
        }), 500
        
    data = res.json()

    results = []
    
    for feature in data.get("results", []):
        
        city = feature.get("city") 
        state = feature.get("state") or feature.get("state_district") or feature.get("county") 
        country_iso3 = iso2_to_iso3( feature.get("country_code") )
        adm1_code = feature.get("iso3166_2")
        lat = feature.get("lat")
        lng = feature.get("lon")
        
        print(city)
        print(state)
        print(country_iso3)
        print(adm1_code)
        print(lat)
        print(lng)
        print()
        

        results.append({
            "city": city,
            "state": state,
            "adm1": adm1_code,
            "country": country_iso3,
            "lat": lat,
            "lng": lng,
        })
    
    return jsonify(results)
