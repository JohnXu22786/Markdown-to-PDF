/**
 * Theme management for Markdown to PDF Converter
 * Follows system theme by default, allows manual override during session
 * Manual changes are not persisted across page reloads
 */

class ThemeManager {
    constructor() {
        this.themeToggle = document.getElementById('theme-toggle');
        this.sunIcon = this.themeToggle?.querySelector('.sun-icon');
        this.moonIcon = this.themeToggle?.querySelector('.moon-icon');
        this.htmlElement = document.documentElement;

        this.init();
    }

    init() {
        // Set initial theme based on system preference
        this.setInitialTheme();

        // Add event listener for toggle button
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Listen for system theme changes
        this.watchSystemTheme();
    }

    setInitialTheme() {
        // Always use system preference on page load
        this.setTheme(this.getSystemTheme());
    }

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    setTheme(theme) {
        // Update data-theme attribute
        this.htmlElement.setAttribute('data-theme', theme);

        // Update icon visibility
        this.updateIcons(theme);

        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
    }

    toggleTheme() {
        const currentTheme = this.htmlElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    updateIcons(theme) {
        if (!this.sunIcon || !this.moonIcon) return;

        if (theme === 'dark') {
            this.sunIcon.style.display = 'none';
            this.moonIcon.style.display = 'block';
        } else {
            this.sunIcon.style.display = 'block';
            this.moonIcon.style.display = 'none';
        }
    }

    watchSystemTheme() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        // Use modern addEventListener if available
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', (e) => {
                // Always follow system theme changes
                this.setTheme(e.matches ? 'dark' : 'light');
            });
        } else {
            // Fallback for older browsers
            mediaQuery.addListener((e) => {
                // Always follow system theme changes
                this.setTheme(e.matches ? 'dark' : 'light');
            });
        }
    }
}

// Initialize theme manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new ThemeManager();
});