from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route("/test")
def test():
    return jsonify({"message": "Hello world"})

if __name__ == "__main__":
    app.run(debug=True)