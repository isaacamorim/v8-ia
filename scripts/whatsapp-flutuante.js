document.addEventListener('DOMContentLoaded', function () {
    // Cria o elemento do WhatsApp
    const whatsappDiv = document.createElement('a');
    whatsappDiv.href = 'https://api.whatsapp.com/send?phone=551934512822';
    whatsappDiv.className = 'whatsapp-float';
    whatsappDiv.target = '_blank';
    whatsappDiv.rel = 'noopener noreferrer';
    whatsappDiv.innerHTML = '<i class="fab fa-whatsapp whatsapp-icon"></i>';

    // Adiciona ao final do body
    document.body.appendChild(whatsappDiv);

    // Adiciona o Font Awesome dinamicamente
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(fontAwesome);
});

