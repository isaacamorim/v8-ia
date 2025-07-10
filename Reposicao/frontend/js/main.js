/* js/main.js */
async function carregarProdutos() {
    const resp = await fetch('/api/produtos/reposicao');
    const produtos = await resp.json();
    const container = document.getElementById('produtos');
    container.innerHTML = '';
    produtos.forEach(p => {
        const el = document.createElement('div');
        el.className = 'produto';
        el.innerHTML = `<h4>${p.descricao}</h4><button onclick='adicionarAoCarrinho(${p.id}, "${p.descricao}", ${p.minima})'>Adicionar</button>`;
        container.appendChild(el);
    });
}

function buscarProdutos() {
    const termo = document.getElementById('busca').value;
    fetch('/api/produtos/reposicao/search?q=' + termo)
        .then(res => res.json())
        .then(produtos => {
            const container = document.getElementById('produtos');
            container.innerHTML = '';
            produtos.forEach(p => {
                const el = document.createElement('div');
                el.className = 'produto';
                el.innerHTML = `<h4>${p.descricao}</h4><button onclick='adicionarAoCarrinho(${p.id}, "${p.descricao}", ${p.minima})'>Adicionar</button>`;
                container.appendChild(el);
            });
        });
}

window.onload = carregarProdutos;