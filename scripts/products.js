// === SISTEMA DE ABAS COM INDICADOR (Usado em múltiplas seções) ===
function setupTabSystem(container) {
    const tabs = container.querySelectorAll('.tab');
    const contents = container.closest('.container').querySelectorAll('.tab-content');

    // Atualiza a posição do indicador visual da aba
    function updateIndicator(tab) {
        const { offsetLeft, offsetWidth } = tab;
        container.style.setProperty('--indicator-left', `${offsetLeft}px`);
        container.style.setProperty('--indicator-width', `${offsetWidth}px`);
    }

    // Ativa a aba clicada e exibe o conteúdo correspondente
    function activate(tab) {
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
        updateIndicator(tab);
    }

    const initialTab = container.querySelector('.tab.active');
    if (initialTab) updateIndicator(initialTab);

    tabs.forEach(tab => tab.addEventListener('click', () => activate(tab)));
}

// Aplica o sistema de abas para as seções necessárias
document.querySelectorAll('.features-section .tabs, .entradas-section .tabs').forEach(setupTabSystem);


// === MODAL DE IMAGEM DA GALERIA ===
const galleryImages = Array.from(document.querySelectorAll('.gallery-box img'));
const modal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImage');
let currentIndex = 0;

// Abre o modal com a imagem clicada
function openModal(index) {
    currentIndex = index;
    modalImg.src = galleryImages[index].src;
    modal.style.display = 'block';
}

// Adiciona evento de clique para cada imagem da galeria
galleryImages.forEach((img, index) => {
    img.addEventListener('click', () => openModal(index));
});

// Fecha o modal ao clicar no botão de fechar
document.querySelector('.close-btn').addEventListener('click', () => {
    modal.style.display = 'none';
});

// Botão para imagem anterior no modal
document.querySelector('.prev-btn').addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    modalImg.src = galleryImages[currentIndex].src;
});

// Botão para imagem seguinte no modal
document.querySelector('.next-btn').addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % galleryImages.length;
    modalImg.src = galleryImages[currentIndex].src;
});

// Fecha o modal ao clicar fora da imagem
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.style.display = 'none';
});


// === BOTÃO PARA INICIAR O VIEWER 3D STL ===
document.addEventListener('DOMContentLoaded', () => {
    let viewer = null;
    const button = document.getElementById('start-viewer-btn');

    button.addEventListener('click', () => {
        if (!viewer) {
            viewer = new STLViewer('stl-container', {
                initialFile: '../3d/modelos-stl/enfnh.STL'
            });
        }
        // Esconde o botão após o clique
        button.style.display = 'none';
    });
});


// === SISTEMA DE ABAS PADRÃO COM INDICADOR (versão global) ===
const tabs = document.querySelectorAll('.tab');
const contents = document.querySelectorAll('.tab-content');
const tabsContainer = document.querySelector('.tabs');

function updateIndicator(tab) {
    const { offsetLeft, offsetWidth } = tab;
    tabsContainer.style.setProperty('--indicator-left', `${offsetLeft}px`);
    tabsContainer.style.setProperty('--indicator-width', `${offsetWidth}px`);
}

function activate(tab) {
    tabs.forEach(t => t.classList.remove('active'));
    contents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab).classList.add('active');
    updateIndicator(tab);
}

const initial = document.querySelector('.tab.active');
if (initial) updateIndicator(initial);

tabs.forEach(tab => tab.addEventListener('click', () => activate(tab)));


// === DRAG SCROLL (Rolagem lateral com clique e arraste) ===
function setupDrag(grid) {
    let down = false, startX, startY, scrollX, isDragging = false;

    // Início do clique ou toque
    const start = e => {
        down = true;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startX = clientX;
        startY = clientY;
        scrollX = grid.scrollLeft;
        isDragging = false;
    };

    // Durante o movimento (scroll)
    const move = e => {
        if (!down) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const deltaX = Math.abs(clientX - startX);
        const deltaY = Math.abs(clientY - startY);

        // Ativa o drag apenas se for um movimento predominantemente horizontal
        if (!isDragging && deltaX > deltaY && deltaX > 5) {
            isDragging = true;
            grid.classList.add('dragging');
        }

        if (isDragging) {
            e.preventDefault();
            const moveX = clientX - startX;
            grid.scrollLeft = scrollX - moveX;
        }
    };

    // Fim do clique ou toque
    const end = () => {
        down = false;
        isDragging = false;
        grid.classList.remove('dragging');
    };

    // Eventos para mouse e touch
    grid.addEventListener('mousedown', start);
    grid.addEventListener('touchstart', start, { passive: true });

    document.addEventListener('mousemove', move);
    document.addEventListener('touchmove', move, { passive: false });

    document.addEventListener('mouseup', end);
    document.addEventListener('mouseleave', end);
    document.addEventListener('touchend', end);
}

// Aplica o drag scroll para grids específicos
const grids = document.querySelectorAll('.dosadores-grid, .package-grid');
grids.forEach(grid => {
    if (grid) {
        setupDrag(grid);
    }
});


// === ATUALIZAÇÃO DO ANO NO RODAPÉ ===
const y = document.getElementById('currentYear');
if (y) y.textContent = new Date().getFullYear();


// === CARROSSEL DE CARDS COM INDICADORES ===
document.addEventListener('DOMContentLoaded', function () {
    const carousel = document.querySelector('.feature-cards');
    const dots = document.querySelectorAll('.carousel-indicators .dot');
    const cards = document.querySelectorAll('.feature-card');

    // Atualiza o indicador de qual card está ativo
    function updateActiveDot() {
        const scrollLeft = carousel.scrollLeft;
        const cardWidth = cards[0].offsetWidth + 15; // 15 = gap
        const index = Math.round(scrollLeft / cardWidth);

        dots.forEach(dot => dot.classList.remove('active'));
        if (dots[index]) dots[index].classList.add('active');
    }

    // Rola o carrossel para o card clicado
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            const cardWidth = cards[0].offsetWidth + 15;
            carousel.scrollTo({
                left: i * cardWidth,
                behavior: 'smooth'
            });
        });
    });

    // Atualiza o indicador ao rolar manualmente
    carousel.addEventListener('scroll', () => {
        requestAnimationFrame(updateActiveDot);
    });
});

// (Redundante, mas presente duas vezes)
document.getElementById('currentYear').textContent = new Date().getFullYear();
