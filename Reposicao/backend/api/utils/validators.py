@ -1,9 +1,16 @@
# implementar validações de CNPJ e CPF
import re

def validar_cnpj(cnpj: str) -> bool:
    # TODO: lógica de validação
    return True

def validar_cpf(cpf: str) -> bool:
    # TODO: lógica de validação
    return True
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