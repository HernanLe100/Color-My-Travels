import os
import datetime
import json
import flask
from dotenv import load_dotenv
import flask_jwt_extended
import flask_cors
import requests
import oauthlib.oauth2
# --------------------------------------------------
load_dotenv()
_APP_SECRET_KEY = os.environ["APP_SECRET_KEY"]
_FRONTEND_URL = os.environ["FRONTEND_URL"]
_GOOGLE_CLIENT_ID = os.environ["GOOGLE_CLIENT_ID"]
_GOOGLE_CLIENT_SECRET = os.environ["GOOGLE_CLIENT_SECRET"]
_GOOGLE_DISCOVERY_URL = "https://accounts.google.com/.well-known/openid-configuration"
# --------------------------------------------------
# sample code:
# app = flask.Flask(__name__, template_folder='.')
#app.secret_key = _APP_SECRET_KEY
#flask_cors.CORS(app, resources={r'/api/*': {'origins': _FRONTEND_URL}})
#app.config['JWT_SECRET_KEY'] = _APP_SECRET_KEY
#app.config['JWT_ACCESS_TOKEN_EXPIRES'] = datetime.timedelta(hours=1)
#app.config['JWT_REFRESH_TOKEN_EXPIRES'] = datetime.timedelta(days=1)
#jwt_manager = flask_jwt_extended.JWTManager(app)
# --------------------------------------------------
@app.route("/login", methods=["GET"])
def login():
    # redirect browser to authorization server
    original_url = flask.request.args.get("originalurl")
    google_provider_cfg = requests.get(_GOOGLE_DISCOVERY_URL, timeout=2).json()
    auth_endpoint = google_provider_cfg["authorization_endpoint"]
    client = oauthlib.oauth2.WebApplicationClient(_GOOGLE_CLIENT_ID)
    request_uri = client.prepare_request_uri(
        auth_endpoint,
        redirect_uri = flask.request.base_url + "/callback",
        scope=["openid", "email", "profile"],
        state=original_url
    )
    return flask.redirect(request_uri)
    # authorization server redirects browser to the login page
    # user logs in
    # authorization server redirects browser to callback endpoint, provides single use authorization code
# --------------------------------------------------
@app.route("/login/callback", methods=["GET"])
def callback():
    authorization_code = flask.request.args.get("code")
    # app sends authorization code to authorization server
    # authorization server sends access token and other tokens to app
    
    google_provider_cfg = requests.get(_GOOGLE_DISCOVERY_URL, timeout=2).json()
    token_endpoint = google_provider_cfg["token_endpoint"]
    client = oauthlib.oauth2.WebApplicationClient(_GOOGLE_CLIENT_ID)
    token_url, headers, body = client.prepare_token_request(
        token_endpoint,
        authorization_response=flask.request.url,
        redirect_url=flask.request.base_url,
        code=authorization_code
    )
    token_response = requests.post(
        token_url,
        headers=headers,
        data=body,
        auth=(_GOOGLE_CLIENT_ID, _GOOGLE_CLIENT_SECRET),
        timeout=2
    )
    # app uses the access token to fetch information about the user
    client.parse_request_body_response(
        json.dumps(token_response.json()))
    userinfo_endpoint = google_provider_cfg["userinfo_endpoint"]
    uri, headers, body = client.add_token(userinfo_endpoint)
    userinfo_response = requests.get(uri, headers=headers, data=body, timeout=2)
    # Optional: make sure email address is verified
    if not userinfo_response.json().get("email_verified"):
        message = "User email not available or not verified by Google."
        return message, 400
    # save the userinfo in the database
    # redirect the browser to the client with a nonce as an argument
    nonce = os.urandom(32).hex()
    userinfo_dict = userinfo_response.json()
    username = userinfo_dict.get("email", "")
    database.put_nonce(nonce, username)
    database.put_userinfo(username, json.dumps(userinfo_dict))
    original_url = flask.request.args.get("state")
    response = flask.redirect(_FRONTEND_URL + original_url + "?nonce=" + nonce)
    return response
# --------------------------------------------------
@app.route("/api/get_tokens", methods=["GET"])
def get_tokens():
    nonce = flask.request.args.get("nonce")
    if nonce is None:
        return
    username = database.get_nonce(nonce)
    if username is None:
        return
    database.delete_nonce(nonce)
    accesstoken = flask_jwt_extended.create_access_token(identity=username)
    refreshtoken = flask_jwt_extended.create_refresh_token(identity=username)
    return flask.jsonify([username, accesstoken, refreshtoken])
# --------------------------------------------------
# logging out of app
@app.route("/logout_app", methods=["GET"])
def logoutapp():
    # cannot invalidate JWTs, so best option is ask frontend to discard JWTs
    response = flask.redirect(_FRONTEND_URL + "/logout")
    return response
# --------------------------------------------------
#logging out of both app and Google
@app.route("/logout_google", methods=["GET"])
def logoutgoogle():
    # Log out of Google
    google_logout_page = 'https://www.google.com/accounts/Logout'
    #google_logout_page="https://mail.google.com/mail/u/0/?logout&hl=en"
    response = flask.redirect(google_logout_page)
    return response
def main():
    print("hello there")
if __name__ == "__main__":
    main()