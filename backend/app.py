import os
from dotenv import load_dotenv

from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager

import datetime

from login import login_bp
from data_info import info_bp
from map_info import map_bp

# --------------------------------------------------

load_dotenv()

app = Flask(__name__)

_FRONTEND_URL = os.environ.get("FRONTEND_URL") 

_APP_SECRET_KEY = os.environ.get("APP_SECRET_KEY")
app.config['JWT_SECRET_KEY'] = _APP_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=1) 
app.config['JWT_REFRESH_TOKEN_EXPIRES'] = datetime.timedelta(days=1)

app.config["JWT_TOKEN_LOCATION"] = ["cookies"]
app.config["JWT_ACCESS_COOKIE_NAME"] = "color_my_travels_access_token_cookie"
app.config["JWT_COOKIE_HTTPONLY"] = True
app.config["JWT_COOKIE_SECURE"] = True
app.config["JWT_COOKIE_SAMESITE"] = "None"

app.config['JWT_ACCESS_CSRF_COOKIE_NAME'] = "color_my_travels_csrf_access_token"
app.config["JWT_COOKIE_CSRF_PROTECT"] = True
app.config["JWT_CSRF_IN_COOKIES"] = True
app.config["JWT_CSRF_METHODS"] = ["POST", "PUT", "PATCH", "DELETE"]
jwt = JWTManager(app)

app.register_blueprint(login_bp) 
app.register_blueprint(info_bp)
app.register_blueprint(map_bp)

CORS(app, origins=[_FRONTEND_URL], supports_credentials=True)

# --------------------------------------------------

@jwt.unauthorized_loader
def unauthorized(reason):
    return jsonify({
        "error": "Authorization failed",
        "reason": reason
    }), 401

@jwt.invalid_token_loader
def invalid_token(reason):
    return jsonify({
        "error": "Invalid token",
        "reason": reason
    }), 422

@jwt.expired_token_loader
def expired_token(jwt_header, jwt_payload):
    return jsonify({
        "error": "Token expired"
    }), 401

    

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5001, ssl_context=("cert.pem", "key.pem"))