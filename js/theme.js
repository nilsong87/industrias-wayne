document.addEventListener('DOMContentLoaded', () => {
    const themeSwitcher = document.getElementById('theme-switcher');
    const html = document.documentElement;

    // Aplica o tema salvo no carregamento da página, independente do botão existir
    const currentTheme = localStorage.getItem('theme') || 'dark'; // Padrão para escuro
    html.setAttribute('data-theme', currentTheme);

    // Só executa a lógica do botão se ele existir na página
    if (themeSwitcher) {
        updateIcon(currentTheme);

        themeSwitcher.addEventListener('click', () => {
            let currentTheme = html.getAttribute('data-theme');
            let newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            html.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateIcon(newTheme);
        });

        function updateIcon(theme) {
            const sunIcon = themeSwitcher.querySelector('.icon-sun');
            const moonIcon = themeSwitcher.querySelector('.icon-moon');

            // Adiciona uma verificação para garantir que os ícones existam
            if (sunIcon && moonIcon) {
                if (theme === 'dark') {
                    sunIcon.style.display = 'none';
                    moonIcon.style.display = 'inline-block';
                } else {
                    sunIcon.style.display = 'inline-block';
                    moonIcon.style.display = 'none';
                }
            }
        }
    }
});
