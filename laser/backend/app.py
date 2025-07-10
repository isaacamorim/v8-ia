# backend/app.py
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from api.routes import api
from api.laser.controllers_v2 import laser_v2_bp

BASE_PROJECT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
FRONTEND_DIR = os.path.join(BASE_PROJECT_DIR, "front")
IMGS_DIR = os.path.join(BASE_PROJECT_DIR, "imgs")

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# ✅ Registrar blueprints apenas uma vez
app.register_blueprint(api)
app.register_blueprint(laser_v2_bp)  # Não repita essa linha depois


@app.route("/")
def index():
    return send_from_directory(FRONTEND_DIR, "index.html")


@app.route("/<path:filename>")
def serve_static_from_front(filename):
    if filename == "index.html":
        pass  # Deixa a rota "/" tratar
    return send_from_directory(FRONTEND_DIR, filename)


@app.route("/imgs/<path:filename>")
def serve_images(filename):
    return send_from_directory(IMGS_DIR, filename)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)


# "C:\Users\nh_9\AppData\Local\Programs\Python\Python313\python.exe" "\\10.42.92.192\Diversos\Isaac\compartilhado\Site\SITE HTML\v8 ia\laser\backend\app.py"
