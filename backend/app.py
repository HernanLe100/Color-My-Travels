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
jwt = JWTManager(app)

app.register_blueprint(login_bp) 
app.register_blueprint(info_bp)
app.register_blueprint(map_bp)

CORS(app, origins=[_FRONTEND_URL]) 

# --------------------------------------------------
def jwt_error(message, code):
    return jsonify({
        "error": message
    }), code

@jwt.unauthorized_loader # Runs when no token is provided at all
def unauthorized(_):
    return jwt_error("Unauthorized", 401)

@jwt.expired_token_loader # Runs when a token has expired
def expired_session(_, __):
    return jwt_error("Expired session", 400)

@jwt.invalid_token_loader # Runs if the token is malformed or forged
def invalid_token(_):
    return jwt_error("Invalid token", 422)
# --------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5001, ssl_context=("cert.pem", "key.pem"))