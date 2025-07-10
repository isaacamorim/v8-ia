@ -1,16 +0,0 @@
import re


def validar_documento(documento):
    numeros = re.sub(r"[^\d]", "", documento)

    if len(numeros) == 14:  # CNPJ
        return True, "CNPJ"
    elif len(numeros) == 11:  # CPF
        return True, "CPF"
    return False, None


def gerar_senha_padrao(documento):
    numeros = re.sub(r"[^\d]", "", documento)
    return numeros[-4:]  # Últimos 4 dígitos