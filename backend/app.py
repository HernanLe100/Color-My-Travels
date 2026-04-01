from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
import psycopg
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row
import requests
import pycountry

import datetime
import flask_jwt_extended

from login import login_bp
from flask_jwt_extended import create_access_token
from flask_jwt_extended import jwt_required, get_jwt_identity

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
connection_pool = ConnectionPool(conninfo=DATABASE_URL, kwargs={"row_factory":dict_row}) 

app = Flask(__name__)
#app.register_blueprint(login_bp)

_FRONTEND_URL = os.environ["FRONTEND_URL"]
#CORS(app, resources={r'/api/*': {'origins': _FRONTEND_URL}}) <-- please keep this commented for now - Hernan
CORS(app)

_APP_SECRET_KEY = os.environ["APP_SECRET_KEY"]
app.config['JWT_SECRET_KEY'] = _APP_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=1)
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = datetime.timedelta(days=1)
jwt_manager = flask_jwt_extended.JWTManager(app)

@app.route("/test")
def test():
    return jsonify({"message": "Hello world"})


#import oauthlib.oauth2
from google.oauth2 import id_token
import google.auth
from google.auth.transport.requests import Request
CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]

@app.route("/ten", methods=["POST"])
def ten():
    token = request.get_json()["credential"]
    claims = id_token.verify_oauth2_token(token, Request(), CLIENT_ID)

    user_id = claims["sub"]
    name = claims.get("name", "")

    # insert user if not exists
    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO users (user_id, name)
                VALUES (%s, %s)
                ON CONFLICT (user_id) DO NOTHING;
            """, [user_id, name])
        connection.commit()

    # create JWT
    access_token = create_access_token(identity=user_id)

    return jsonify({
        "user_id": user_id,
        "name": name,
        "token": access_token
    })

@app.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()

    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT user_id, name FROM users WHERE user_id = %s;",
                [user_id]
            )
            user = cursor.fetchone()

    return jsonify(user)

@app.route("/get_albums", methods=["GET"])
@jwt_required()
def get_albums():
    user_id = get_jwt_identity()

    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT * FROM albums WHERE user_id = %s::text;",
                [user_id]
            )
            result = cursor.fetchall()

    return jsonify({"db_response": result})

# get location details by location_id
@app.route("/get_location", methods=["GET"])
def get_location():
    location_id = request.args.get("location_id", "")
    
    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT * FROM locations WHERE location_id = %s::text;", [location_id])
            result = cursor.fetchall()
    
    return jsonify({"db_response": result})

@app.route("/get_locations", methods=["GET"])
@jwt_required()
def get_locations():
    user_id = get_jwt_identity()

    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT locations.* FROM albums
                JOIN locations ON albums.location_id = locations.location_id
                WHERE albums.user_id = %s::text;
                """,
                [user_id]
            )

            result = cursor.fetchall()

    return jsonify({"db_response": result})

@app.route("/add_album", methods=["POST"])
@jwt_required()
def add_album():
    user_id = get_jwt_identity()
    data = request.get_json()

    location_id = data.get("location_id")
    caption = data.get("caption", "")

    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO albums (user_id, location_id, caption)
                VALUES (%s, %s, %s);
                """,
                [user_id, location_id, caption]
            )
        connection.commit()

    return jsonify({"success": True})

@app.route("/geo", methods=["GET"])
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

@app.route("/get_colors", methods=["GET"])
@jwt_required()
def get_colors():
    user_id = get_jwt_identity()

    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT * FROM colors
                WHERE user_id = %s::text
                ORDER BY region_code ASC;
                """,
                [user_id]
            )
            result = cursor.fetchall()

    return jsonify({"db_response": result})

@app.route("/update_color", methods=["PUT"])
@jwt_required()
def update_color():
    user_id = get_jwt_identity()
    data = request.get_json()

    region_code = data.get("region_code")
    region_type = data.get("region_type")
    color = data.get("color")

    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE colors
                SET color = %s
                WHERE user_id = %s
                  AND region_code = %s
                  AND region_type = %s;
                """,
                [color, user_id, region_code, region_type]
            )
        connection.commit()

    return jsonify({"success": True})
  
def iso2_to_iso3(code):
    if not code:
        return None

    try:
        country = pycountry.countries.get(alpha_2=code)
        return country.alpha_3 if country else None
    except:
        return None

@app.route("/search")
def search():
    q = request.args.get("q")

    url = f"https://nominatim.openstreetmap.org/search?q={q}&format=json&addressdetails=1&limit=5"
    res = requests.get(url, headers={"User-Agent": "color-my-travels"})
    data = res.json()

    results = []

    print(data)

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

        adm1_code = addr.get("ISO3166-2-lvl4")

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

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5001, ssl_context=("cert.pem", "key.pem"))