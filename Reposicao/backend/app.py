from flask import Flask
from flask_session import Session
from config import Config
from extensions import db, bcrypt
import os
import sys

# Adiciona o diretório atual ao path do Python
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Inicializar a sessão
session_ext = Session()


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Inicializar extensões
    db.init_app(app)
    bcrypt.init_app(app)
    session_ext.init_app(app)

    # Registrar blueprints
    from routes.auth import auth_bp
    from routes.produtos import produtos_bp
    from routes.carrinho import carrinho_bp
    from routes.whatsapp import whatsapp_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(produtos_bp, url_prefix="/api/produtos")
    app.register_blueprint(carrinho_bp, url_prefix="/api/carrinho")
    app.register_blueprint(whatsapp_bp, url_prefix="/api/pedido")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=True)
