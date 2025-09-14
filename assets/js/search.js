/**
 * Advanced Search Engine for Croatian Working Law Fact Checker
 * Implements fuzzy matching, TF-IDF scoring, and real-time search
 * 
 * @author Croatian Working Law Fact Checker
 * @version 1.0.0
 */

class SearchEngine {
  constructor() {
    this.isInitialized = false;
    this.currentQuery = '';
    this.currentFilters = {
      category: 'all',
      sort: 'relevance'
    };
    this.searchTimeout = null;
    this.suggestions = [];
    this.searchHistory = [];
    this.maxHistoryItems = 10;
    this.resultsPerPage = 10;
    this.currentPage = 0;
    this.totalResults = 0;
    
    // Search performance metrics
    this.metrics = {
      totalSearches: 0,
      averageSearchTime: 0,
      cacheHitRate: 0
    };
    
    // Debounce settings
    this.debounceDelay = 300;
    this.suggestionDelay = 150;
  }

  /**
   * Initialize search engine
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🔍 Initializing search engine...');
      
      // Wait for database to be ready
      await window.Database.initialize();
      
      // Setup DOM event listeners
      this.setupEventListeners();
      
      // Load search history
      this.loadSearchHistory();
      
      // Initialize suggested searches
      this.initializeSuggestedSearches();
      
      this.isInitialized = true;
      console.log('✅ Search engine initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize search engine:', error);
      throw error;
    }
  }

  /**
   * Setup DOM event listeners
   * @private
   */
  setupEventListeners() {
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('clear-search');
    const articleFilter = document.getElementById('article-filter');
    const sortFilter = document.getElementById('sort-filter');
    const loadMoreBtn = document.getElementById('load-more-btn');
    
    // Search input events
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearchInput(e.target.value);
      });
      
      searchInput.addEventListener('keydown', (e) => {
        this.handleSearchKeydown(e);
      });
      
      searchInput.addEventListener('focus', () => {
        this.showSearchSuggestions();
      });
      
      // Clear search when input is empty
      searchInput.addEventListener('input', (e) => {
        if (clearButton) {
          clearButton.style.display = e.target.value ? 'flex' : 'none';
        }
      });
    }
    
    // Clear button
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        this.clearSearch();
      });
    }
    
    // Filter events
    if (articleFilter) {
      articleFilter.addEventListener('change', (e) => {
        this.updateFilter('category', e.target.value);
      });
    }
    
    if (sortFilter) {
      sortFilter.addEventListener('change', (e) => {
        this.updateFilter('sort', e.target.value);
      });
    }
    
    // Load more button
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.loadMoreResults();
      });
    }
    
    // Suggested search tags
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('suggested-tag')) {
        const query = e.target.getAttribute('data-query');
        if (query) {
          this.performSearch(query);
          if (searchInput) {
            searchInput.value = query;
          }
        }
      }
    });
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-box')) {
        this.hideSuggestions();
      }
    });
  }

  /**
   * Handle search input with debouncing
   * @private
   * @param {string} value - Search input value
   */
  handleSearchInput(value) {
    // Clear existing timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    
    // Update current query
    this.currentQuery = value.trim();
    
    // Show suggestions immediately for short queries
    if (this.currentQuery.length >= 2) {
      setTimeout(() => {
        this.updateSearchSuggestions(this.currentQuery);
      }, this.suggestionDelay);
    }
    
    // Perform search with debounce
    this.searchTimeout = setTimeout(() => {
      if (this.currentQuery) {
        // Auto-detect language
        if (window.LanguageManager) {
          window.LanguageManager.autoDetectAndSwitch(this.currentQuery);
        }
        
        this.performSearch(this.currentQuery);
      } else {
        this.clearResults();
      }
    }, this.debounceDelay);
  }

  /**
   * Handle keyboard navigation in search
   * @private
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleSearchKeydown(e) {
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    if (!suggestionsContainer || suggestionsContainer.style.display === 'none') {
      return;
    }
    
    const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
    let activeIndex = Array.from(suggestions).findIndex(item => 
      item.classList.contains('active')
    );
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, suggestions.length - 1);
        this.highlightSuggestion(suggestions, activeIndex);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, -1);
        this.highlightSuggestion(suggestions, activeIndex);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          const suggestionText = suggestions[activeIndex].textContent;
          this.selectSuggestion(suggestionText);
        } else if (this.currentQuery) {
          this.performSearch(this.currentQuery);
          this.hideSuggestions();
        }
        break;
        
      case 'Escape':
        this.hideSuggestions();
        e.target.blur();
        break;
    }
  }

  /**
   * Highlight suggestion item
   * @private
   * @param {NodeList} suggestions - Suggestion elements
   * @param {number} index - Index to highlight
   */
  highlightSuggestion(suggestions, index) {
    suggestions.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });
  }

  /**
   * Select a suggestion
   * @private
   * @param {string} suggestion - Selected suggestion text
   */
  selectSuggestion(suggestion) {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.value = suggestion;
      this.currentQuery = suggestion;
    }
    
    this.hideSuggestions();
    this.performSearch(suggestion);
  }

  /**
   * Perform search with current query and filters
   * @param {string} query - Search query
   * @returns {Promise<void>}
   */
  async performSearch(query = this.currentQuery) {
    if (!query.trim()) {
      this.clearResults();
      return;
    }
    
    const startTime = performance.now();
    
    try {
      // Show loading state
      this.showLoadingState(true);
      
      // Get current language
      const language = window.LanguageManager ? 
        window.LanguageManager.getCurrentLanguage() : 'hr';
      
      // Perform database search
      const results = await window.Database.searchArticles({
        query: query.trim(),
        category: this.currentFilters.category,
        language: language,
        limit: this.resultsPerPage,
        offset: this.currentPage * this.resultsPerPage
      });
      
      // Calculate search time
      const searchTime = performance.now() - startTime;
      
      // Update metrics
      this.updateMetrics(searchTime);
      
      // Display results
      this.displayResults(results, searchTime);
      
      // Add to search history
      this.addToSearchHistory(query);
      
      // Hide suggestions
      this.hideSuggestions();
      
      // Update URL with search parameters (for bookmarking)
      this.updateURL(query);
      
      console.log(`🔍 Search completed: "${query}" (${Math.round(searchTime)}ms, ${results.results.length} results)`);
      
    } catch (error) {
      console.error('❌ Search failed:', error);
      this.showErrorState('Search failed. Please try again.');
    } finally {
      this.showLoadingState(false);
    }
  }

  /**
   * Display search results
   * @private
   * @param {Object} results - Search results object
   * @param {number} searchTime - Search execution time
   */
  displayResults(results, searchTime) {
    const resultsContainer = document.getElementById('results-container');
    const searchStats = document.getElementById('search-stats');
    const noResults = document.getElementById('no-results');
    const loadMoreContainer = document.getElementById('load-more-container');
    
    if (!resultsContainer) return;
    
    // Update search stats
    if (searchStats) {
      const resultsCount = document.getElementById('results-count');
      const searchTimeElement = document.getElementById('search-time');
      
      if (resultsCount) {
        resultsCount.textContent = results.total;
      }
      
      if (searchTimeElement) {
        searchTimeElement.textContent = `(${Math.round(searchTime)}ms)`;
      }
      
      searchStats.style.display = results.total > 0 ? 'flex' : 'none';
    }
    
    // Show/hide no results message
    if (noResults) {
      noResults.style.display = results.total === 0 ? 'block' : 'none';
    }
    
    // Clear previous results if this is a new search
    if (this.currentPage === 0) {
      resultsContainer.innerHTML = '';
    }
    
    // Display results
    if (results.total > 0) {
      results.results.forEach(article => {
        const resultCard = this.createResultCard(article, results.query);
        resultsContainer.appendChild(resultCard);
      });
      
      // Show/hide load more button
      if (loadMoreContainer) {
        loadMoreContainer.style.display = results.hasMore ? 'flex' : 'none';
      }
    }
    
    // Store results for pagination
    this.totalResults = results.total;
  }

  /**
   * Create result card element
   * @private
   * @param {Object} article - Article object
   * @param {string} query - Search query for highlighting
   * @returns {HTMLElement} Result card element
   */
  createResultCard(article, query) {
    const card = document.createElement('article');
    card.className = 'result-card neumorphic-card';
    card.setAttribute('data-article-id', article.id);
    
    // Get translations based on current language
    const currentLang = window.LanguageManager ? 
      window.LanguageManager.getCurrentLanguage() : 'hr';
    
    const categoryName = window.Database?.data?.categories?.[article.category]?.[currentLang] || 
      article.category;
    
    // Language indicators
    const languageLabels = {
      'hr': '🇭🇷 Hrvatski',
      'en': '🇺🇸 English', 
      'es': '🇪🇸 Español'
    };
    
    const languageIndicator = languageLabels[article.language] || article.language;
    const crossLanguageIndicator = article.crossLanguageMatch ? 
      '<span class="cross-language-match" title="Found in multiple languages">🌍 Multilingual match</span>' : '';
    
    // Find original Croatian version and current language version
    let originalArticle = article;
    let translatedArticle = article;
    
    if (article.originalId && window.Database?.data?.articles) {
      // Find the original Croatian version
      originalArticle = window.Database.data.articles.find(art => 
        art.originalId === article.originalId && art.language === 'hr'
      ) || article;
      
      // Find the version in current language
      if (currentLang !== 'hr' && currentLang !== article.language) {
        translatedArticle = window.Database.data.articles.find(art => 
          art.originalId === article.originalId && art.language === currentLang
        ) || article;
      }
    }
    
    // Create the side-by-side content
    const createContentSection = (contentArticle, isOriginal) => {
      const label = isOriginal ? 
        `<span class="content-label">🇭🇷 ${window.LanguageManager?.t('original') || 'Original'}</span>` :
        `<span class="content-label">${languageLabels[contentArticle.language] || contentArticle.language} ${window.LanguageManager?.t('translation') || 'Translation'}</span>`;
      
      return `
        <div class="${isOriginal ? 'original-content' : 'translated-content'}">
          ${label}
          <h4 class="content-title">${contentArticle.highlightedTitle || contentArticle.title}</h4>
          <div class="content-text">${this.truncateText(contentArticle.highlightedContent || contentArticle.content, 250)}</div>
        </div>
      `;
    };
    
    // Determine if we should show side-by-side view
    const showSideBySide = currentLang !== 'hr' && originalArticle.id !== translatedArticle.id;
    
    let contentHtml = '';
    if (showSideBySide) {
      contentHtml = `
        <div class="result-content-split">
          ${createContentSection(originalArticle, true)}
          ${createContentSection(translatedArticle, false)}
        </div>
      `;
    } else {
      contentHtml = `
        <div class="result-content">
          <p class="result-text">${this.truncateText(article.highlightedContent || article.content, 300)}</p>
        </div>
      `;
    }
    
    card.innerHTML = `
      <div class="result-header">
        <h3 class="result-title">${article.highlightedTitle || article.title}</h3>
        <div class="result-language">
          <span class="language-indicator">${languageIndicator}</span>
          ${crossLanguageIndicator}
        </div>
      </div>
      
      <div class="result-meta">
        <span class="article-number">${article.articleNumber}</span>
        <span class="result-category">${categoryName}</span>
      </div>
      
      ${contentHtml}
      
      <div class="result-actions">
        <div class="relevance-actions">
          <button class="relevance-btn helpful neumorphic-btn" 
                  data-article-id="${article.id}" 
                  data-helpful="true"
                  title="${window.LanguageManager?.t('this-helped') || 'This helped'}">
            <svg class="relevance-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M23 10C23 8.89 22.1 8 21 8H14.68L15.64 3.43C15.66 3.33 15.67 3.22 15.67 3.11C15.67 2.7 15.5 2.32 15.23 2.05L14.17 1L7.59 7.58C7.22 7.95 7 8.45 7 9V19C7 20.1 7.9 21 9 21H18C18.83 21 19.54 20.5 19.84 19.78L22.86 12.73C22.95 12.5 23 12.26 23 12V10.08L23 10ZM1 21H5V9H1V21Z"/>
            </svg>
            <span>${window.LanguageManager?.t('this-helped') || 'Helpful'}</span>
          </button>
          
          <button class="relevance-btn not-helpful neumorphic-btn" 
                  data-article-id="${article.id}" 
                  data-helpful="false"
                  title="${window.LanguageManager?.t('this-didnt-help') || 'Not helpful'}">
            <svg class="relevance-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 3H6C5.17 3 4.46 3.5 4.16 4.22L1.14 11.27C1.05 11.5 1 11.74 1 12V14C1 15.1 1.9 16 3 16H9.31L8.36 20.57C8.34 20.67 8.33 20.78 8.33 20.89C8.33 21.3 8.5 21.68 8.77 21.95L9.83 23L16.41 16.42C16.78 16.05 17 15.55 17 15V5C17 3.9 16.1 3 15 3ZM19 3V15H23V3H19Z"/>
            </svg>
            <span>${window.LanguageManager?.t('this-didnt-help') || 'Not helpful'}</span>
          </button>
        </div>
        
        <div class="result-score">
          <span class="score-label">Relevance:</span>
          <div class="score-bar">
            <div class="score-fill" style="width: ${Math.min(100, (article.searchScore || article.relevanceScore || 1) * 20)}%"></div>
          </div>
          <span class="score-value">${Math.round((article.searchScore || article.relevanceScore || 1) * 100)}%</span>
        </div>
      </div>
    `;
    
    // Add event listeners for relevance buttons
    const relevanceButtons = card.querySelectorAll('.relevance-btn');
    relevanceButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        this.handleRelevanceFeedback(e);
      });
    });
    
    return card;
  }

  /**
   * Handle relevance feedback
   * @private
   * @param {Event} e - Click event
   */
  async handleRelevanceFeedback(e) {
    e.preventDefault();
    
    const button = e.currentTarget;
    const articleId = button.getAttribute('data-article-id');
    const isHelpful = button.getAttribute('data-helpful') === 'true';
    
    if (!articleId) return;
    
    try {
      // Update database relevance score
      await window.Database.updateRelevanceScore(articleId, isHelpful);
      
      // Visual feedback
      button.classList.add('pressed');
      setTimeout(() => {
        button.classList.remove('pressed');
      }, 200);
      
      // Show success toast
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          type: 'success',
          title: window.LanguageManager?.t('feedback-success') || 'Thank you!',
          message: window.LanguageManager?.t('feedback-success') || 'Your feedback helps improve search results',
          duration: 3000
        }
      }));
      
      // Disable other button in the same card
      const card = button.closest('.result-card');
      const otherButton = card.querySelector(`.relevance-btn[data-helpful="${!isHelpful}"]`);
      if (otherButton) {
        otherButton.style.opacity = '0.5';
        otherButton.style.pointerEvents = 'none';
      }
      
    } catch (error) {
      console.error('Failed to save relevance feedback:', error);
      
      // Show error toast
      window.dispatchEvent(new CustomEvent('showToast', {
        detail: {
          type: 'error',
          title: window.LanguageManager?.t('feedback-error') || 'Error',
          message: window.LanguageManager?.t('feedback-error') || 'Failed to save feedback',
          duration: 5000
        }
      }));
    }
  }

  /**
   * Truncate text to specified length
   * @private
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length
   * @returns {string} Truncated text
   */
  truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? 
      truncated.substring(0, lastSpace) + '...' : 
      truncated + '...';
  }

  /**
   * Load more search results
   * @private
   */
  async loadMoreResults() {
    this.currentPage++;
    await this.performSearch();
  }

  /**
   * Update search filter
   * @param {string} filterType - Type of filter ('category' or 'sort')
   * @param {string} value - Filter value
   */
  updateFilter(filterType, value) {
    this.currentFilters[filterType] = value;
    this.currentPage = 0; // Reset pagination
    
    if (this.currentQuery) {
      this.performSearch();
    }
  }

  /**
   * Update search suggestions
   * @private
   * @param {string} query - Search query
   */
  async updateSearchSuggestions(query) {
    if (!query || query.length < 2) {
      this.hideSuggestions();
      return;
    }
    
    try {
      const suggestions = await window.Database.getSearchSuggestions(query, 5);
      this.displaySuggestions(suggestions);
    } catch (error) {
      console.error('Failed to get suggestions:', error);
    }
  }

  /**
   * Get search suggestions for a given query
   * @public
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of suggestion strings
   */
  async getSuggestions(query) {
    if (!query || query.length < 2) {
      return [];
    }
    
    try {
      const suggestions = await window.Database.getSearchSuggestions(query, 5);
      return suggestions || [];
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }

  /**
   * Display search suggestions
   * @private
   * @param {Array} suggestions - Array of suggestion strings
   */
  displaySuggestions(suggestions) {
    const suggestionsContainer = document.getElementById('search-suggestions');
    
    if (!suggestionsContainer || suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }
    
    suggestionsContainer.innerHTML = '';
    
    suggestions.forEach(suggestion => {
      const item = document.createElement('button');
      item.className = 'suggestion-item';
      item.setAttribute('role', 'option');
      
      item.innerHTML = `
        <svg class="suggestion-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
        </svg>
        <span>${suggestion}</span>
      `;
      
      item.addEventListener('click', () => {
        this.selectSuggestion(suggestion);
      });
      
      suggestionsContainer.appendChild(item);
    });
    
    suggestionsContainer.style.display = 'block';
  }

  /**
   * Show search suggestions
   * @private
   */
  showSearchSuggestions() {
    if (this.currentQuery.length >= 2) {
      this.updateSearchSuggestions(this.currentQuery);
    }
  }

  /**
   * Hide search suggestions
   * @private
   */
  hideSuggestions() {
    const suggestionsContainer = document.getElementById('search-suggestions');
    if (suggestionsContainer) {
      suggestionsContainer.style.display = 'none';
    }
  }

  /**
   * Clear search and results
   */
  clearSearch() {
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('clear-search');
    
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    
    if (clearButton) {
      clearButton.style.display = 'none';
    }
    
    this.currentQuery = '';
    this.currentPage = 0;
    this.clearResults();
    this.hideSuggestions();
    
    // Clear URL parameters
    this.updateURL('');
  }

  /**
   * Clear search results
   * @private
   */
  clearResults() {
    const resultsContainer = document.getElementById('results-container');
    const searchStats = document.getElementById('search-stats');
    const noResults = document.getElementById('no-results');
    const loadMoreContainer = document.getElementById('load-more-container');
    
    if (resultsContainer) {
      resultsContainer.innerHTML = '';
    }
    
    if (searchStats) {
      searchStats.style.display = 'none';
    }
    
    if (noResults) {
      noResults.style.display = 'none';
    }
    
    if (loadMoreContainer) {
      loadMoreContainer.style.display = 'none';
    }
  }

  /**
   * Show loading state
   * @private
   * @param {boolean} isLoading - Whether to show loading state
   */
  showLoadingState(isLoading) {
    const searchInput = document.getElementById('search-input');
    const resultsSection = document.getElementById('results-section');
    
    if (searchInput) {
      searchInput.disabled = isLoading;
    }
    
    if (resultsSection) {
      resultsSection.style.opacity = isLoading ? '0.6' : '1';
    }
    
    // Update search input placeholder
    if (searchInput && isLoading) {
      const originalPlaceholder = searchInput.placeholder;
      searchInput.placeholder = window.LanguageManager?.t('search-in-progress') || 'Searching...';
      
      setTimeout(() => {
        if (!isLoading && searchInput) {
          searchInput.placeholder = originalPlaceholder;
        }
      }, 500);
    }
  }

  /**
   * Show error state
   * @private
   * @param {string} message - Error message
   */
  showErrorState(message) {
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: {
        type: 'error',
        title: 'Search Error',
        message: message,
        duration: 5000
      }
    }));
  }

  /**
   * Update URL with search parameters
   * @private
   * @param {string} query - Search query
   */
  updateURL(query) {
    if (!window.history || !window.history.pushState) return;
    
    const url = new URL(window.location);
    
    if (query) {
      url.searchParams.set('q', query);
      if (this.currentFilters.category !== 'all') {
        url.searchParams.set('category', this.currentFilters.category);
      }
      if (this.currentFilters.sort !== 'relevance') {
        url.searchParams.set('sort', this.currentFilters.sort);
      }
    } else {
      url.searchParams.delete('q');
      url.searchParams.delete('category');
      url.searchParams.delete('sort');
    }
    
    window.history.pushState(null, '', url);
  }

  /**
   * Initialize suggested searches
   * @private
   */
  initializeSuggestedSearches() {
    // Common search suggestions in multiple languages
    this.suggestions = [
      { hr: 'godišnji odmor', en: 'vacation days', es: 'días de vacaciones' },
      { hr: 'radno vrijeme', en: 'working hours', es: 'horario de trabajo' },
      { hr: 'otkaz', en: 'termination notice', es: 'aviso de terminación' },
      { hr: 'bolovanje', en: 'sick leave', es: 'baja por enfermedad' },
      { hr: 'plaća', en: 'salary', es: 'salario' },
      { hr: 'prekovremeni rad', en: 'overtime work', es: 'trabajo extra' },
      { hr: 'ugovor o radu', en: 'employment contract', es: 'contrato de trabajo' },
      { hr: 'prava radnika', en: 'worker rights', es: 'derechos del trabajador' }
    ];
  }

  /**
   * Add query to search history
   * @private
   * @param {string} query - Search query
   */
  addToSearchHistory(query) {
    if (!query.trim()) return;
    
    // Remove duplicate if exists
    this.searchHistory = this.searchHistory.filter(item => item !== query);
    
    // Add to beginning
    this.searchHistory.unshift(query);
    
    // Limit history size
    if (this.searchHistory.length > this.maxHistoryItems) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
    }
    
    // Save to localStorage
    try {
      localStorage.setItem('croatianLawSearchHistory', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.warn('Unable to save search history:', error);
    }
  }

  /**
   * Load search history from localStorage
   * @private
   */
  loadSearchHistory() {
    try {
      const saved = localStorage.getItem('croatianLawSearchHistory');
      if (saved) {
        this.searchHistory = JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Unable to load search history:', error);
      this.searchHistory = [];
    }
  }

  /**
   * Update search metrics
   * @private
   * @param {number} searchTime - Search execution time
   */
  updateMetrics(searchTime) {
    this.metrics.totalSearches++;
    this.metrics.averageSearchTime = 
      (this.metrics.averageSearchTime * (this.metrics.totalSearches - 1) + searchTime) / 
      this.metrics.totalSearches;
  }

  /**
   * Get search metrics
   * @returns {Object} Search metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get search history
   * @returns {Array} Search history
   */
  getSearchHistory() {
    return [...this.searchHistory];
  }
}

// Create global search engine instance
window.SearchEngine = new SearchEngine();

// Auto-initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  window.SearchEngine.initialize().catch(error => {
    console.error('Failed to initialize search engine:', error);
  });
});