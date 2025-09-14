/**
 * Theme Management System
 * Handles light/dark theme switching with smooth transitions
 * 
 * @author Croatian Working Law Fact Checker
 * @version 1.0.0
 */

class ThemeManager {
  constructor() {
    this.currentTheme = 'light';
    this.isInitialized = false;
    this.prefersDarkMode = false;
    this.isTransitioning = false;
    this.transitionDuration = 300;
    
    // Theme configurations
    this.themes = {
      light: {
        name: 'Light',
        icon: 'sun',
        dataTheme: 'light'
      },
      dark: {
        name: 'Dark',
        icon: 'moon',
        dataTheme: 'dark'
      }
    };
    
    // System preference detection
    this.mediaQuery = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  }

  /**
   * Initialize theme system
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🎨 Initializing theme system...');
      
      // Detect system preference
      this.detectSystemPreference();
      
      // Restore saved theme preference
      this.restoreThemePreference();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Apply initial theme
      await this.applyTheme(this.currentTheme, false);
      
      // Watch for system preference changes
      this.watchSystemPreferences();
      
      this.isInitialized = true;
      console.log(`✅ Theme system initialized with ${this.currentTheme} theme`);
      
    } catch (error) {
      console.error('❌ Failed to initialize theme system:', error);
      throw error;
    }
  }

  /**
   * Detect system theme preference
   * @private
   */
  detectSystemPreference() {
    if (this.mediaQuery) {
      this.prefersDarkMode = this.mediaQuery.matches;
      console.log(`🌍 System prefers: ${this.prefersDarkMode ? 'dark' : 'light'} mode`);
    }
  }

  /**
   * Restore saved theme preference
   * @private
   */
  restoreThemePreference() {
    try {
      const savedTheme = localStorage.getItem('croatianLawTheme');
      
      if (savedTheme && this.themes[savedTheme]) {
        this.currentTheme = savedTheme;
      } else if (this.prefersDarkMode) {
        this.currentTheme = 'dark';
      } else {
        this.currentTheme = 'light';
      }
      
      console.log(`💾 Restored theme preference: ${this.currentTheme}`);
      
    } catch (error) {
      console.warn('Unable to restore theme preference:', error);
      this.currentTheme = this.prefersDarkMode ? 'dark' : 'light';
    }
  }

  /**
   * Save theme preference
   * @private
   */
  saveThemePreference() {
    try {
      localStorage.setItem('croatianLawTheme', this.currentTheme);
    } catch (error) {
      console.warn('Unable to save theme preference:', error);
    }
  }

  /**
   * Setup event listeners
   * @private
   */
  setupEventListeners() {
    const themeToggle = document.getElementById('theme-toggle');
    
    if (themeToggle) {
      themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleTheme();
      });
      
