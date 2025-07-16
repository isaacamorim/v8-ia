// frontend/js/cnpj_verification.js

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('verifyOverlay');
    const header = document.getElementById('appHeader');
    const conteudo = document.getElementById('conteudoPrincipal');
    const statusText = document.getElementById('clientStatusText');
    const form = document.getElementById('verificacaoRapida');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const documento = document.getElementById('docQuick').value.trim();
        if (!documento) return;

        try {
            const res = await fetch('http://127.0.0.1:5000/api/cnpj/verificar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documento }),
                credentials: 'include'
            });

            const data = await res.json();

            if (data.status === 'existente' && data.requires_password) {
                sessionStorage.setItem('cliente_cnpj', documento);
                window.location.href = 'login.html';
            } else if (data.status === 'existente') {
                sessionStorage.setItem('cliente_nome', data.nome);
                statusText.textContent = `Olá, ${data.social}`;
                header.style.display = 'flex';
                overlay.style.display = 'none';
                conteudo.style.display = 'flex';
                carregarProdutos();  // <-- Aqui está certo!
            } else {
                alert(data.mensagem);
            }
        } catch (err) {
            console.error(err);
            alert('Falha na verificação. Tente novamente.');
        }
    });
});
