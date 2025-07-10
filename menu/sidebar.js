// sidebar.js

let sidebar = document.getElementById('sidebar');
let overlay = document.querySelector('.sidebar-overlay');
let isOpen = false;
let isHovering = false;

function toggleSidebar() {
    if (isOpen) {
        closeSidebar();
    } else {
        openSidebar();
    }
}

// função openSidebar
function openSidebar() {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    document.querySelector('.sidebar-toggle').classList.add('open');
    isOpen = true;

    // Forçar exibição da logo expandida
    document.querySelector('.expanded-logo').style.display = 'block';
    document.querySelector('.default-logo').style.display = 'none';
}

// função closeSidebar
function closeSidebar() {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
    document.querySelector('.sidebar-toggle').classList.remove('open');
    isOpen = false;

    // Restaurar logo padrão
    if (window.innerWidth <= 768) {
        document.querySelector('.expanded-logo').style.display = 'none';
        document.querySelector('.default-logo').style.display = 'block';
    }
}

// Função para recolher todos os submenus
function collapseAllSubmenus() {
    document.querySelectorAll('.nav-item.has-submenu.open').forEach(item => {
        item.classList.remove('open');
        item.querySelector('.submenu').classList.remove('open');
    });
}

function toggleSubmenu(element) {
    const parentItem = element.parentElement;
    const submenu = parentItem.querySelector('.submenu');

    // Fechar outros submenus abertos
    document.querySelectorAll('.nav-item.has-submenu.open').forEach(item => {
        if (item !== parentItem) {
            item.classList.remove('open');
            item.querySelector('.submenu').classList.remove('open');
        }
    });

    // Alternar o submenu atual
    parentItem.classList.toggle('open');
    submenu.classList.toggle('open');
}

function setActive(element) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    element.classList.add('active');

    if (window.innerWidth <= 768) {
        setTimeout(() => {
            closeSidebar();
        }, 300);
    }
}

// Eventos de hover para desktop
sidebar.addEventListener('mouseenter', function () {
    if (window.innerWidth > 768) {
        isHovering = true;
    }
});

sidebar.addEventListener('mouseleave', function () {
    if (window.innerWidth > 768) {
        isHovering = false;
        // Recolher submenus quando o mouse sair do sidebar
        setTimeout(() => {
            if (!isHovering) {
                collapseAllSubmenus();
            }
        }, 200); // Pequeno delay para evitar fechamento acidental
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isOpen) {
        closeSidebar();
    }
});

window.addEventListener('resize', function () {
    const mainContent = document.getElementById('mainContent');

    if (window.innerWidth > 768) {
        sidebar.classList.remove('mobile', 'active');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
        isOpen = false;
        isHovering = false;

        // Recolher submenus ao redimensionar para desktop
        collapseAllSubmenus();

        if (mainContent) mainContent.style.marginLeft = '80px';
        document.querySelector('.expanded-logo').style.display = 'none';
        document.querySelector('.default-logo').style.display = 'block';
    } else {
        sidebar.classList.add('mobile');
        if (isOpen) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            if (mainContent) mainContent.style.marginLeft = '0';
            document.querySelector('.expanded-logo').style.display = 'block';
            document.querySelector('.default-logo').style.display = 'none';
        }
    }
});

// Inicialização do conteúdo principal
document.addEventListener('DOMContentLoaded', function () {
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.style.marginLeft = (window.innerWidth > 768) ? '80px' : '0';
    }
});

sidebar.addEventListener('click', function (event) {
    event.stopPropagation();
});