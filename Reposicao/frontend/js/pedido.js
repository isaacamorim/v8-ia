/* js/pedido.js */
function enviarPedido() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho_reposicao') || '[]');
    const cnpj = sessionStorage.getItem('cnpj');
    if (!cnpj) {
        alert('Você precisa estar logado para enviar o pedido.');
        return;
    }
    const itens = carrinho.map(i => ({ codigo: i.id, descricao: i.descricao, quantidade: i.quantidade }));
    fetch('/api/pedido/enviar-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj, itens })
    }).then(r => {
        if (r.ok) {
            alert('Pedido enviado com sucesso!');
            localStorage.removeItem('carrinho_reposicao');
            renderizarCarrinho();
        } else alert('Erro ao enviar pedido');
    });
}