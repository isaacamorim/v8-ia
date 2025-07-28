# ========== 1. utils/cnpj_utils.py ==========
import re
from typing import Tuple, Optional


def limpar_cnpj(documento: str) -> str:
    """Remove caracteres especiais do CNPJ/CPF"""
    return re.sub(r"[^\d]", "", documento)


def validar_cnpj(cnpj: str) -> bool:
    """Valida CNPJ usando algoritmo oficial"""
    cnpj = limpar_cnpj(cnpj)

    if len(cnpj) != 14:
        return False

    # Verifica se todos os dígitos são iguais
    if cnpj == cnpj[0] * 14:
        return False

    # Calcula primeiro dígito verificador
    soma = 0
    peso = 5
    for i in range(12):
        soma += int(cnpj[i]) * peso
        peso -= 1
        if peso < 2:
            peso = 9

    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto

    if int(cnpj[12]) != digito1:
        return False

    # Calcula segundo dígito verificador
    soma = 0
    peso = 6
    for i in range(13):
        soma += int(cnpj[i]) * peso
        peso -= 1
        if peso < 2:
            peso = 9

    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto

    return int(cnpj[13]) == digito2


def validar_cpf(cpf: str) -> bool:
    """Valida CPF usando algoritmo oficial"""
    cpf = limpar_cnpj(cpf)

    if len(cpf) != 11:
        return False

    # Verifica se todos os dígitos são iguais
    if cpf == cpf[0] * 11:
        return False

    # Calcula primeiro dígito verificador
    soma = 0
    for i in range(9):
        soma += int(cpf[i]) * (10 - i)

    resto = soma % 11
    digito1 = 0 if resto < 2 else 11 - resto

    if int(cpf[9]) != digito1:
        return False

    # Calcula segundo dígito verificador
    soma = 0
    for i in range(10):
        soma += int(cpf[i]) * (11 - i)

    resto = soma % 11
    digito2 = 0 if resto < 2 else 11 - resto

    return int(cpf[10]) == digito2


def limpar_documento(documento: str) -> str:
    """Remove formatação de CPF/CNPJ"""
    return re.sub(r"\D", "", documento)  # Remove tudo que não é dígito


def validar_documento(documento: str) -> bool:
    """Valida CNPJ ou CPF incluindo dígitos verificadores"""
    numeros = limpar_documento(documento)

    if len(numeros) == 11:
        return validar_cpf(numeros)
    elif len(numeros) == 14:
        return validar_cnpj(numeros)
    return False  # 

def gerar_senha_padrao(documento: str) -> str:
    """Gera senha padrão com os últimos 4 dígitos"""
    numeros = limpar_cnpj(documento)
    return numeros[-4:]

def formatar_documento(documento: str) -> str:
    """Formata CNPJ/CPF para exibição"""
    numeros = limpar_cnpj(documento)

    if len(numeros) == 14:
        return f"{numeros[:2]}.{numeros[2:5]}.{numeros[5:8]}/{numeros[8:12]}-{numeros[12:]}"
    elif len(numeros) == 11:
        return f"{numeros[:3]}.{numeros[3:6]}.{numeros[6:9]}-{numeros[9:]}"
    else:
        return documento  # Retorna original se não for CNPJ/CPF válido
