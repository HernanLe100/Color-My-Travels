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

"""
Some possibly useful info:
@jwt.expired_token_loader: Runs when a token has expired.
@jwt.invalid_token_loader: Runs if the token is malformed or forged.
@jwt.unauthorized_loader: Runs when no token is provided at all.
"""

app.register_blueprint(login_bp) 
app.register_blueprint(info_bp)
app.register_blueprint(map_bp)

CORS(app)
#CORS(app, origins=[_FRONTEND_URL]) # <-- please keep this commented for now - Hernan

# --------------------------------------------------

# NOTE: use cookies if want to protect against XSS


@jwt.unauthorized_loader
def unauthorized(reason):
    return "<h1>ERROR 401</h1>", 401

    #return jsonify({
    #    "error": "Authorization failed",
    #    "reason": reason
    #}), 401

    

if __name__ == "__main__":
    app.run(debug=True, use_reloader=False, port=5001, ssl_context=("cert.pem", "key.pem"))