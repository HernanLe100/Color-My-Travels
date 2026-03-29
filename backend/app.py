from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
import psycopg
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row
import requests

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
connection_pool = ConnectionPool(conninfo=DATABASE_URL, kwargs={"row_factory":dict_row}) 

app = Flask(__name__)
CORS(app)

@app.route("/test")
def test():
    return jsonify({"message": "Hello world"})

# not used
#def get_db_connection():
#    return psycopg.connect(DATABASE_URL) # connection_pool.connection() #  psycopg2.connect(DATABASE_URL)

@app.route("/get_users", methods=["GET"])
def get_users():
    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users;")
            result = cursor.fetchall()
            print(result)

    return jsonify({"db_response": result})

@app.route("/get_user", methods=["GET"])
def get_user():
    user_id = request.args.get("user_id", "")
    user_id = user_id.replace("\\", "\\\\")\
        .replace("%", "\\%").replace("_", "\\_")
    
    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM users WHERE user_id = %s::text;",  [user_id])
            result = cursor.fetchall()
            print(result)

    return jsonify({"db_response": result})

@app.route("/get_albums", methods=["GET"])
def get_albums():
    user_id = request.args.get("user_id", "")
    user_id = user_id.replace("\\", "\\\\")\
        .replace("%", "\\%").replace("_", "\\_")
    
    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM albums WHERE user_id = %s::text;", [user_id])
            result = cursor.fetchall()
    
    return jsonify({"db_response": result})

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
def get_colors():
    user_id = request.args.get("user_id", "")
    user_id = user_id.replace("\\", "\\\\")\
        .replace("%", "\\%").replace("_", "\\_")

    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM colors WHERE user_id = %s::text;", [user_id])
            result = cursor.fetchall()
    
    return jsonify({"db_response": result})

@app.route("/update_color", methods=["PUT"])
def update_color():
    data = request.get_json()
    user_id = data.get("user_id")
    location_id = data.get("location_id")
    adm = data.get("adm")
    color = data.get("color")
    with connection_pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "UPDATE colors SET color = %s WHERE user_id = %s::text AND location_id = %s AND adm = %s::text;",
                [color, user_id, location_id, adm]
            )
        connection.commit()
    return jsonify({"success": True})

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5001)