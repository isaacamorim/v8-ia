-- initial-products.sql
-- Dados iniciais de produtos marcados para reposição
insert into j_produto (
    jro_proid,
    jro_descri,
    jro_mostra_reposicao,
    jro_palavras_chave,
    jro_qtd_minima,
    jro_passo_qtd
) values ( 1001,
            'Rolamento SKF 6203',
            1,
            'rolamento;skf;eixo',
            1,
            1 
        );

insert into j_produto (
    jro_proid,
    jro_descri,
    jro_mostra_reposicao,
    jro_palavras_chave,
    jro_qtd_minima,
    jro_passo_qtd
) 
values ( 1002,
            'Teflon Industrial 15m',
            1,
            'teflon;fita;vedação',
            1,
            1 
        );

insert into j_produto (
    jro_proid,
    jro_descri,
    jro_mostra_reposicao,
    jro_palavras_chave,
    jro_qtd_minima,
    jro_passo_qtd
) 
values ( 1003,
            'Parafuso M8x20',
            1,
            'parafuso;m8;fixação',
            100,
            100 
        );