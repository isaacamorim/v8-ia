/* js/carrinho.js */
// carrinho.js
let carrinho = [];

carregarCarrinho(); // recupera do localStorage


function mostrarNotificacao(mensagem, cor = "green") {
    const antiga = document.querySelector('.notification');
    if (antiga) antiga.remove();

    const box = document.createElement("div");
    box.className = `notification ${cor}`;
    box.textContent = mensagem;
    document.body.appendChild(box);

    setTimeout(() => {
        box.remove();
    }, 2500);
}


function adicionarAoCarrinho(id, descricao, qtd, cod, imagem) {
    const existente = carrinho.find(item => item.id === id);

    if (existente) {
        existente.qtd = qtd;  // atualiza quantidade
        mostrarNotificacao(`Quantidade atualizada de ${descricao}`, "yellow");
    } else {
        carrinho.push({ id, descricao, qtd, cod, imagem });
        mostrarNotificacao(`Adicionado: ${descricao}`, "green");
    }

    atualizarBadgeCarrinho();
    atualizarCarrinhoSidebar();
    salvarCarrinho(); // já está sendo feito
    salvarNoServidor({ id, qtd });

}

function removerDoCarrinho(id) {
    const index = carrinho.findIndex(p => p.id === id);
    if (index !== -1) {
        const produto = carrinho[index];
        carrinho.splice(index, 1);
        mostrarNotificacao(`Removido: ${produto.descricao}`, "red");
        salvarCarrinho();
        atualizarCarrinhoVisual();
        salvarNoServidor({ id, qtd });
    }
}


function alterarQuantidade(id, novaQtd) {
    novaQtd = parseInt(novaQtd);
    if (isNaN(novaQtd) || novaQtd < 1) return;

    const produto = carrinho.find(p => p.id === id);
    if (produto) {
        produto.qtd = novaQtd;
        salvarCarrinho();
        atualizarCarrinhoSidebar();
        atualizarBadgeCarrinho();
        mostrarNotificacao(`Quantidade alterada`, "yellow");
    }
}


function atualizarBadgeCarrinho() {
    const total = Object.values(carrinho).reduce((acc, p) => acc + p.qtd, 0);
    document.getElementById('cartCount').textContent = total;
}

function exibirNotificacao(msg) {
    const notif = document.querySelector('.notification');
    notif.textContent = msg;
    notif.style.display = 'block';
    notif.style.opacity = '0';
    notif.style.transform = 'translateY(20px)';

    setTimeout(() => {
        notif.style.transition = 'all 0.3s ease';
        notif.style.opacity = '1';
        notif.style.transform = 'translateY(0)';
    }, 10);

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateY(20px)';
    }, 2000);

    setTimeout(() => {
        notif.style.display = 'none';
    }, 2500);
}

function atualizarCarrinhoSidebar() {
    const container = document.querySelector('.cart-items');
    container.innerHTML = '';

    Object.values(carrinho).forEach(p => {
        const el = document.createElement('div');
        el.classList.add('cart-item');

        el.innerHTML = `
            <div style="display:flex; align-items:center; gap:0.5rem;">
                <img src="${p.imagem || 'img/sem-imagem.jpg'}" style="width:40px; height:40px; object-fit:cover; border-radius:6px;">
                <div>
                    <strong>${p.descricao}</strong><br>
                    <small>${p.cod}</small>
                </div>
            </div>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem;">
                <input type="number" value="${p.qtd}" min="1" class="qty-input" data-id="${p.id}">
                <button data-id="${p.id}" class="remove-btn">🗑</button>
            </div>
        `;

        container.appendChild(el);
    });

    // Eventos dinâmicos
    container.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', e => {
            const id = input.dataset.id;
            alterarQuantidade(id, parseInt(input.value));
        });
    });

    container.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            removerDoCarrinho(btn.dataset.id);
        });
    });
}

// Evento: abrir o carrinho lateral
document.querySelector('.cart-icon').addEventListener('click', () => {
    document.querySelector('.cart-sidebar').classList.add('active');
});

// Fechar clicando fora
document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.cart-sidebar');
    if (!sidebar.contains(e.target) && !e.target.closest('.cart-icon')) {
        sidebar.classList.remove('active');
    }
});

// Expor globalmente para uso externo
window.adicionarAoCarrinho = adicionarAoCarrinho;

function mostrarNotificacao(mensagem, cor = "green") {
    const box = document.createElement("div");
    box.className = `notification ${cor}`;
    box.textContent = mensagem;
    document.body.appendChild(box);

    box.style.display = "block";

    setTimeout(() => {
        box.remove();
    }, 2500);
}

document.addEventListener('DOMContentLoaded', () => {
    atualizarBadgeCarrinho();
    atualizarCarrinhoSidebar(); // Garante que os itens já salvos apareçam
});

function salvarCarrinho() {
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
}

function carregarCarrinho() {
    const salvo = localStorage.getItem('carrinho');
    if (salvo) {
        carrinho = JSON.parse(salvo);
    } else {
        carrinho = [];
    }
}

function salvarNoServidor(item) {
    fetch("http://127.0.0.1:5000/api/carrinho/adicionar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: obterSessionId(), // você deve implementar isso
            produto_id: item.id,
            quantidade: item.qtd
        })
    }).then(res => {
        if (!res.ok) console.warn("Erro ao salvar item no servidor.");
    });
}

// salvar um session_id simples no localStorage
function obterSessionId() {
    let sessionId = localStorage.getItem("session_id");
    if (!sessionId) {
        sessionId = `sess_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
        localStorage.setItem("session_id", sessionId);
    }
    return sessionId;
}

async function carregarCarrinhoDoServidor() {
    const sessionId = obterSessionId();
    try {
        const res = await fetch(`http://127.0.0.1:5000/api/carrinho/${sessionId}`);
        const dados = await res.json();

        carrinho = dados
            .filter(item => item.status === 'ATIVO') // só carrega os ativos
            .map(item => ({
                id: item.produto_id,
                descricao: item.descricao,
                qtd: item.quantidade,
                cod: item.codigo,
                imagem: item.imagem
            }));

        salvarCarrinho(); // salva no localStorage
        atualizarBadgeCarrinho();
        atualizarCarrinhoSidebar();
    } catch (err) {
        console.warn("Erro ao carregar carrinho do servidor:", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarCarrinhoDoServidor(); // carrega do banco
});

function removerDoCarrinho(id) {
    const index = carrinho.findIndex(p => p.id === id);
    if (index !== -1) {
        const produto = carrinho[index];
        carrinho.splice(index, 1);
        mostrarNotificacao(`Removido: ${produto.descricao}`, "red");
        salvarCarrinho();
        atualizarCarrinhoSidebar();
        atualizarBadgeCarrinho();
        marcarComoExcluidoNoServidor(id);
    }
}

function marcarComoExcluidoNoServidor(id) {
    fetch("http://127.0.0.1:5000/api/carrinho/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            session_id: obterSessionId(),
            produto_id: id,
            status: "EXCLUIDO"
        })
    }).then(res => {
        if (!res.ok) console.warn("Erro ao marcar como excluído.");
    });
}
