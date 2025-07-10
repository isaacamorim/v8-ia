-- Atualizar alguns produtos para mostrarem na reposição
update j_produto
    set jro_mostra_reposicao = 'S',
        jro_palavras_chave = 'Rolamento,Peça de Reposição',
        jro_qtd_minima = 10,
        jro_passo_qtd = 5
    where pro_codpro in ( '001',
                        '002',
                        '003' );

    -- Atualizar alguns clientes para acesso ao portal
    update j_endere
    set jnd_ativo_portal = 'S',
        jnd_senha_hash = 'hash_da_senha' -- Substituir pelo hash real
    where end_codend in ( 123,
                        456 );