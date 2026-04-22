from flask import jsonify, request, Blueprint

import requests
import pycountry
import os

_MAPBOX_TOKEN = os.getenv("MAPBOX_TOKEN")

# --------------------------------------------------

map_bp = Blueprint("map", __name__)

# --------------------------------------------------

@map_bp.route("/geo", methods=["GET"])
def get_geo():
    country = request.args.get("country")
    level = request.args.get("level") # ADM0 or ADM1

    if not country or not level:
        return jsonify({"error": "Missing country or level"}), 400

    try:
        # call geoBoundaries metadata API
        meta_url = f"https://www.geoboundaries.org/api/current/gbOpen/{country}/{level}"
        meta_res = requests.get(meta_url)

        if meta_res.status_code != 200:
            return jsonify({"error": "Failed to fetch metadata"}), 500

        meta = meta_res.json()

        # get the actual GeoJSON link
        geojson_url = meta.get("simplifiedGeometryGeoJSON")

        if not geojson_url:
            return jsonify({"error": "No GeoJSON URL found"}), 500

        # fetch the actual geometry
        geo_res = requests.get(geojson_url)

        if geo_res.status_code != 200:
            return jsonify({"error": "Failed to fetch GeoJSON"}), 500

        geo_data = geo_res.json()

        return jsonify(geo_data)

    except Exception as e:
        print("Geo fetch error:", e)
        return jsonify({"error": str(e)}), 500


def iso2_to_iso3(code):
    if not code:
        return None

    try:
        country = pycountry.countries.get(alpha_2=code)
        return country.alpha_3 if country else None
    except:
        return None
    
@map_bp.route("/coord_location", methods=["GET"])
@map_bp.route("/coord_location", methods=["GET"])
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

    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{lng},{lat}.json"

    res = requests.get(
        url,
        params={
            "access_token": _MAPBOX_TOKEN,
            "types": "place,locality"
        },
        timeout=5
    )

    if res.status_code != 200:
        return jsonify({
            "error": "Mapbox reverse failed",
            "status": res.status_code,
            "body": res.text[:200]
        }), 500

    data = res.json()

    features = data.get("features", [])

    if not features:
        return jsonify([])

    feature = features[0]
    context = feature.get("context", [])

    city = feature.get("text")

    state = None
    country_iso3 = None
    adm1_code = None

    for c in context:
        if "region" in c["id"]:
            state = c.get("text")
            adm1_code = c.get("short_code")
        if "country" in c["id"]:
            iso2 = c.get("short_code", "").upper()
            country_iso3 = iso2_to_iso3(iso2)

    return jsonify([{
        "city": city,
        "state": state,
        "adm1": adm1_code,
        "country": country_iso3,
        "lat": lat,
        "lng": lng
    }])

@map_bp.route("/search")
def search():
    q = request.args.get("q")

    if not q:
        return jsonify({"error": "Missing query"}), 400

    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{q}.json"

    res = requests.get(
        url,
        params={
            "access_token": _MAPBOX_TOKEN,
            "limit": 5,
            "types": "place,locality"
        },
        timeout=5
    )

    if res.status_code != 200:
        return jsonify({
            "error": "Mapbox failed",
            "status": res.status_code,
            "body": res.text[:200]
        }), 500

    data = res.json()

    results = []

    for feature in data.get("features", []):
        context = feature.get("context", [])

        city = feature.get("text")

        state = None
        country_iso3 = None
        adm1_code = None

        for c in context:
            if "region" in c["id"]:
                state = c.get("text")
                adm1_code = c.get("short_code")  # like "US-PA"
            if "country" in c["id"]:
                iso2 = c.get("short_code", "").upper()
                country_iso3 = iso2_to_iso3(iso2)

        lng, lat = feature["center"]

        results.append({
            "city": city,
            "state": state,
            "adm1": adm1_code,
            "country": country_iso3,
            "lat": lat,
            "lng": lng
        })

    return jsonify(results)