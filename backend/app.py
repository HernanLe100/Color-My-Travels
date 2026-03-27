from flask import Flask, jsonify, request
from flask_cors import CORS
import os
from dotenv import load_dotenv
import psycopg
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
connection_pool = ConnectionPool(conninfo=DATABASE_URL, kwargs={"row_factory":dict_row}) 

app = Flask(__name__)
CORS(app)

@app.route("/test")
def test():
    return jsonify({"message": "Hello world"})

def get_db_connection():
    return psycopg.connect(DATABASE_URL) # connection_pool.connection() #  psycopg2.connect(DATABASE_URL)

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
            cursor.execute(f"SELECT * FROM users WHERE user_id = %s::text;",  [user_id])
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
            cursor.execute(f"SELECT * FROM albums WHERE user_id = %s::text;", [user_id])
            result = cursor.fetchall()
    
    return jsonify({"db_response": result})

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5001)