# produto.py
from ..extensions import db
import base64


class Produto(db.Model):
    __tablename__ = "J_V_PRODUTO_COMPLEMENTO"

    JRO_PROID = db.Column(db.Integer, primary_key=True)
    JRO_PROERP = db.Column(db.String(100))
    JRO_DESCRI = db.Column(db.String(255), nullable=False)
    JPC_MOSTRA_REPOSICAO = db.Column(db.Integer, default=0)
    JPC_PALAVRAS_CHAVE = db.Column(db.String(4000))
    JPC_QTD_MINIMA = db.Column(db.String)
    JPC_PASSO_QTD = db.Column(db.String)
    IMG_IMAGEM = db.Column(db.LargeBinary)  # importante!

    def to_dict(self):
        imagem_base64 = ""
        if self.IMG_IMAGEM:
            try:
                imagem_base64 = base64.b64encode(self.IMG_IMAGEM).decode("utf-8")
            except Exception:
                imagem_base64 = ""
        return {
            "id": self.JRO_PROID,
            "cod": self.JRO_PROERP,
            "descricao": self.JRO_DESCRI,
            "mostrar": self.JPC_MOSTRA_REPOSICAO,
            "palavras_chave": self.JPC_PALAVRAS_CHAVE,
            "minima": self.JPC_QTD_MINIMA,
            "passo": self.JPC_PASSO_QTD,
            "imagem": imagem_base64,
        }
