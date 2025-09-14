/**
 * Main Application Controller
 * Coordinates all application modules and handles initialization
 * 
 * @author Croatian Working Law Fact Checker
 * @version 1.0.0
 */

class CroatianLawApp {
  constructor() {
    this.version = '1.0.0';
    this.isInitialized = false;
    this.isLoading = true;
    
    // Module references
    this.database = null;
    this.languageManager = null;
    this.searchEngine = null;
    this.relevanceScoring = null;
    this.themeManager = null;
    
    // UI references
    this.elements = {};
    
    // Configuration
    this.config = {
      dataPath: 'assets/data/croatian-working-law.json',
      minSearchLength: 2,
      maxSearchResults: 50,
      searchDebounceDelay: 300,
      animationDuration: 300,
      autoSaveInterval: 30000, // 30 seconds
      offlineStorageKey: 'croatianLawOfflineData',
      userPreferencesKey: 'croatianLawPreferences',
      enableAnalytics: false,
      enableOfflineMode: true
    };
    
    // Application state
    this.state = {
      isOnline: navigator.onLine,
      currentLanguage: 'en',
      currentTheme: 'light',
      searchQuery: '',
      activeFilters: [],
      currentPage: 1,
      totalResults: 0,
      hasError: false,
      errorMessage: '',
      isFirstLoad: true,
      userProfile: null
    };
    
    // Performance metrics
    this.metrics = {
      startTime: performance.now(),
      initTime: 0,
      searchCount: 0,
      totalSearchTime: 0,
      averageSearchTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    console.log('🚀 Croatian Working Law Fact Checker v' + this.version);
  }

  /**
   * Initialize the application
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('Application already initialized');
      return;
    }
    
    try {
      console.log('🔧 Initializing Croatian Law App...');
      
      // Show loading state
      this.showLoadingState();
      
      // Initialize in sequence for dependencies
      await this.initializeCore();
      await this.initializeModules();
      await this.initializeUI();
      await this.loadApplicationData();
      await this.setupEventListeners();
      await this.restoreApplicationState();
      
      // Hide loading state
      this.hideLoadingState();
      
      // Mark as initialized
      this.isInitialized = true;
      this.isLoading = false;
      this.metrics.initTime = performance.now() - this.metrics.startTime;
      
      // Setup auto-save
      this.setupAutoSave();
      
      // Setup offline detection
      this.setupOfflineDetection();
      
      // Dispatch app ready event
      this.dispatchAppReadyEvent();
      
      console.log(`✅ Application initialized successfully in ${this.metrics.initTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.handleInitializationError(error);
      throw error;
    }
  }

  /**
   * Initialize core functionality
   * @private
   * @returns {Promise<void>}
   */
  async initializeCore() {
    // Bind window reference
    window.CroatianLawApp = this;
    
    // Initialize error handling
    this.setupGlobalErrorHandling();
    
    // Check browser compatibility
    this.checkBrowserCompatibility();
    
    // Load user preferences
    await this.loadUserPreferences();
    
    console.log('✅ Core functionality initialized');
  }

  /**
   * Initialize all application modules
   * @private
   * @returns {Promise<void>}
   */
  async initializeModules() {
    const initPromises = [];
    
    // Initialize theme manager first (affects visual loading)
    if (window.ThemeManager) {
      this.themeManager = window.ThemeManager;
      if (!this.themeManager.isInitialized) {
        initPromises.push(this.themeManager.initialize());
      }
    }
    
    // Initialize database manager
    if (window.Database) {
      this.database = window.Database;
      if (!this.database.isInitialized) {
        initPromises.push(this.database.initialize());
      }
    }
    
    // Initialize language manager
    if (window.LanguageManager) {
      this.languageManager = window.LanguageManager;
      if (!this.languageManager.isInitialized) {
        initPromises.push(this.languageManager.initialize());
      }
    }
    
    // Initialize search engine
    if (window.SearchEngine) {
      this.searchEngine = window.SearchEngine;
      // Will initialize with database reference later
    }
    
    // Initialize relevance scoring
    if (window.RelevanceScoring) {
      this.relevanceScoring = window.RelevanceScoring;
      initPromises.push(this.relevanceScoring.initialize());
    }
    
    // Wait for all modules to initialize
    await Promise.all(initPromises);
    
    // Setup module interconnections
    this.setupModuleInterconnections();
    
    console.log('✅ All modules initialized');
  }

  /**
   * Setup connections between modules
   * @private
   */
  setupModuleInterconnections() {
    // All modules initialize themselves and connect automatically
    console.log('✅ Module interconnections established');
  }

  /**
   * Initialize UI components
   * @private
   * @returns {Promise<void>}
   */
  async initializeUI() {
    // Cache DOM elements
    this.cacheUIElements();
    
    // Setup UI components
    this.setupSearchInterface();
    this.setupFilters();
    this.setupResultsDisplay();
    this.setupLanguageSelector();
    this.setupAccessibility();
    
    // Initialize UI state
    this.updateUIState();
    
    console.log('✅ UI components initialized');
  }

  /**
   * Cache frequently used DOM elements
   * @private
   */
  cacheUIElements() {
    this.elements = {
      // Loading elements
      loadingOverlay: document.getElementById('loading-overlay'),
      loadingSpinner: document.querySelector('.loading-spinner'),
      loadingText: document.querySelector('.loading-text'),
      
      // Search elements
      searchInput: document.getElementById('search-input'),
      searchButton: document.getElementById('search-button'),
      searchSuggestions: document.getElementById('search-suggestions'),
      clearSearch: document.getElementById('clear-search'),
      
      // Filter elements
      categoryFilter: document.getElementById('category-filter'),
      sortBy: document.getElementById('sort-by'),
      filtersContainer: document.querySelector('.search-filters'),
      
      // Results elements
      searchResults: document.getElementById('search-results'),
      resultsCount: document.getElementById('results-count'),
      resultsPagination: document.getElementById('results-pagination'),
      noResults: document.getElementById('no-results'),
      
      // Language elements
      languageSelector: document.getElementById('language-selector'),
      languageToggle: document.getElementById('language-toggle'),
      
      // Theme elements
      themeToggle: document.getElementById('theme-toggle'),
      
      // Error elements
      errorContainer: document.getElementById('error-container'),
      errorMessage: document.getElementById('error-message'),
      
      // Main containers
      headerContainer: document.querySelector('header'),
      mainContainer: document.querySelector('main'),
      footerContainer: document.querySelector('footer'),
      
      // PWA elements
      installButton: document.getElementById('install-app'),
      offlineIndicator: document.getElementById('offline-indicator')
    };
    
    // Log missing elements in development
    if (window.location.hostname === 'localhost') {
      Object.entries(this.elements).forEach(([key, element]) => {
        if (!element) {
          console.warn(`UI element not found: ${key}`);
        }
      });
    }
  }

  /**
   * Setup search interface
   * @private
   */
  setupSearchInterface() {
    if (!this.elements.searchInput) return;
    
    // Search input handling
    this.elements.searchInput.addEventListener('input', 
      this.debounce(this.handleSearchInput.bind(this), this.config.searchDebounceDelay)
    );
    
    // Search button handling
    if (this.elements.searchButton) {
      this.elements.searchButton.addEventListener('click', this.handleSearchSubmit.bind(this));
    }
    
    // Clear search handling
    if (this.elements.clearSearch) {
      this.elements.clearSearch.addEventListener('click', this.clearSearch.bind(this));
    }
    
    // Keyboard shortcuts
    this.elements.searchInput.addEventListener('keydown', this.handleSearchKeydown.bind(this));
    
    // Focus management
    this.setupSearchFocusManagement();
  }

  /**
   * Setup search focus management
   * @private
   */
  setupSearchFocusManagement() {
    // Focus search on Ctrl+K or Cmd+K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        this.elements.searchInput?.focus();
      }
    });
    
    // Escape to clear focus
    this.elements.searchInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.elements.searchInput.blur();
        this.hideSuggestions();
      }
    });
  }

  /**
   * Setup filter controls
   * @private
   */
  setupFilters() {
    // Category filter
    if (this.elements.categoryFilter) {
      this.elements.categoryFilter.addEventListener('change', this.handleFilterChange.bind(this));
    }
    
    // Sort by
    if (this.elements.sortBy) {
      this.elements.sortBy.addEventListener('change', this.handleSortChange.bind(this));
    }
  }

  /**
   * Setup results display
   * @private
   */
  setupResultsDisplay() {
    // Pagination handling is setup dynamically
    // Result click handling is delegated to the results container
    if (this.elements.searchResults) {
      this.elements.searchResults.addEventListener('click', this.handleResultClick.bind(this));
    }
  }

  /**
   * Setup language selector
   * @private
   */
  setupLanguageSelector() {
    if (this.elements.languageSelector) {
      this.elements.languageSelector.addEventListener('change', this.handleLanguageChange.bind(this));
    }
    
    if (this.elements.languageToggle) {
      this.elements.languageToggle.addEventListener('click', this.toggleLanguageMenu.bind(this));
    }
  }

  /**
   * Setup accessibility features
   * @private
   */
  setupAccessibility() {
    // High contrast mode detection
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)');
    if (prefersHighContrast.matches) {
      document.body.classList.add('high-contrast');
    }
    
    prefersHighContrast.addEventListener('change', (e) => {
      document.body.classList.toggle('high-contrast', e.matches);
    });
    
    // Reduced motion detection
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (prefersReducedMotion.matches) {
      document.body.classList.add('reduced-motion');
    }
    
    prefersReducedMotion.addEventListener('change', (e) => {
      document.body.classList.toggle('reduced-motion', e.matches);
    });
    
    // ARIA live regions
    this.setupAriaLiveRegions();
  }

  /**
   * Setup ARIA live regions for screen readers
   * @private
   */
  setupAriaLiveRegions() {
    // Create live region for search results
    if (!document.getElementById('search-status')) {
      const searchStatus = document.createElement('div');
      searchStatus.id = 'search-status';
      searchStatus.setAttribute('aria-live', 'polite');
      searchStatus.setAttribute('aria-atomic', 'true');
      searchStatus.classList.add('sr-only');
      document.body.appendChild(searchStatus);
    }
    
    // Create live region for error messages
    if (!document.getElementById('error-status')) {
      const errorStatus = document.createElement('div');
      errorStatus.id = 'error-status';
      errorStatus.setAttribute('aria-live', 'assertive');
      errorStatus.setAttribute('aria-atomic', 'true');
      errorStatus.classList.add('sr-only');
      document.body.appendChild(errorStatus);
    }
  }

  /**
   * Load application data
   * @private
   * @returns {Promise<void>}
   */
  async loadApplicationData() {
    try {
      if (this.database) {
        await this.database.loadData(this.config.dataPath);
      }
      
      console.log('✅ Application data loaded');
    } catch (error) {
      console.error('Failed to load application data:', error);
      await this.handleDataLoadError(error);
    }
  }

  /**
   * Setup global event listeners
   * @private
   * @returns {Promise<void>}
   */
  async setupEventListeners() {
    // Module events
    this.setupModuleEventListeners();
    
    // Window events
    window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    
    // Document events
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    
    // Error events
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    
    console.log('✅ Event listeners setup');
  }

  /**
   * Setup module-specific event listeners
   * @private
   */
  setupModuleEventListeners() {
    // Language change events
    document.addEventListener('languageChanged', this.handleLanguageChanged.bind(this));
    
    // Theme change events
    document.addEventListener('themeChanged', this.handleThemeChanged.bind(this));
    
    // Search events
    document.addEventListener('searchStarted', this.handleSearchStarted.bind(this));
    document.addEventListener('searchCompleted', this.handleSearchCompleted.bind(this));
    document.addEventListener('searchError', this.handleSearchError.bind(this));
  }

  /**
   * Restore application state from storage
   * @private
   * @returns {Promise<void>}
   */
  async restoreApplicationState() {
    try {
      // Restore search state
      const savedSearch = sessionStorage.getItem('croatianLawLastSearch');
      if (savedSearch && this.elements.searchInput) {
        const searchData = JSON.parse(savedSearch);
        this.elements.searchInput.value = searchData.query;
        this.state.searchQuery = searchData.query;
        
        // Restore filters
        if (searchData.filters) {
          this.applyFilters(searchData.filters);
        }
        
        // Perform search if there was a previous query
        if (searchData.query.length >= this.config.minSearchLength) {
          await this.performSearch(searchData.query);
        }
      }
      
      console.log('✅ Application state restored');
    } catch (error) {
      console.warn('Failed to restore application state:', error);
    }
  }

  /**
   * Load user preferences
   * @private
   * @returns {Promise<void>}
   */
  async loadUserPreferences() {
    try {
      const preferences = localStorage.getItem(this.config.userPreferencesKey);
      if (preferences) {
        const userPrefs = JSON.parse(preferences);
        
        // Apply preferences
        if (userPrefs.language) {
          this.state.currentLanguage = userPrefs.language;
        }
        
        if (userPrefs.theme) {
          this.state.currentTheme = userPrefs.theme;
        }
        
        if (userPrefs.searchSettings) {
          Object.assign(this.config, userPrefs.searchSettings);
        }
      }
      
      console.log('✅ User preferences loaded');
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
  }

  /**
   * Save user preferences
   * @private
   */
  saveUserPreferences() {
    try {
      const preferences = {
        language: this.state.currentLanguage,
        theme: this.state.currentTheme,
        searchSettings: {
          maxSearchResults: this.config.maxSearchResults,
          searchDebounceDelay: this.config.searchDebounceDelay
        },
        timestamp: Date.now()
      };
      
      localStorage.setItem(this.config.userPreferencesKey, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  }

  /**
   * Handle search input
   * @private
   * @param {Event} event - Input event
   */
  async handleSearchInput(event) {
    const query = event.target.value.trim();
    this.state.searchQuery = query;
    
    // Save search state
    this.saveSearchState();
    
    if (query.length === 0) {
      this.clearResults();
      this.hideSuggestions();
      return;
    }
    
    if (query.length < this.config.minSearchLength) {
      this.showMinLengthMessage();
      return;
    }
    
    // Show search suggestions
    if (this.searchEngine) {
      const suggestions = await this.searchEngine.getSuggestions(query);
      this.showSuggestions(suggestions);
    }
    
    // Perform search
    await this.performSearch(query);
  }

  /**
   * Handle search submission
   * @private
   * @param {Event} event - Submit event
   */
  async handleSearchSubmit(event) {
    event.preventDefault();
    
    const query = this.elements.searchInput?.value.trim();
    if (!query || query.length < this.config.minSearchLength) return;
    
    this.hideSuggestions();
    await this.performSearch(query);
  }

  /**
   * Handle search keydown events
   * @private
   * @param {KeyboardEvent} event - Keyboard event
   */
  handleSearchKeydown(event) {
    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        this.handleSearchSubmit(event);
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        this.navigateSuggestions('down');
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        this.navigateSuggestions('up');
        break;
        
      case 'Escape':
        this.hideSuggestions();
        break;
    }
  }

  /**
   * Perform search operation
   * @private
   * @param {string} query - Search query
   * @returns {Promise<void>}
   */
  async performSearch(query) {
    if (!this.searchEngine) {
      console.error('Search engine not available');
      return;
    }
    
    const startTime = performance.now();
    
    try {
      // Show loading state
      this.showSearchLoading();
      
      // Dispatch search started event
      document.dispatchEvent(new CustomEvent('searchStarted', {
        detail: { query }
      }));
      
      // Perform search
      const results = await this.searchEngine.search(query, {
        maxResults: this.config.maxSearchResults,
        filters: this.state.activeFilters,
        page: this.state.currentPage
      });
      
      // Update metrics
      const searchTime = performance.now() - startTime;
      this.updateSearchMetrics(searchTime);
      
      // Display results
      this.displaySearchResults(results, query);
      
      // Track search for relevance scoring
      if (this.relevanceScoring) {
        this.relevanceScoring.trackSearch(query, results);
      }
      
      // Update search status for screen readers
      this.updateSearchStatus(results.length, query);
      
      // Dispatch search completed event
      document.dispatchEvent(new CustomEvent('searchCompleted', {
        detail: { query, results, searchTime }
      }));
      
    } catch (error) {
      console.error('Search failed:', error);
      this.handleSearchError(error);
    } finally {
      this.hideSearchLoading();
    }
  }

  /**
   * Display search results
   * @private
   * @param {Array} results - Search results
   * @param {string} query - Search query
   */
  displaySearchResults(results, query) {
    if (!this.elements.searchResults) return;
    
    this.state.totalResults = results.length;
    
    if (results.length === 0) {
      this.showNoResults(query);
      return;
    }
    
    // Clear previous results
    this.elements.searchResults.innerHTML = '';
    
    // Display results
    results.forEach((result, index) => {
      const resultElement = this.createResultElement(result, index, query);
      this.elements.searchResults.appendChild(resultElement);
    });
    
    // Update results count
    if (this.elements.resultsCount) {
      this.elements.resultsCount.textContent = 
        `Found ${results.length} result${results.length !== 1 ? 's' : ''} for "${query}"`;
    }
    
    // Setup pagination if needed
    this.setupResultsPagination(results.length);
    
    // Scroll to results
    this.scrollToResults();
  }

  /**
   * Create a result element
   * @private
   * @param {Object} result - Result data
   * @param {number} index - Result index
   * @param {string} query - Search query
   * @returns {HTMLElement} Result element
   */
  createResultElement(result, index, query) {
    const article = document.createElement('article');
    article.className = 'neumorphic-card search-result-card';
    article.setAttribute('data-result-id', result.id);
    article.setAttribute('tabindex', '0');
    article.setAttribute('role', 'button');
    article.setAttribute('aria-label', `Search result ${index + 1}: ${result.title}`);
    
    // Highlight matching text
    const highlightedTitle = this.highlightSearchTerms(result.title, query);
    const highlightedContent = this.highlightSearchTerms(result.content, query);
    
    article.innerHTML = `
      <header class="result-header">
        <h3 class="result-title">${highlightedTitle}</h3>
        <div class="result-meta">
          <span class="result-category">${result.category || 'General'}</span>
          <span class="result-score" aria-label="Relevance score: ${Math.round(result.score * 100)}%">
            ${Math.round(result.score * 100)}% match
          </span>
        </div>
      </header>
      <div class="result-content">
        <p>${highlightedContent}</p>
      </div>
      <footer class="result-footer">
        <span class="result-source">Article ${result.articleNumber || 'N/A'}</span>
        <button class="result-action neumorphic-btn" aria-label="View full article">
          View Details
        </button>
      </footer>
    `;
    
    return article;
  }

  /**
   * Highlight search terms in text
   * @private
   * @param {string} text - Text to highlight
   * @param {string} query - Search query
   * @returns {string} Highlighted text
   */
  highlightSearchTerms(text, query) {
    if (!text || !query) return text;
    
    const terms = query.toLowerCase().split(/\s+/);
    let highlightedText = text;
    
    terms.forEach(term => {
      if (term.length < 2) return;
      
      const regex = new RegExp(`(${this.escapeRegex(term)})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
    });
    
    return highlightedText;
  }

  /**
   * Escape special regex characters
   * @private
   * @param {string} string - String to escape
   * @returns {string} Escaped string
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Show loading state
   * @private
   */
  showLoadingState() {
    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.classList.add('visible');
    }
    
    if (this.elements.mainContainer) {
      this.elements.mainContainer.setAttribute('aria-busy', 'true');
    }
  }

  /**
   * Hide loading state
   * @private
   */
  hideLoadingState() {
    if (this.elements.loadingOverlay) {
      this.elements.loadingOverlay.classList.remove('visible');
    }
    
    if (this.elements.mainContainer) {
      this.elements.mainContainer.setAttribute('aria-busy', 'false');
    }
  }

  /**
   * Show search loading state
   * @private
   */
  showSearchLoading() {
    if (this.elements.searchButton) {
      this.elements.searchButton.setAttribute('aria-busy', 'true');
      this.elements.searchButton.classList.add('loading');
    }
  }

  /**
   * Hide search loading state
   * @private
   */
  hideSearchLoading() {
    if (this.elements.searchButton) {
      this.elements.searchButton.setAttribute('aria-busy', 'false');
      this.elements.searchButton.classList.remove('loading');
    }
  }

  /**
   * Update search metrics
   * @private
   * @param {number} searchTime - Time taken for search
   */
  updateSearchMetrics(searchTime) {
    this.metrics.searchCount++;
    this.metrics.totalSearchTime += searchTime;
    this.metrics.averageSearchTime = this.metrics.totalSearchTime / this.metrics.searchCount;
  }

  /**
   * Save current search state
   * @private
   */
  saveSearchState() {
    try {
      const searchState = {
        query: this.state.searchQuery,
        filters: this.state.activeFilters,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('croatianLawLastSearch', JSON.stringify(searchState));
    } catch (error) {
      console.warn('Failed to save search state:', error);
    }
  }

  /**
   * Setup auto-save functionality
   * @private
   */
  setupAutoSave() {
    setInterval(() => {
      this.saveUserPreferences();
    }, this.config.autoSaveInterval);
  }

  /**
   * Setup offline detection
   * @private
   */
  setupOfflineDetection() {
    window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
    window.addEventListener('offline', this.handleOnlineStatusChange.bind(this));
    
    this.updateOnlineStatus();
  }

  /**
   * Handle online status change
   * @private
   */
  handleOnlineStatusChange() {
    this.state.isOnline = navigator.onLine;
    this.updateOnlineStatus();
  }

  /**
   * Update online status indicator
   * @private
   */
  updateOnlineStatus() {
    if (this.elements.offlineIndicator) {
      this.elements.offlineIndicator.classList.toggle('visible', !this.state.isOnline);
    }
    
    console.log(`📡 App is ${this.state.isOnline ? 'online' : 'offline'}`);
  }

  /**
   * Setup global error handling
   * @private
   */
  setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.handleError(event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.handleError(event.reason);
    });
  }

  /**
   * Handle errors
   * @private
   * @param {Error} error - Error object
   */
  handleError(error) {
    this.state.hasError = true;
    this.state.errorMessage = error.message || 'An unknown error occurred';
    
    this.showErrorMessage(this.state.errorMessage);
    
    // Track error for analytics (if enabled)
    if (this.config.enableAnalytics) {
      this.trackError(error);
    }
  }

  /**
   * Check browser compatibility
   * @private
   */
  checkBrowserCompatibility() {
    const requiredFeatures = [
      { name: 'fetch', check: () => typeof window.fetch !== 'undefined' },
      { name: 'Promise', check: () => typeof window.Promise !== 'undefined' },
      { name: 'localStorage', check: () => typeof window.localStorage !== 'undefined' },
      { name: 'addEventListener', check: () => typeof window.addEventListener !== 'undefined' },
      { name: 'querySelector', check: () => typeof document.querySelector !== 'undefined' }
    ];
    
    const missingFeatures = requiredFeatures.filter(feature => 
      !feature.check()
    ).map(feature => feature.name);
    
    if (missingFeatures.length > 0) {
      console.error('Browser missing required features:', missingFeatures);
      this.showCompatibilityError(missingFeatures);
    }
  }

  /**
   * Show compatibility error message
   * @private
   * @param {Array} missingFeatures - Array of missing features
   */
  showCompatibilityError(missingFeatures) {
    const errorContainer = document.getElementById('error-container') || document.body;
    const errorMessage = document.createElement('div');
    errorMessage.className = 'compatibility-error alert alert-danger';
    errorMessage.innerHTML = `
      <h4>Browser Compatibility Issue</h4>
      <p>Your browser is missing some features required for this application:</p>
      <ul>
        ${missingFeatures.map(feature => `<li>${feature}</li>`).join('')}
      </ul>
      <p>Please update your browser or try a modern browser like Chrome, Firefox, or Edge.</p>
    `;
    errorContainer.appendChild(errorMessage);
  }

  /**
   * Handle initialization error
   * @private
   * @param {Error} error - Initialization error
   */
  handleInitializationError(error) {
    console.error('Initialization error:', error);
    
    this.state.hasError = true;
    this.state.errorMessage = error.message || 'Failed to initialize application';
    
    // Show error to user
    const errorContainer = document.getElementById('error-container') || document.body;
    const errorMessage = document.createElement('div');
    errorMessage.className = 'initialization-error alert alert-danger';
    errorMessage.innerHTML = `
      <h4>Application Failed to Load</h4>
      <p>There was an error initializing the Croatian Working Law Fact Checker:</p>
      <p><strong>${this.state.errorMessage}</strong></p>
      <p>Please refresh the page to try again. If the problem persists, check the browser console for more details.</p>
      <button onclick="window.location.reload()" class="btn btn-primary">Refresh Page</button>
    `;
    errorContainer.appendChild(errorMessage);
    
    // Hide loading state
    this.hideLoadingState();
  }

  /**
   * Dispatch app ready event
   * @private
   */
  dispatchAppReadyEvent() {
    const event = new CustomEvent('croatianLawAppReady', {
      detail: {
        version: this.version,
        initTime: this.metrics.initTime,
        modules: {
          database: !!this.database,
          languageManager: !!this.languageManager,
          searchEngine: !!this.searchEngine,
          relevanceScoring: !!this.relevanceScoring,
          themeManager: !!this.themeManager
        }
      }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Debounce utility function
   * @private
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Get application information
   * @returns {Object} Application info
   */
  getAppInfo() {
    return {
      version: this.version,
      isInitialized: this.isInitialized,
      modules: {
        database: this.database?.isInitialized,
        languageManager: this.languageManager?.isInitialized,
        searchEngine: this.searchEngine?.isInitialized,
        relevanceScoring: this.relevanceScoring?.isInitialized,
        themeManager: this.themeManager?.isInitialized
      },
      state: { ...this.state },
      metrics: { ...this.metrics }
    };
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      uptime: performance.now() - this.metrics.startTime,
      memoryUsage: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null
    };
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  window.croatianLawApp = new CroatianLawApp();
  
  try {
    await window.croatianLawApp.initialize();
  } catch (error) {
    console.error('Failed to start Croatian Law App:', error);
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CroatianLawApp;
}