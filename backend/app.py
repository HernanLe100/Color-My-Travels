from flask import Flask, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

app = Flask(__name__)
CORS(app)

@app.route("/test")
def test():
    return jsonify({"message": "Hello world"})

def get_db_connection():
    return psycopg2.connect(DATABASE_URL)

@app.route("/get_users", methods=["GET"])
def get_users():
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("SELECT * FROM users;")
    result = cur.fetchall()

    cur.close()
    conn.close()

    return jsonify({"db_response": result})

if __name__ == "__main__":
    app.run(debug=True)