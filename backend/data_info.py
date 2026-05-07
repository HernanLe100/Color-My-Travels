import os
from dotenv import load_dotenv

from flask import jsonify, request, Blueprint
from flask_jwt_extended import jwt_required, get_jwt_identity

import database as db
# --------------------------------------------------

info_bp = Blueprint("info", __name__)

load_dotenv()

_FRONTEND_URL = os.environ.get("FRONTEND_URL")

#_GOOGLE_CLIENT_SECRET = os.environ["GOOGLE_CLIENT_SECRET"]
_GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"

_GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]

# --------------------------------------------------

# route to spin up Render server or keep it active
@info_bp.route("/ping")
def ping():
    return jsonify({"status": "ok"}), 200

# --------------------------------------------------

@info_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = get_jwt_identity()
    
    user = db.get_user(user_id)

    return jsonify(user)


@info_bp.route("/delete_user", methods=["DELETE"])
@jwt_required()
def delete_user():
    user_id = get_jwt_identity()
    
    db.delete_user(user_id)

    return jsonify({"success": True})

# --------------------------------------------------

@info_bp.route("/send_friend_request", methods=["POST"])
@jwt_required()
def send_friend_request_route():
    sender_id = get_jwt_identity()
    data = request.get_json()

    # remove leading/trailing whitespace in backend: future updates could allow usernames with spaces?
    receiver_id = data.get("receiver_id").strip()
    if not receiver_id:
        return jsonify({"error": "receiver_id required"}), 400

    result = db.send_friend_request(sender_id, receiver_id)

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result)

@info_bp.route("/accept_friend_request", methods=["POST"])
@jwt_required()
def accept_friend_request_route():
    receiver_id = get_jwt_identity()  # current user
    data = request.get_json()

    sender_id = data.get("sender_id")
    if not sender_id:
        return jsonify({"error": "sender_id required"}), 400

    result = db.accept_friend_request(sender_id, receiver_id)

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result)


@info_bp.route("/reject_friend_request", methods=["POST"])
@jwt_required()
def reject_friend_request_route():
    receiver_id = get_jwt_identity()
    data = request.get_json()

    sender_id = data.get("sender_id")
    if not sender_id:
        return jsonify({"error": "sender_id required"}), 400

    result = db.reject_friend_request(sender_id, receiver_id)

    return jsonify(result)


@info_bp.route("/get_friend_requests", methods=["GET"])
@jwt_required()
def get_friend_requests():
    user_id = get_jwt_identity()

    result = db.get_incoming_requests(user_id)

    return jsonify({"requests": result})


@info_bp.route("/get_friends", methods=["GET"])
@jwt_required()
def get_friends():
    user_id = get_jwt_identity()

    result = db.get_friends(user_id)

    return jsonify({"friends": result})


@info_bp.route("/get_sent_requests", methods=["GET"])
@jwt_required()
def get_sent_requests():
    user_id = get_jwt_identity()
    result = db.get_sent_requests(user_id)
    return jsonify({"requests": result})


@info_bp.route("/cancel_friend_request", methods=["DELETE"])
@jwt_required()
def cancel_friend_request():
    user_id = get_jwt_identity()
    receiver_id = request.args.get("receiver_id")
    result = db.cancel_friend_request(user_id, receiver_id)
    return jsonify(result)


@info_bp.route("/delete_friend", methods=["DELETE"])
@jwt_required()
def delete_friend():
    user_id = get_jwt_identity()
    friend_id = request.args.get("friend_id")
    result = db.delete_friend(user_id, friend_id)
    return jsonify(result)


@info_bp.route("/get_friends_albums", methods=["GET"])
@jwt_required()
def get_friends_albums():
    user_id = get_jwt_identity()

    result = db.get_friends_albums(user_id)
    print(result)

    return jsonify({"albums": result})

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
    notes = data.get("notes", "")
    start_date = data.get("start_date") or None
    end_date = data.get("end_date") or None
    name = data.get("name", "")

    result = db.add_album(
        {
            "user_id": user_id,
            "location_id": location_id,
            "notes": notes,
            "start_date": start_date,
            "end_date": end_date,
            "name": name
        }
    )

    if isinstance(result, dict) and result.get("error"):
        return jsonify(result), 400

    return jsonify({"album_id": result})


@info_bp.route("/edit_album", methods=["PUT"])
@jwt_required()
def edit_album():
    user_id = get_jwt_identity()
    data = request.get_json()

    album_id = data.get("album_id")
    
    modified = {
        "user_id": user_id,
        "album_id": album_id, 
        "name": data.get("name", ""),
        
        "notes": data.get("notes", ""),
        "pages": data.get("pages", []),
        "start_date": data.get("start_date") or None,
        "end_date": data.get("end_date") or None
    }
    
    original = db.get_album(user_id, album_id)

    db.update_album(original, modified)

    return jsonify({"success": True})


@info_bp.route("/delete_album", methods=["DELETE"])
@jwt_required()
def delete_album():
    user_id = get_jwt_identity()
    album_id = request.args.get("album_id", type=int)

    db.delete_album({
        "album_id": album_id,
        "user_id": user_id,
    })

    return jsonify({"success": True})

# --------------------------------------------------

@info_bp.route("/get_locations", methods=["GET"])
@jwt_required()
def get_locations():
    user_id = get_jwt_identity()

    result = db.get_locations(user_id)

    return jsonify({"db_response": result})


@info_bp.route("/ensure_location", methods=["POST"])
@jwt_required()
def ensure_location():
    data = request.get_json() or {}
    if not data.get("city") or not data.get("country"):
        return jsonify({"error": "city and country are required"}), 400
    if data.get("lat") is None or data.get("lng") is None:
        return jsonify({"error": "lat and lng are required"}), 400
    location_id = db.ensure_location(
        {
            "city": data.get("city"),
            "country": data.get("country"),
            "adm1": data.get("adm1"),
            "lat": data.get("lat"),
            "lng": data.get("lng"),
            "country_name": data.get("country_name"),
            "adm1_name": data.get("adm1_name"),
        }
    )
    return jsonify({"location_id": location_id})

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

@info_bp.route("/upload_image", methods=["POST"])
@jwt_required()
def upload_image_route():
    user_id = get_jwt_identity()

    if "file" not in request.files:
        return jsonify({"error": "No file"}), 400

    file = request.files["file"]
    album_id = request.form.get("album_id")
    caption = request.form.get("caption", "")

    result = db.upload_image(file, user_id, album_id, caption)

    if not result:
        return jsonify({"error": "Upload failed"}), 500

    return jsonify(result)