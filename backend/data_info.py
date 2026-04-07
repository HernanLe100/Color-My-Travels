import os
from dotenv import load_dotenv

from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity

import database as db
# --------------------------------------------------

info_bp = Blueprint("info", __name__)

load_dotenv()

_FRONTEND_URL = os.environ.get("FRONTEND_URL")

_GOOGLE_CLIENT_SECRET = os.environ["GOOGLE_CLIENT_SECRET"]
_GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"

_GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]

# --------------------------------------------------

# --------------------------------------------------

@info_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    
    user = db.get_user(user_id)

    return jsonify(user)

# --------------------------------------------------

@info_bp.route("/get_albums", methods=["GET"])
@jwt_required()
def get_albums():
    user_id = get_jwt_identity()

    result = db.get_albums(user_id)
    
    return jsonify({"db_response": result})

@info_bp.route("/add_album", methods=["POST"])
@jwt_required()
def add_album():
    user_id = get_jwt_identity()
    data = request.get_json()

    location_id = data.get("location_id")
    caption = data.get("caption", "")

    db.add_album(
        {
            "user_id": user_id,
            "location_id": location_id,
            "caption": caption
        }
    )

    return jsonify({"success": True})

# --------------------------------------------------

# get location details by location_id
@info_bp.route("/get_location", methods=["GET"])
def get_location():
    location_id = request.args.get("location_id", "")
    
    result = db.get_location(location_id)
    
    return jsonify({"db_response": result})

@info_bp.route("/get_locations", methods=["GET"])
@jwt_required()
def get_locations():
    user_id = get_jwt_identity()

    result = db.get_locations(user_id)

    return jsonify({"db_response": result})

# --------------------------------------------------

@info_bp.route("/get_colors", methods=["GET"])
@jwt_required()
def get_colors():
    user_id = get_jwt_identity()

    result = db.get_colors(user_id)

    return jsonify({"db_response": result})

@info_bp.route("/update_color", methods=["PUT"])
@jwt_required()
def update_color():
    user_id = get_jwt_identity()
    data = request.get_json()

    region_code = data.get("region_code")
    region_type = data.get("region_type")
    color = data.get("color")

    db.update_color({
        "color": color,
        "user_id": user_id,
        "region_code": region_code,
        "region_type": region_type
    })

    return jsonify({"success": True})