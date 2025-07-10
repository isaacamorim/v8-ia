from backend.api.app import db


class CarrinhoTemp(db.Model):
    __tablename__ = "J_CARRINHO_TEMP"
    JCT_ID = db.Column(db.Integer, primary_key=True)
    JCT_SESSION_ID = db.Column(db.String(100), nullable=False)
    JCT_PROID = db.Column(db.Integer, db.ForeignKey("J_PRODUTO.JRO_PROID"))
    JCT_QUANTIDADE = db.Column(db.Integer, nullable=False)
    JCT_CNPJ_TEMP = db.Column(db.String(20))