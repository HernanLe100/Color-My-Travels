from flask import jsonify, request, Blueprint

import requests
import pycountry
import os

_MAPBOX_TOKEN = os.getenv("MAPBOX_TOKEN")
_GEOAPIFY_KEY = os.getenv("GEOAPIFY_KEY")

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


@map_bp.route("/geo2", methods=["GET"])
def get_geo2():
    place_id = request.args.get("place_id")

    if not place_id:
        return jsonify({"error": "Missing place ID"}), 400

    try:
        # call Geoapify Place API
        url = f"https://api.geoapify.com/v2/place-details?id={place_id}"
        res = requests.get(
            url, 
            headers={"Accept": "application/json"}, 
            params={
                "apiKey": _GEOAPIFY_KEY,
                "features": "details", 
            }
        )

        if res.status_code != 200:
            return jsonify({"error": "Failed to fetch data"}), 500
        
        result = res.json()
        return jsonify(result)

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
    
# gets location info from coords
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
    
    city = feature.get("city") or feature.get("county") 
    state = feature.get("state") or feature.get("state_district") or feature.get("county") 
    country_iso3 = iso2_to_iso3( feature.get("country_code") )
    adm1_code = feature.get("iso3166_2")
    place_id = feature.get("place_id")

    return jsonify({
        "city": city,
        "state": state,
        "adm1": adm1_code,
        "country": country_iso3,
        "lat": lat, # use the queried coords, not returned coords
        "lng": lng
    })

@map_bp.route("/search")
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
            "lng": lng
        })
    
    return jsonify(results)
    

def place_part_of(place_id):
    url = f"https://api.geoapify.com/v1/boundaries/part-of?id={place_id}"
    
    res = requests.get(
        url, 
        headers={"Accept": "application/json"}, 
        params={
            "apiKey": _GEOAPIFY_KEY, 
            "geometry": "point"
        },
        timeout=5
    )
    if res.status_code != 200:
        pass
    
    data = res.json()
    
    # last place is country
    places = data.get("features")
    country = places[-1]
    # last place with an ADM1 code is state
    state = None
    for i in range(len(places)-2, -1, -1):
        if places[i].get("iso3166_2"):
            state = places[i]
            break
    
    results = country, state

    
    