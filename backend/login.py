import os
from dotenv import load_dotenv
from flask import jsonify, request, Blueprint

from google.oauth2 import id_token
from google.auth.transport.requests import Request as GoogleRequest
from flask_jwt_extended import create_access_token

import database as db
# --------------------------------------------------

login_bp = Blueprint("login", __name__)

load_dotenv()

#_FRONTEND_URL = "https://localhost:5173" #os.environ["FRONTEND_URL"]

#_GOOGLE_CLIENT_SECRET = os.environ["GOOGLE_CLIENT_SECRET"]
#_GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"

_GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]

# --------------------------------------------------

@login_bp.route("/login_success", methods=["POST"])
def login_success():
    token = request.get_json()["credential"]
    claims = id_token.verify_oauth2_token(token, GoogleRequest(), _GOOGLE_CLIENT_ID)
    print(claims)

    user_id = claims["sub"]
    name = claims.get("name", "")

    # insert user if not exists
    db.add_user(user_id, name)

    # create JWT
    access_token = create_access_token(identity=user_id)

    return jsonify({
        "user_id": user_id,
        "name": name,
        "token": access_token
    })
