from flask import jsonify, request, Blueprint

import requests
import pycountry

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

    url = "https://nominatim.openstreetmap.org/reverse"

    res = requests.get(
        url,
        params={
            "format": "json",
            "zoom": 10,
            "lat": lat,
            "lon": lng,
        },
        headers={"User-Agent": "color-my-travels"},
        timeout=5,
    )

    print("STATUS:", res.status_code)
    print("BODY:", res.text[:300])

    if res.status_code != 200:
        return jsonify({
            "error": "Reverse geocoding failed",
            "status": res.status_code
        }), 500

    try:
        data = res.json()
    except Exception as e:
        print("JSON ERROR:", e)
        return jsonify({
            "error": "Invalid response from geocoder"
        }), 500

    addr = data.get("address", {})

    city = (
        addr.get("city")
        or addr.get("town")
        or addr.get("village")
        or addr.get("municipality")
        or addr.get("county")
        or addr.get("province")
    )

    state = (
        addr.get("state")
        or addr.get("region")
        or addr.get("state_district")
    )

    adm1_code = addr.get("ISO3166-2-lvl4") or addr.get("ISO3166-2-lvl5")

    if not city:
        city = state

    country_iso3 = iso2_to_iso3(addr.get("country_code", "").upper())

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

    url = "https://nominatim.openstreetmap.org/search"

    res = requests.get(
        url,
        params={
            "q": q,
            "format": "json",
            "addressdetails": 1,
            "limit": 5,
        },
        headers={"User-Agent": "color-my-travels"},
    )

    print("STATUS:", res.status_code)
    print("HEADERS:", res.headers.get("content-type"))
    print("BODY:", res.text[:500])  # only first 500 chars

    if res.status_code != 200:
        return jsonify({
            "error": "Upstream failed",
            "status": res.status_code,
            "body": res.text[:200]
        }), 500

    try:
        data = res.json()
    except Exception as e:
        print("JSON PARSE ERROR:", e)
        return jsonify({
            "error": "Invalid JSON from upstream",
            "body": res.text[:200]
        }), 500

    results = []

    #print(data)

    for p in data:
        addr = p.get("address", {})

        print(addr)

        city = (
            addr.get("city")
            or addr.get("town")
            or addr.get("village")
            or addr.get("municipality")
            or addr.get("county")
            or addr.get("province")
        )

        state = (
            addr.get("state")
            or addr.get("region")
            or addr.get("state_district")
        )

        adm1_code = addr.get("ISO3166-2-lvl4") or addr.get("ISO3166-2-lvl5")

        if not city:
            city = state

        country_iso3 = iso2_to_iso3(addr.get("country_code", "").upper())

        results.append({
            "city": city,
            "state": state,
            "adm1": adm1_code,
            "country": country_iso3,
            "lat": float(p["lat"]),
            "lng": float(p["lon"])
        })

    return results