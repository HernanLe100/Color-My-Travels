import os
from dotenv import load_dotenv
from flask import jsonify, request, Blueprint

from google.oauth2 import id_token
from google.auth.transport.requests import Request as GoogleRequest
from flask_jwt_extended import (
    create_access_token,
    get_csrf_token,
    get_jwt,
    jwt_required,
    set_access_cookies,
    unset_jwt_cookies,
)

import database as db
from request_guards import apply_navigation_guard
# --------------------------------------------------

login_bp = Blueprint("login", __name__)
apply_navigation_guard(login_bp)

load_dotenv()

_GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]

# --------------------------------------------------

@login_bp.route("/login_success", methods=["POST"])
def login_success():
    data = request.get_json() or {}
    token = data.get("credential")
    if not token:
        return jsonify({"error": "credential required"}), 400

    try:
        claims = id_token.verify_oauth2_token(token, GoogleRequest(), _GOOGLE_CLIENT_ID)
    except Exception:
        return jsonify({"error": "Invalid Google credential"}), 401

    user_id = claims["sub"]
    name = claims.get("name", "")

    # insert user if not exists
    db.add_user(user_id, name)

    # create JWT
    access_token = create_access_token(identity=user_id)

    response = jsonify({
        "user_id": user_id,
        "name": name,
        "authenticated": True,
        "csrf_token": get_csrf_token(access_token),
    })
    set_access_cookies(response, access_token)
    return response


@login_bp.route("/csrf_token", methods=["GET"])
@jwt_required()
def csrf_token():
    claims = get_jwt()
    return jsonify({"csrf_token": claims.get("csrf")})


@login_bp.route("/logout", methods=["POST"])
def logout():
    response = jsonify({"logout": True})
    unset_jwt_cookies(response)
    return response
