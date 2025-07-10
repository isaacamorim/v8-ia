from app import db


class Produto(db.Model):
    __tablename__ = "J_PRODUTO"
    JRO_PROID = db.Column(db.Integer, primary_key=True)
    JRO_DESCRI = db.Column(db.String(255), nullable=False)
    JRO_MOSTRA_REPOSICAO = db.Column(db.Boolean, default=False)
    JRO_PALAVRAS_CHAVE = db.Column(db.Text)
    JRO_QTD_MINIMA = db.Column(db.Integer, default=1)
    JRO_PASSO_QTD = db.Column(db.Integer, default=1)

    def to_dict(self):
        return {
            "id": self.JRO_PROID,
            "descricao": self.JRO_DESCRI,
            "minima": self.JRO_QTD_MINIMA,
            "passo": self.JRO_PASSO_QTD,
        }
