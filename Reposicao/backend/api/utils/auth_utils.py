# utils/auth_utils.py

import re
from ..models.cliente import Cliente
from .validators import validar_cnpj, validar_cpf
from ..extensions import bcrypt  # necessário para hashear/verificar senhas
from flask import session


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


def hash_senha(senha):
    return bcrypt.generate_password_hash(senha).decode()


def verificar_senha(senha, hash_senha):
    return bcrypt.check_password_hash(hash_senha, senha)


def criar_sessao_usuario(cliente_id, cnpj, nome):
    session["usuario_logado"] = True
    session["cliente_id"] = cliente_id
    session["cnpj"] = cnpj
    session["nome"] = nome
