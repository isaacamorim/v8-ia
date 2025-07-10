from flask import Flask
from .extensions import db, bcrypt, session_ext
from .config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    bcrypt.init_app(app)
    session_ext.init_app(app)

    from .routes import auth_bp  # , produtos_bp, carrinho_bp, whatsapp_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(produtos_bp, url_prefix="/api/produtos")
    app.register_blueprint(carrinho_bp, url_prefix="/api/carrinho")
    app.register_blueprint(whatsapp_bp, url_prefix="/api/pedido")
    return app

if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
