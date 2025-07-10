def validar_cnpj(cnpj: str) -> bool:
    cnpj = ''.join(filter(str.isdigit, cnpj))
    if len(cnpj) != 14 or cnpj in (c * 14 for c in "0123456789"):
        return False
    def calc_dig(digs):
        s = sum(int(d)*w for d, w in zip(digs, [5,4,3,2,9,8,7,6,5,4,3,2]))
        r = 11 - s % 11
        return '0' if r >= 10 else str(r)
    def calc_dig2(digs):
        s = sum(int(d)*w for d, w in zip(digs, [6,5,4,3,2,9,8,7,6,5,4,3,2]))
        r = 11 - s % 11
        return '0' if r >= 10 else str(r)
    return cnpj[-2:] == calc_dig(cnpj[:12]) + calc_dig2(cnpj[:13])

def validar_cpf(cpf: str) -> bool:
    cpf = ''.join(filter(str.isdigit, cpf))
    if len(cpf) != 11 or cpf in (c * 11 for c in "0123456789"):
        return False
    def calc_dig(digs, pesos):
        s = sum(int(d) * p for d, p in zip(digs, pesos))
        r = 11 - s % 11
        return '0' if r < 2 else str(r)
    dig1 = calc_dig(cpf[:9], range(10, 1, -1))
    dig2 = calc_dig(cpf[:10], range(11, 1, -1))
    return cpf[-2:] == dig1 + dig2
