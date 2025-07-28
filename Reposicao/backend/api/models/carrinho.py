# models/carrinho.py
from ..extensions import db


class CarrinhoTemp(db.Model):
    __tablename__ = "J_CARRINHO_TEMP"
    __table_args__ = {"extend_existing": True}

    JCT_ID = db.Column(db.Integer, primary_key=True)
    JCT_SESSION_ID = db.Column(db.String(255), nullable=False)
    JCT_PROID = db.Column(db.Integer, nullable=False)
    JCT_QUANTIDADE = db.Column(db.Integer, nullable=False)
    JCT_DATA_ADICAO = db.Column(db.DateTime, server_default=db.func.now())
    JCT_CNPJ_TEMP = db.Column(db.String(20))
    JCT_STATUS = db.Column(db.String(20))
