/**
 * Language Detection and Management System
 * Handles automatic language detection, switching, and internationalization
 * 
 * @author Croatian Working Law Fact Checker
 * @version 1.0.0
 */

class LanguageManager {
  constructor() {
    this.currentLanguage = 'hr';
    this.supportedLanguages = ['hr', 'en', 'es'];
    this.translations = {};
    this.isInitialized = false;
    
    // Language detection patterns
    this.languagePatterns = {
      hr: {
        // Croatian specific patterns
        words: [
          'članak', 'radnik', 'radnica', 'poslodavac', 'ugovor', 'radu', 'rada', 'posao', 'posla',
          'zaposlavanje', 'zaposlenik', 'zaposlenica', 'otkaz', 'otkazuje', 'prekida',
          'godišnji', 'odmor', 'dopust', 'bolovanje', 'bolovan', 'plaća', 'plaće',
          'naknada', 'naknade', 'satnica', 'radni', 'radna', 'radno', 'vrijeme', 'vremena',
          'smjena', 'smjene', 'prekovremeni', 'noćni', 'vikend', 'praznici'
        ],
        chars: ['č', 'ć', 'ž', 'š', 'đ'],
        commonWords: ['i', 'u', 'na', 'za', 'od', 'do', 'iz', 'sa', 'po', 'pri', 'kroz', 'je', 'su', 'se']
      },
      en: {
        // English specific patterns
        words: [
          'employment', 'employee', 'employer', 'contract', 'work', 'job', 'labor', 'labour',
          'termination', 'dismissal', 'firing', 'layoff', 'vacation', 'holiday', 'leave',
          'salary', 'wage', 'wages', 'compensation', 'overtime', 'hours', 'shift',
          'sick', 'medical', 'benefits', 'annual', 'working', 'time'
        ],
        chars: [],
        commonWords: ['the', 'and', 'or', 'of', 'to', 'in', 'for', 'with', 'by', 'from', 'is', 'are', 'was']
      },
      es: {
        // Spanish specific patterns
        words: [
          'empleo', 'empleado', 'empleada', 'empleador', 'contrato', 'trabajo', 'laboral',
          'terminación', 'despido', 'cese', 'vacaciones', 'días', 'libres', 'permiso',
          'salario', 'sueldo', 'compensación', 'horas', 'extras', 'turno', 'enfermedad',
          'médico', 'beneficios', 'anual', 'trabajador', 'trabajadora'
        ],
        chars: ['ñ', 'á', 'é', 'í', 'ó', 'ú'],
        commonWords: ['el', 'la', 'y', 'o', 'de', 'en', 'por', 'para', 'con', 'es', 'son', 'está']
      }
    };
    
    // Initialize with browser language preference
    this.detectBrowserLanguage();
  }

