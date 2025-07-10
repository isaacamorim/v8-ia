-- 002-add-reposicao-fields.sql
-- Adição de campos para controle de reposição em produtos
alter table j_produto add (
    jro_mostra_reposicao number(1) default 0,
    jro_palavras_chave   clob,
    jro_qtd_minima       number default 1,
    jro_passo_qtd        number default 1
);