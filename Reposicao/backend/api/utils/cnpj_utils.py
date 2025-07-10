import re


def limpar_cnpj(cnpj):
    """Remove caracteres não numéricos do CNPJ/CPF"""
    return re.sub(r"[^\d]", "", cnpj)


def validar_documento(documento):
    """Validação básica de formato de CNPJ/CPF"""
    numeros = limpar_cnpj(documento)
    return len(numeros) in (11, 14)  # CPF (11) ou CNPJ (14)


def formatar_cnpj(cnpj):
    """Formata CNPJ para exibição"""
    numeros = limpar_cnpj(cnpj)
    if len(numeros) == 11:
        return f"{numeros[:3]}.{numeros[3:6]}.{numeros[6:9]}-{numeros[9:]}"
    elif len(numeros) == 14:
        return f"{numeros[:2]}.{numeros[2:5]}.{numeros[5:8]}/{numeros[8:12]}-{numeros[12:]}"
    return cnpj