  /**
   * Initialize the language system
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🌍 Initializing language system...');
      
      // Load translations
      await this.loadTranslations();
      
      // Restore saved language preference
      this.restoreLanguagePreference();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Apply initial language
      await this.setLanguage(this.currentLanguage);
      
      this.isInitialized = true;
      console.log(`✅ Language system initialized with ${this.currentLanguage.toUpperCase()}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize language system:', error);
      throw error;
    }
  }

  /**
   * Load translation strings
   * @private
   * @returns {Promise<void>}
   */
  async loadTranslations() {
    this.translations = {
      hr: {
        // Croatian translations
        'app-title': 'Hrvatski Zakon o Radu - Provjera Činjenica',
        'app-subtitle': 'Pretraživanje hrvatskog radnog zakonodavstva',
        'search-placeholder': 'Pretražite članke hrvatskog radnog zakonodavstva...',
        'all': 'Svi članci',
        'employment': 'Zapošljavanje',
        'termination': 'Otkaz',
        'vacation': 'Odmor i dopust',
        'wages': 'Plaće i naknade',
        'working-time': 'Radno vrijeme',
        'relevance': 'Relevantnost',
        'article-number': 'Broj članka',
        'alphabetical': 'Abecedno',
        'results-found': 'rezultata pronađeno',
        'no-results-title': 'Nema rezultata',
        'no-results-text': 'Pokušajte s drugim ključnim riječima ili pregledajte po kategorijama',
        'try-searching': 'Pokušajte pretražiti:',
        'load-more': 'Učitaj više rezultata',
        'this-helped': 'Ovo je ono što sam tražio/la',
        'this-didnt-help': 'Ovo nije korisno',
        'footer-text': 'Podaci preuzeti iz službenih dokumenata hrvatskog radnog zakonodavstva',
        'footer-disclaimer': 'Ovaj alat je samo u informacijske svrhe. Za specifične savjete uvijek se obratite pravnim stručnjacima.',
        'source-link': 'Službeni izvor',
        'loading': 'Učitavanje...',
        'search-in-progress': 'Pretraživanje u tijeku...',
        'feedback-success': 'Hvala vam na povratnim informacijama!',
        'feedback-error': 'Dogodila se greška prilikom spremanja povratnih informacija',
        'database-loading': 'Učitavanje baze podataka...',
        'database-error': 'Greška baze podataka'
      },
      en: {
        // English translations
        'app-title': 'Croatian Working Law Fact Checker',
        'app-subtitle': 'Multilingual search for Croatian labor law',
        'search-placeholder': 'Search Croatian labor law articles...',
        'all': 'All Articles',
        'employment': 'Employment',
        'termination': 'Termination',
        'vacation': 'Vacation & Leave',
        'wages': 'Wages & Benefits',
        'working-time': 'Working Time',
        'relevance': 'Relevance',
        'article-number': 'Article Number',
        'alphabetical': 'Alphabetical',
        'results-found': 'results found',
        'no-results-title': 'No results found',
        'no-results-text': 'Try different keywords or browse by category',
        'try-searching': 'Try searching for:',
        'load-more': 'Load More Results',
        'this-helped': 'This is what I was looking for',
        'this-didnt-help': 'This is not helpful',
        'footer-text': 'Data sourced from official Croatian labor law documents',
        'footer-disclaimer': 'This tool is for informational purposes only. Always consult legal professionals for specific advice.',
        'source-link': 'Official Source',
        'loading': 'Loading...',
        'search-in-progress': 'Search in progress...',
        'feedback-success': 'Thank you for your feedback!',
        'feedback-error': 'An error occurred while saving feedback',
        'database-loading': 'Loading database...',
        'database-error': 'Database Error'
      },
      es: {
        // Spanish translations
        'app-title': 'Verificador de Hechos de la Ley Laboral Croata',
        'app-subtitle': 'Búsqueda multilingüe para la ley laboral croata',
        'search-placeholder': 'Buscar artículos de la ley laboral croata...',
        'all': 'Todos los Artículos',
        'employment': 'Empleo',
        'termination': 'Terminación',
        'vacation': 'Vacaciones y Permisos',
        'wages': 'Salarios y Beneficios',
        'working-time': 'Horario de Trabajo',
        'relevance': 'Relevancia',
        'article-number': 'Número de Artículo',
        'alphabetical': 'Alfabético',
        'results-found': 'resultados encontrados',
        'no-results-title': 'No se encontraron resultados',
        'no-results-text': 'Prueba con diferentes palabras clave o navega por categoría',
        'try-searching': 'Intenta buscar:',
        'load-more': 'Cargar Más Resultados',
        'this-helped': 'Esto es lo que estaba buscando',
        'this-didnt-help': 'Esto no es útil',
        'footer-text': 'Datos obtenidos de documentos oficiales de la ley laboral croata',
        'footer-disclaimer': 'Esta herramienta es solo para fines informativos. Siempre consulte a profesionales legales para obtener asesoramiento específico.',
        'source-link': 'Fuente Oficial',
        'loading': 'Cargando...',
        'search-in-progress': 'Búsqueda en progreso...',
        'feedback-success': '¡Gracias por tus comentarios!',
        'feedback-error': 'Ocurrió un error al guardar los comentarios',
        'database-loading': 'Cargando base de datos...',
        'database-error': 'Error de Base de Datos'
      }
    };
  }

