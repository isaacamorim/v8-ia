// Script para animar elementos ao entrarem na viewport

document.addEventListener("DOMContentLoaded", () => {
    const sectionsToAnimate = [
        { selector: ".sobre-nos-colunas-layout", className: "quem-somos-section" }, // Assuming this is the main parent for Quem Somos
        { selector: ".destaque-produtos-novo-estilo", className: "solucoes-completas-section" }, // Parent of .solucao-card
        { selector: ".diferenciais", className: "diferenciais-section" }, // Parent of .diferenciais .row > .col-md-3
        { selector: ".clientes-logos", className: "clientes-logos-section" } // Parent of .clientes-logos .placeholder-text img
    ];

    const observerOptions = {
        root: null, // relative to document viewport 
        rootMargin: "0px",
        threshold: 0.1 // 10% of item is visible
    };

    const animationObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add the animation trigger class to the section itself
                // The CSS in animations_on_scroll.css targets children based on this parent class
                const sectionConfig = sectionsToAnimate.find(s => entry.target.matches(s.selector) || entry.target.classList.contains(s.selector.substring(1)));
                if (sectionConfig) {
                    entry.target.classList.add("animate-in-view");
                }
                // Optionally, unobserve the element after animation to save resources
                // observer.unobserve(entry.target);
            }
            // else {
            //    // Optional: Remove class if element scrolls out of view to re-animate on next scroll
            //    // entry.target.classList.remove("animate-in-view"); 
            // }
        });
    }, observerOptions);

    sectionsToAnimate.forEach(sectionConfig => {
        const elements = document.querySelectorAll(sectionConfig.selector);
        elements.forEach(el => {
            // Add the specific class name to the element so CSS can target it with .animate-in-view
            // e.g., <section class="sobre-nos-colunas-layout quem-somos-section">
            if (!el.classList.contains(sectionConfig.className)) {
                 el.classList.add(sectionConfig.className);
            }
            animationObserver.observe(el);
        });
    });
});

