@ -1, 37 + 0, 0 @@
document.addEventListener('DOMContentLoaded', () => {
    const finalizeBtn = document.getElementById('finalizeOrderBtn');

    finalizeBtn.addEventListener('click', async () => {
        const cliente = JSON.parse(localStorage.getItem('clienteLogado'));
        const sessionId = localStorage.getItem('session_id');

        if (!cliente || !sessionId) {
            alert('Faça login para finalizar o pedido');
            return;
        }

        try {
            const response = await fetch('/api/whatsapp/enviar-pedido', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cliente_id: cliente.id,
                    session_id: sessionId
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Pedido enviado com sucesso! Entraremos em contato em breve.');
                carrinhoManager.limparCarrinho();
                window.location.href = 'confirmacao.html';
            } else {
                alert('Erro ao enviar pedido: ' + data.error);
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao conectar com o servidor');
        }
    });
});