  /**
   * Detect browser language preference
   * @private
   */
  detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    const langCode = browserLang.split('-')[0].toLowerCase();
    
    if (this.supportedLanguages.includes(langCode)) {
      this.currentLanguage = langCode;
    } else {
      this.currentLanguage = 'hr'; // Default to Croatian
    }
  }

  /**
   * Restore saved language preference from localStorage
   * @private
   */
  restoreLanguagePreference() {
    try {
      const savedLang = localStorage.getItem('croatianLawLanguage');
      if (savedLang && this.supportedLanguages.includes(savedLang)) {
        this.currentLanguage = savedLang;
      }
    } catch (error) {
      console.warn('Unable to restore language preference:', error);
    }
  }

  /**
   * Save language preference to localStorage
   * @private
   */
  saveLanguagePreference() {
    try {
      localStorage.setItem('croatianLawLanguage', this.currentLanguage);
    } catch (error) {
      console.warn('Unable to save language preference:', error);
    }
  }

  /**
   * Setup event listeners for language switching
   * @private
   */
  setupEventListeners() {
    // Language selector button
    const languageBtn = document.getElementById('language-btn');
    const languageDropdown = document.getElementById('language-dropdown');
    
    if (languageBtn && languageDropdown) {
      languageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isExpanded = languageBtn.getAttribute('aria-expanded') === 'true';
        languageBtn.setAttribute('aria-expanded', !isExpanded);
        languageDropdown.classList.toggle('show', !isExpanded);
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        languageBtn.setAttribute('aria-expanded', 'false');
        languageDropdown.classList.remove('show');
      });
      
      // Language option selection
      languageDropdown.addEventListener('click', (e) => {
        const option = e.target.closest('.language-option');
        if (option) {
          const newLang = option.getAttribute('data-lang');
          if (newLang && this.supportedLanguages.includes(newLang)) {
            this.setLanguage(newLang);
          }
        }
      });
    }
  }

  /**
   * Detect language of input text
   * @param {string} text - Text to analyze
   * @returns {string} Detected language code
   */
  detectLanguage(text) {
    if (!text || text.trim().length < 3) {
      return this.currentLanguage;
    }
    
    const normalizedText = text.toLowerCase().trim();
    const scores = {};
    
    // Initialize scores
    this.supportedLanguages.forEach(lang => {
      scores[lang] = 0;
    });
    
    // Check for language-specific characters
    this.supportedLanguages.forEach(lang => {
      const chars = this.languagePatterns[lang].chars;
      chars.forEach(char => {
        const matches = (normalizedText.match(new RegExp(char, 'g')) || []).length;
        scores[lang] += matches * 10; // High weight for special characters
      });
    });
    
    // Check for language-specific words
    this.supportedLanguages.forEach(lang => {
      const words = this.languagePatterns[lang].words;
      words.forEach(word => {
        if (normalizedText.includes(word)) {
          scores[lang] += 5; // Medium weight for specific words
        }
      });
    });
    
    // Check for common words
    this.supportedLanguages.forEach(lang => {
      const commonWords = this.languagePatterns[lang].commonWords;
      const textWords = normalizedText.split(/\s+/);
      
      textWords.forEach(textWord => {
        if (commonWords.includes(textWord)) {
          scores[lang] += 1; // Lower weight for common words
        }
      });
    });
    
    // Find language with highest score
    let detectedLang = this.currentLanguage;
    let maxScore = 0;
    
    Object.keys(scores).forEach(lang => {
      if (scores[lang] > maxScore) {
        maxScore = scores[lang];
        detectedLang = lang;
      }
    });
    
    // Return detected language only if score is significant
    return maxScore > 2 ? detectedLang : this.currentLanguage;
  }

  /**
   * Set current language and update UI
   * @param {string} langCode - Language code
   * @returns {Promise<void>}
   */
  async setLanguage(langCode) {
    if (!this.supportedLanguages.includes(langCode)) {
      console.warn(`Unsupported language: ${langCode}`);
      return;
    }
    
    const previousLanguage = this.currentLanguage;
    this.currentLanguage = langCode;
    
    // Update HTML lang attribute
    document.documentElement.lang = langCode;
    
    // Update language selector display
    this.updateLanguageSelector();
    
    // Update all translatable elements
    this.updateTranslatableElements();
    
    // Save preference
    this.saveLanguagePreference();
    
    // Dispatch language change event
    window.dispatchEvent(new CustomEvent('languageChanged', {
      detail: {
        previousLanguage,
        currentLanguage: langCode,
        translations: this.translations[langCode]
      }
    }));
    
    console.log(`🌍 Language changed to: ${langCode.toUpperCase()}`);
  }

  /**
   * Update language selector button display
   * @private
   */
  updateLanguageSelector() {
    const currentLangElement = document.getElementById('current-language');
    if (currentLangElement) {
      currentLangElement.textContent = this.currentLanguage.toUpperCase();
    }
    
    // Update active state in dropdown
    const options = document.querySelectorAll('.language-option');
    options.forEach(option => {
      const lang = option.getAttribute('data-lang');
      option.classList.toggle('active', lang === this.currentLanguage);
    });
  }

  /**
   * Update all elements with data-i18n attributes
   * @private
   */
  updateTranslatableElements() {
    const elements = document.querySelectorAll('[data-i18n]');
    const currentTranslations = this.translations[this.currentLanguage];
    
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = currentTranslations[key];
      
      if (translation) {
        if (element.tagName === 'INPUT' && element.type === 'search') {
          element.placeholder = translation;
        } else {
          element.textContent = translation;
        }
      }
    });
  }

  /**
   * Get translation for a key
   * @param {string} key - Translation key
   * @param {string} langCode - Language code (optional, uses current language if not provided)
   * @returns {string} Translated text
   */
  t(key, langCode = null) {
    const lang = langCode || this.currentLanguage;
    const translations = this.translations[lang];
    
    if (!translations || !translations[key]) {
      console.warn(`Missing translation for key: ${key} in language: ${lang}`);
      return key;
    }
    
    return translations[key];
  }

  /**
   * Get current language code
   * @returns {string} Current language code
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get supported languages
   * @returns {Array} Array of supported language codes
   */
  getSupportedLanguages() {
    return [...this.supportedLanguages];
  }

  /**
   * Check if a language is supported
   * @param {string} langCode - Language code to check
   * @returns {boolean} Whether the language is supported
   */
  isLanguageSupported(langCode) {
    return this.supportedLanguages.includes(langCode);
  }

  /**
   * Auto-detect and switch language based on search input
   * @param {string} searchText - Search input text
   */
  autoDetectAndSwitch(searchText) {
    const detectedLang = this.detectLanguage(searchText);
    
    if (detectedLang !== this.currentLanguage) {
      console.log(`🔍 Auto-detected language: ${detectedLang.toUpperCase()} for query: "${searchText}"`);
      
      // Show a subtle notification that language was auto-detected
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          type: 'info',
          title: this.t('language-detected'),
          message: `${this.t('switched-to')} ${detectedLang.toUpperCase()}`,
          duration: 3000
        }
      }));
      
      this.setLanguage(detectedLang);
    }
  }

  /**
   * Get language-specific formatting preferences
   * @returns {Object} Formatting preferences for current language
   */
  getFormattingPreferences() {
    const preferences = {
      hr: {
        dateFormat: 'dd.MM.yyyy',
        numberFormat: { decimal: ',', thousands: '.' },
        currency: 'EUR'
      },
      en: {
        dateFormat: 'MM/dd/yyyy',
        numberFormat: { decimal: '.', thousands: ',' },
        currency: 'EUR'
      },
      es: {
        dateFormat: 'dd/MM/yyyy',
        numberFormat: { decimal: ',', thousands: '.' },
        currency: 'EUR'
      }
    };
    
    return preferences[this.currentLanguage] || preferences.hr;
  }
}

// Create global language manager instance
window.LanguageManager = new LanguageManager();

// Auto-initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  window.LanguageManager.initialize().catch(error => {
    console.error('Failed to initialize language system:', error);
  });
});