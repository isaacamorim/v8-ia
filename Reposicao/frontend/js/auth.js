@ -1, 56 + 0, 0 @@
document.addEventListener('DOMContentLoaded', () => {
    const cnpjInput = document.getElementById('cnpjInput');
    const checkCnpjBtn = document.getElementById('checkCnpjBtn');
    const clientStatus = document.getElementById('clientStatus');

    checkCnpjBtn.addEventListener('click', async () => {
        const documento = cnpjInput.value.trim();

        if (!documento) {
            alert('Por favor, digite seu CNPJ/CPF');
            return;
        }

        try {
            const response = await fetch('/api/auth/check-cnpj', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ documento })
            });

            const data = await response.json();

            if (data.success) {
                if (data.existe) {
                    if (data.tem_senha) {
                        // Redirecionar para login
                        window.location.href = `login.html?cnpj=${documento}`;
                    } else {
                        // Primeiro acesso - definir senha
                        window.location.href = `definir-senha.html?cnpj=${documento}`;
                    }
                } else {
                    clientStatus.innerHTML = `
                        CNPJ não encontrado. 
                        <button id="requestAccessBtn">Solicitar Acesso</button>
                    `;

                    document.getElementById('requestAccessBtn').addEventListener('click', () => {
                        // Enviar solicitação via WhatsApp
                        const mensagem = encodeURIComponent(
                            `Solicitação de acesso para CNPJ: ${documento}`
                        );
                        window.open(`https://wa.me/5511999999999?text=${mensagem}`, '_blank');
                    });
                }
            } else {
                alert('Erro ao verificar CNPJ: ' + data.error);
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao conectar com o servidor');
        }
    });
});