      // Keyboard support
      themeToggle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.toggleTheme();
        }
      });
    }
    
    // Listen for manual theme change events
    document.addEventListener('themeChangeRequested', (e) => {
      if (e.detail && e.detail.theme) {
        this.setTheme(e.detail.theme);
      }
    });
  }

  /**
   * Watch for system preference changes
   * @private
   */
  watchSystemPreferences() {
    if (this.mediaQuery) {
      this.mediaQuery.addEventListener('change', (e) => {
        this.prefersDarkMode = e.matches;
        console.log(`🌍 System preference changed to: ${this.prefersDarkMode ? 'dark' : 'light'}`);
        
        // Auto-switch if user hasn't set a manual preference
        const hasManualPreference = localStorage.getItem('croatianLawTheme');
        if (!hasManualPreference) {
          const newTheme = this.prefersDarkMode ? 'dark' : 'light';
          this.setTheme(newTheme, true);
        }
      });
    }
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Set specific theme
   * @param {string} themeName - Theme name ('light' or 'dark')
   * @param {boolean} isAutomatic - Whether this is an automatic change
   * @returns {Promise<void>}
   */
  async setTheme(themeName, isAutomatic = false) {
    if (!this.themes[themeName]) {
      console.warn(`Unknown theme: ${themeName}`);
      return;
    }
    
    if (this.isTransitioning) {
      console.log('Theme change already in progress');
      return;
    }
    
    const previousTheme = this.currentTheme;
    this.currentTheme = themeName;
    
    // Apply theme
    await this.applyTheme(themeName, true);
    
    // Save preference (only for manual changes)
    if (!isAutomatic) {
      this.saveThemePreference();
    }
    
    // Update toggle button
    this.updateToggleButton();
    
    // Dispatch theme change event
    this.dispatchThemeChangeEvent(previousTheme, themeName);
    
    console.log(`🎨 Theme changed: ${previousTheme} → ${themeName}`);
  }

  /**
   * Apply theme to document
   * @private
   * @param {string} themeName - Theme name
   * @param {boolean} animate - Whether to animate the transition
   * @returns {Promise<void>}
   */
  async applyTheme(themeName, animate = true) {
    const theme = this.themes[themeName];
    
    if (animate) {
      this.isTransitioning = true;
      
      // Add transition class to body
      document.body.classList.add('theme-transitioning');
      
      // Small delay to ensure transition is ready
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    // Update data-theme attribute
    document.documentElement.setAttribute('data-theme', theme.dataTheme);
    
    // Update meta theme-color
    this.updateMetaThemeColor(themeName);
    
    // Handle theme-specific adjustments
    this.applyThemeSpecificAdjustments(themeName);
    
    if (animate) {
      // Wait for transition to complete
      await new Promise(resolve => setTimeout(resolve, this.transitionDuration));
      
      // Remove transition class
      document.body.classList.remove('theme-transitioning');
      this.isTransitioning = false;
    }
  }

  /**
   * Update meta theme-color for mobile browsers
   * @private
   * @param {string} themeName - Theme name
   */
  updateMetaThemeColor(themeName) {
    let themeColorMeta = document.querySelector('meta[name="theme-color"]');
    
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    
    const themeColors = {
      light: '#f0f2f5',
      dark: '#1e293b'
    };
    
    themeColorMeta.content = themeColors[themeName] || themeColors.light;
  }

  /**
   * Apply theme-specific adjustments
   * @private
   * @param {string} themeName - Theme name
   */
  applyThemeSpecificAdjustments(themeName) {
    // Update scrollbar styling (if supported)
    this.updateScrollbarStyling(themeName);
    
    // Update selection color
    this.updateSelectionColor(themeName);
    
    // Handle images or icons that need theme-specific versions
    this.updateThemeSpecificAssets(themeName);
  }

  /**
   * Update scrollbar styling
   * @private
   * @param {string} themeName - Theme name
   */
  updateScrollbarStyling(themeName) {
    // Remove existing scrollbar styles
    const existingStyle = document.getElementById('theme-scrollbar-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create new scrollbar styles
    const style = document.createElement('style');
    style.id = 'theme-scrollbar-style';
    
    const scrollbarStyles = {
      light: `
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #f0f2f5;
        }
        ::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `,
      dark: `
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #1e293b;
        }
        ::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `
    };
    
    style.textContent = scrollbarStyles[themeName] || scrollbarStyles.light;
    document.head.appendChild(style);
  }

  /**
   * Update text selection color
   * @private
   * @param {string} themeName - Theme name
   */
  updateSelectionColor(themeName) {
    // Remove existing selection styles
    const existingStyle = document.getElementById('theme-selection-style');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create new selection styles
    const style = document.createElement('style');
    style.id = 'theme-selection-style';
    
    const selectionStyles = {
      light: `
        ::selection {
          background-color: #4f46e5;
          color: white;
        }
      `,
      dark: `
        ::selection {
          background-color: #6366f1;
          color: white;
        }
      `
    };
    
    style.textContent = selectionStyles[themeName] || selectionStyles.light;
    document.head.appendChild(style);
  }

  /**
   * Update theme-specific assets
   * @private
   * @param {string} themeName - Theme name
   */
  updateThemeSpecificAssets(themeName) {
    // Update any images or icons that have theme-specific versions
    const themeSpecificElements = document.querySelectorAll('[data-theme-asset]');
    
    themeSpecificElements.forEach(element => {
      const assetType = element.getAttribute('data-theme-asset');
      const lightSrc = element.getAttribute('data-light-src');
      const darkSrc = element.getAttribute('data-dark-src');
      
      if (themeName === 'dark' && darkSrc) {
        element.src = darkSrc;
      } else if (lightSrc) {
        element.src = lightSrc;
      }
    });
  }

  /**
   * Update toggle button appearance
   * @private
   */
  updateToggleButton() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;
    
    const theme = this.themes[this.currentTheme];
    
    // Update aria-label
    themeToggle.setAttribute('aria-label', 
      `Switch to ${this.currentTheme === 'light' ? 'dark' : 'light'} mode`);
    
    // Update icons visibility is handled by CSS based on data-theme attribute
  }

  /**
   * Dispatch theme change event
   * @private
   * @param {string} previousTheme - Previous theme name
   * @param {string} newTheme - New theme name
   */
  dispatchThemeChangeEvent(previousTheme, newTheme) {
    const event = new CustomEvent('themeChanged', {
      detail: {
        previousTheme,
        currentTheme: newTheme,
        themes: this.themes,
        isSystemPreference: !localStorage.getItem('croatianLawTheme')
      }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Get current theme
   * @returns {string} Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get all available themes
   * @returns {Object} Themes configuration
   */
  getAvailableThemes() {
    return { ...this.themes };
  }

  /**
   * Check if current theme is dark
   * @returns {boolean} True if current theme is dark
   */
  isDarkMode() {
    return this.currentTheme === 'dark';
  }

  /**
   * Check if system prefers dark mode
   * @returns {boolean} True if system prefers dark mode
   */
  systemPrefersDarkMode() {
    return this.prefersDarkMode;
  }

  /**
   * Reset theme to system preference
   */
  resetToSystemPreference() {
    // Remove manual preference
    try {
      localStorage.removeItem('croatianLawTheme');
    } catch (error) {
      console.warn('Unable to remove theme preference:', error);
    }
    
    // Apply system preference
    const systemTheme = this.prefersDarkMode ? 'dark' : 'light';
    this.setTheme(systemTheme, true);
  }

  /**
   * Add custom theme transition for specific elements
   * @param {HTMLElement} element - Element to animate
   * @param {string} property - CSS property to transition
   * @param {number} duration - Transition duration in ms
   */
  addCustomTransition(element, property = 'all', duration = this.transitionDuration) {
    if (!element) return;
    
    const originalTransition = element.style.transition;
    element.style.transition = `${property} ${duration}ms ease-out`;
    
    setTimeout(() => {
      element.style.transition = originalTransition;
    }, duration);
  }

  /**
   * Preload theme resources for smooth switching
   * @private
   */
  preloadThemeResources() {
    // Preload any theme-specific resources
    const themes = ['light', 'dark'];
    
    themes.forEach(theme => {
      // Create a hidden div with the theme to trigger CSS loading
      const preloader = document.createElement('div');
      preloader.setAttribute('data-theme', theme);
      preloader.style.position = 'absolute';
      preloader.style.left = '-9999px';
      preloader.style.visibility = 'hidden';
      preloader.className = 'neumorphic-btn neumorphic-card';
      
      document.body.appendChild(preloader);
      
      // Remove after a short delay
      setTimeout(() => {
        document.body.removeChild(preloader);
      }, 100);
    });
  }

  /**
   * Get theme-aware color value
   * @param {string} colorVar - CSS custom property name
   * @returns {string} Color value for current theme
   */
  getThemeColor(colorVar) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(`--${colorVar}`)
      .trim();
  }

  /**
   * Create smooth transition effect for theme changes
   * @private
   * @returns {Promise<void>}
   */
  async createTransitionEffect() {
    // Create a full-screen overlay for smooth transition
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: ${this.currentTheme === 'light' ? '#1e293b' : '#f0f2f5'};
      opacity: 0;
      pointer-events: none;
      z-index: 9999;
      transition: opacity ${this.transitionDuration}ms ease-out;
    `;
    
    document.body.appendChild(overlay);
    
    // Trigger fade in
    await new Promise(resolve => {
      setTimeout(() => {
        overlay.style.opacity = '1';
        setTimeout(resolve, this.transitionDuration / 2);
      }, 10);
    });
    
    // Apply theme change
    await this.applyTheme(this.currentTheme, false);
    
    // Fade out
    overlay.style.opacity = '0';
    
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, this.transitionDuration);
  }
}

// Create global theme manager instance
window.ThemeManager = new ThemeManager();

// Auto-initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  window.ThemeManager.initialize().catch(error => {
    console.error('Failed to initialize theme system:', error);
  });
});

// Add CSS for smooth transitions
const transitionStyle = document.createElement('style');
transitionStyle.textContent = `
  .theme-transitioning * {
    transition: background-color 300ms ease-out, 
                color 300ms ease-out, 
                border-color 300ms ease-out, 
                box-shadow 300ms ease-out !important;
  }
  
  .theme-transitioning *:before,
  .theme-transitioning *:after {
    transition: background-color 300ms ease-out, 
                color 300ms ease-out, 
                border-color 300ms ease-out, 
                box-shadow 300ms ease-out !important;
  }
`;

document.head.appendChild(transitionStyle);