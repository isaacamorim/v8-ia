document.addEventListener('DOMContentLoaded', () => {
    const cnpjForm = document.getElementById('cnpjForm');
    const cnpjInput = document.getElementById('cnpjInput');
    const clientStatus = document.getElementById('clientStatus');
    const clientStatusText = document.getElementById('clientStatusText');

    cnpjForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cnpj = cnpjInput.value.trim();
        if (!cnpj) return;

        try {
            const response = await fetch('/api/cnpj/verificar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ documento: cnpj })
            });

            const data = await response.json();

            if (response.ok) {
                handleCnpjResponse(data);
            } else {
                showStatus(data.error || 'Erro na verificação', 'error');
            }
        } catch (error) {
            showStatus('Falha na comunicação com o servidor', 'error');
        }
    });

    function handleCnpjResponse(response) {
        switch (response.status) {
            case 'existente':
                if (response.requires_password) {
                    showStatus('CNPJ encontrado. Faça login', 'success');
                    showPasswordForm();
                } else {
                    showStatus('Defina sua senha para continuar', 'warning');
                    showSetPasswordForm();
                }
                break;

            case 'nao_encontrado':
                showStatus(response.mensagem, 'warning');
                showAccessRequestForm();
                break;
        }
    }

    function showStatus(message, type = 'info') {
        clientStatusText.textContent = message;
        clientStatus.className = 'client-status';
        clientStatus.classList.add(type === 'error' ? 'error' :
            type === 'warning' ? 'warning' : 'info');
    }

    function showPasswordForm() {
        // Implementar formulário de login
    }

    function showSetPasswordForm() {
        // Implementar formulário de definição de senha
    }

    function showAccessRequestForm() {
        // Implementar formulário de solicitação de acesso
    }
});