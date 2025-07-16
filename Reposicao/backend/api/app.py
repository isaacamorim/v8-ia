from flask import Flask 
from .extensions import db, bcrypt, session_ext
from .config import Config
from flask_cors import CORS


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Inicializar extensões
    db.init_app(app)
    bcrypt.init_app(app)
    session_ext.init_app(app)

    # Configurar CORS
    CORS(
        app,
        resources={r"/api/*": {"origins": "http://127.0.0.1:5500"}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization"],
    )

    from .routes import auth_bp, produtos_bp, carrinho_bp, whatsapp_bp, cnpj_verification
    from .routes.cnpj_verification import cnpj_bp  # Importação direta

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(produtos_bp, url_prefix="/api/produtos")
    app.register_blueprint(carrinho_bp, url_prefix="/api/carrinho")
    app.register_blueprint(whatsapp_bp, url_prefix="/api/pedido")
    app.register_blueprint(cnpj_bp, url_prefix="/api/cnpj")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True)
