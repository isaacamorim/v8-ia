import re
from models.cliente import Cliente

from utils.validators import validar_cnpj, validar_cpf


def validar_documento(doc):
    numeros = re.sub(r"[^\d]", "", doc)
    if len(numeros) == 14:
        return validar_cnpj(numeros)
    elif len(numeros) == 11:
        return validar_cpf(numeros)
    return False


def gerar_senha_padrao(documento):
    numeros = re.sub(r"[^\d]", "", documento)
    return numeros[-4:]
