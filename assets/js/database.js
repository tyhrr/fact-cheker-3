/**
 * Database Management for Croatian Working Law Fact Checker
 * Handles data loading, caching, and access patterns
 * 
 * @author Croatian Working Law Fact Checker
 * @version 1.0.0
 */

class DatabaseManager {
  constructor() {
    this.data = null;
    this.isLoaded = false;
    this.loadPromise = null;
    this.cache = new Map();
    this.searchCache = new Map();
    
    // Database metadata
    this.metadata = {
      version: null,
      totalArticles: 0,
      lastUpdated: null,
      categories: {}
    };
    
    // Performance metrics
    this.metrics = {
      loadTime: 0,
      searchCount: 0,
      cacheHits: 0,
      averageSearchTime: 0
    };
  }

  /**
   * Initialize the database - load JSON data
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this._loadDatabase();
    return this.loadPromise;
  }

  /**
   * Internal method to load database from JSON file
   * @private
   * @returns {Promise<void>}
   */
  async _loadDatabase() {
    const startTime = performance.now();
    
    try {
      console.log('📊 Loading Croatian labor law database...');
      
      // Show loading indicator
      this._showLoadingIndicator(true);
      
      // Load JSON data
      const response = await fetch('assets/data/croatian-working-law.json');
      
      if (!response.ok) {
        throw new Error(`Failed to load database: ${response.status} ${response.statusText}`);
      }
      
      const rawData = await response.json();
      
      // Transform array to expected format
      if (Array.isArray(rawData)) {
        // Extract categories from articles
        const categories = {};
        rawData.forEach(article => {
          if (article.category) {
            categories[article.category] = (categories[article.category] || 0) + 1;
          }
        });
        
        this.data = {
          articles: rawData,
          searchIndex: {},
          metadata: {
            version: '1.0.0',
            language: 'hr',
            totalArticles: rawData.length,
            categories: categories,
            lastUpdated: new Date().toISOString()
          }
        };
      } else {
        this.data = rawData;
      }
      
      // Validate data structure
      this._validateData();
      
      // Store metadata
      this.metadata = {
        ...(this.data.metadata || {}),
        loadTime: performance.now() - startTime
      };
      
      // Initialize search index for faster lookups
      this._initializeSearchIndex();
      
      this.isLoaded = true;
      this.metrics.loadTime = performance.now() - startTime;
      
      console.log(`✅ Database loaded successfully in ${Math.round(this.metrics.loadTime)}ms`);
      console.log(`📊 Loaded ${this.metadata.totalArticles} articles across ${Object.keys(this.metadata.categories || {}).length} categories`);
      
      // Hide loading indicator
      this._showLoadingIndicator(false);
      
      // Dispatch custom event for application initialization
      window.dispatchEvent(new CustomEvent('databaseLoaded', {
        detail: { metadata: this.metadata }
      }));
      
    } catch (error) {
      console.error('❌ Error loading database:', error);
      this._showLoadingIndicator(false);
      this._showErrorMessage('Failed to load database. Please refresh the page and try again.');
      throw error;
    }
  }

  /**
   * Validate the loaded data structure
   * @private
   */
  _validateData() {
    if (!this.data) {
      throw new Error('Database data is null');
    }
    
    if (!this.data.articles || !Array.isArray(this.data.articles)) {
      throw new Error('Articles array is missing or invalid');
    }
    
    if (!this.data.searchIndex || typeof this.data.searchIndex !== 'object') {
      throw new Error('Search index is missing or invalid');
    }
    
    if (!this.data.metadata || typeof this.data.metadata !== 'object') {
      throw new Error('Metadata is missing or invalid');
    }
    
    // Validate article structure
    this.data.articles.forEach((article, index) => {
      if (!article.id || !article.title || !article.content) {
        throw new Error(`Article ${index + 1} is missing required fields`);
      }
    });
    
    console.log('✅ Database structure validation passed');
  }

  /**
   * Initialize search index for performance optimization
   * @private
   */
  _initializeSearchIndex() {
    console.log('🗂️ Initializing search index...');
    
    // Create article lookup map
    this.articleMap = new Map();
    this.data.articles.forEach(article => {
      this.articleMap.set(article.id, article);
    });
    
    // Create category index
    this.categoryIndex = new Map();
    this.data.articles.forEach(article => {
      if (!this.categoryIndex.has(article.category)) {
        this.categoryIndex.set(article.category, []);
      }
      this.categoryIndex.get(article.category).push(article);
    });
    
    // Create keyword index for autocomplete
    this.keywordIndex = new Set();
    this.data.articles.forEach(article => {
      if (article.keywords && Array.isArray(article.keywords)) {
        article.keywords.forEach(keyword => {
          this.keywordIndex.add(keyword.toLowerCase());
        });
      }
    });
    
    console.log(`✅ Search index initialized: ${this.articleMap.size} articles, ${this.categoryIndex.size} categories, ${this.keywordIndex.size} keywords`);
  }

  /**
   * Get all articles
   * @returns {Promise<Array>} All articles
   */
  async getAllArticles() {
    await this.initialize();
    return [...this.data.articles];
  }

  /**
   * Get article by ID
   * @param {string} articleId - Article ID
   * @returns {Promise<Object|null>} Article object or null if not found
   */
  async getArticleById(articleId) {
    await this.initialize();
    return this.articleMap.get(articleId) || null;
  }

  /**
   * Get articles by category
   * @param {string} category - Category name
   * @returns {Promise<Array>} Articles in the category
   */
  async getArticlesByCategory(category) {
    await this.initialize();
    
    const cacheKey = `category_${category}`;
    
    if (this.cache.has(cacheKey)) {
      this.metrics.cacheHits++;
      return this.cache.get(cacheKey);
    }
    
    const articles = this.categoryIndex.get(category) || [];
    this.cache.set(cacheKey, [...articles]);
    
    return [...articles];
  }

  /**
   * Search articles with multiple criteria
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.query - Search query
   * @param {string} searchParams.category - Category filter
   * @param {string} searchParams.language - Language for results
   * @param {number} searchParams.limit - Maximum results
   * @param {number} searchParams.offset - Result offset for pagination
   * @returns {Promise<Object>} Search results with metadata
   */
  async searchArticles({ query = '', category = 'all', language = 'hr', limit = 10, offset = 0 }) {
    const startTime = performance.now();
    await this.initialize();
    
    // Create cache key
    const cacheKey = `search_${query}_${category}_${language}_${limit}_${offset}`;
    
    if (this.searchCache.has(cacheKey)) {
      this.metrics.cacheHits++;
      return this.searchCache.get(cacheKey);
    }
    
    let results = [];
    
    // Start with all articles or filter by category
    let articles = category === 'all' 
      ? this.data.articles 
      : await this.getArticlesByCategory(category);
    
    // If no query, return articles sorted by relevance score
    if (!query.trim()) {
      results = articles
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(offset, offset + limit);
    } else {
      // Perform text search
      results = this._performTextSearch(articles, query, language);
      results = results.slice(offset, offset + limit);
    }
    
    // Prepare search result object
    const searchResult = {
      query,
      results,
      total: results.length,
      offset,
      limit,
      hasMore: offset + limit < results.length,
      searchTime: performance.now() - startTime,
      language,
      category
    };
    
    // Cache the result
    this.searchCache.set(cacheKey, searchResult);
    
    // Update metrics
    this.metrics.searchCount++;
    this.metrics.averageSearchTime = 
      (this.metrics.averageSearchTime * (this.metrics.searchCount - 1) + searchResult.searchTime) / 
      this.metrics.searchCount;
    
    return searchResult;
  }

  /**
   * Perform text search with relevance scoring
   * @private
   * @param {Array} articles - Articles to search
   * @param {string} query - Search query
   * @param {string} language - Language for scoring
   * @returns {Array} Sorted search results
   */
  _performTextSearch(articles, query, language) {
    const queryWords = query.toLowerCase().trim().split(/\s+/);
    const results = [];
    
    articles.forEach(article => {
      const score = this._calculateRelevanceScore(article, queryWords, language);
      
      if (score > 0) {
        results.push({
          ...article,
          searchScore: score,
          highlightedContent: this._highlightMatches(article.content, queryWords),
          highlightedTitle: this._highlightMatches(article.title, queryWords)
        });
      }
    });
    
    // Sort by combined relevance score (search score + user feedback + base score)
    return results.sort((a, b) => {
      const scoreA = a.searchScore * 0.7 + a.relevanceScore * 0.3;
      const scoreB = b.searchScore * 0.7 + b.relevanceScore * 0.3;
      return scoreB - scoreA;
    });
  }

  /**
   * Calculate relevance score for article against query
   * @private
   * @param {Object} article - Article to score
   * @param {Array} queryWords - Query words array
   * @param {string} language - Language for scoring
   * @returns {number} Relevance score
   */
  _calculateRelevanceScore(article, queryWords, language) {
    let score = 0;
    
    const titleText = article.title.toLowerCase();
    const contentText = article.content.toLowerCase();
    const keywordText = (article.keywords || []).join(' ').toLowerCase();
    
    queryWords.forEach(word => {
      // Title matches (highest weight)
      const titleMatches = (titleText.match(new RegExp(word, 'g')) || []).length;
      score += titleMatches * 10;
      
      // Keyword matches (medium weight)
      const keywordMatches = (keywordText.match(new RegExp(word, 'g')) || []).length;
      score += keywordMatches * 5;
      
      // Content matches (lower weight, but still important)
      const contentMatches = (contentText.match(new RegExp(word, 'g')) || []).length;
      score += contentMatches * 1;
      
      // Exact phrase bonus
      if (queryWords.length > 1) {
        const phrase = queryWords.join(' ');
        if (titleText.includes(phrase)) score += 20;
        if (contentText.includes(phrase)) score += 10;
      }
      
      // Check translation keywords if available
      if (this.data.translations) {
        Object.keys(this.data.translations).forEach(category => {
          const translations = this.data.translations[category][language] || [];
          if (translations.some(translation => translation.includes(word))) {
            score += 3;
          }
        });
      }
    });
    
    return score;
  }

  /**
   * Highlight matching terms in text
   * @private
   * @param {string} text - Text to highlight
   * @param {Array} queryWords - Words to highlight
   * @returns {string} Text with highlighted matches
   */
  _highlightMatches(text, queryWords) {
    let highlighted = text;
    
    queryWords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlighted = highlighted.replace(regex, '<span class="highlight">$1</span>');
    });
    
    return highlighted;
  }

  /**
   * Get search suggestions based on partial query
   * @param {string} partialQuery - Partial search query
   * @param {number} limit - Maximum suggestions to return
   * @returns {Promise<Array>} Search suggestions
   */
  async getSearchSuggestions(partialQuery, limit = 5) {
    await this.initialize();
    
    if (!partialQuery || partialQuery.length < 2) {
      return [];
    }
    
    const query = partialQuery.toLowerCase();
    const suggestions = new Set();
    
    // Search in keywords
    this.keywordIndex.forEach(keyword => {
      if (keyword.includes(query) && suggestions.size < limit) {
        suggestions.add(keyword);
      }
    });
    
    // Search in article titles
    this.data.articles.forEach(article => {
      if (suggestions.size >= limit) return;
      
      const title = article.title.toLowerCase();
      if (title.includes(query)) {
        suggestions.add(article.title);
      }
    });
    
    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Update article relevance score based on user feedback
   * @param {string} articleId - Article ID
   * @param {boolean} isHelpful - Whether user found it helpful
   * @returns {Promise<void>}
   */
  async updateRelevanceScore(articleId, isHelpful) {
    await this.initialize();
    
    const article = this.articleMap.get(articleId);
    if (!article) return;
    
    // Update feedback counters
    if (isHelpful) {
      article.userFeedback.helpful++;
    } else {
      article.userFeedback.notHelpful++;
    }
    
    // Calculate new relevance score
    const totalFeedback = article.userFeedback.helpful + article.userFeedback.notHelpful;
    if (totalFeedback > 0) {
      const helpfulRatio = article.userFeedback.helpful / totalFeedback;
      article.relevanceScore = 1.0 + (helpfulRatio * 2 - 1); // Range: 0.0 to 3.0
    }
    
    // Store in localStorage for persistence
    this._storeUserFeedback(articleId, article.userFeedback);
    
    // Clear relevant caches
    this.searchCache.clear();
  }

  /**
   * Store user feedback in localStorage
   * @private
   * @param {string} articleId - Article ID
   * @param {Object} feedback - Feedback object
   */
  _storeUserFeedback(articleId, feedback) {
    try {
      const stored = JSON.parse(localStorage.getItem('croatianLawFeedback') || '{}');
      stored[articleId] = feedback;
      localStorage.setItem('croatianLawFeedback', JSON.stringify(stored));
    } catch (error) {
      console.warn('Unable to store user feedback:', error);
    }
  }

  /**
   * Load user feedback from localStorage
   * @private
   */
  _loadUserFeedback() {
    try {
      const stored = JSON.parse(localStorage.getItem('croatianLawFeedback') || '{}');
      
      Object.keys(stored).forEach(articleId => {
        const article = this.articleMap.get(articleId);
        if (article) {
          article.userFeedback = stored[articleId];
          
          // Recalculate relevance score
          const totalFeedback = article.userFeedback.helpful + article.userFeedback.notHelpful;
          if (totalFeedback > 0) {
            const helpfulRatio = article.userFeedback.helpful / totalFeedback;
            article.relevanceScore = 1.0 + (helpfulRatio * 2 - 1);
          }
        }
      });
    } catch (error) {
      console.warn('Unable to load user feedback:', error);
    }
  }

  /**
   * Get database metadata
   * @returns {Promise<Object>} Database metadata
   */
  async getMetadata() {
    await this.initialize();
    return { ...this.metadata };
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
    this.searchCache.clear();
    console.log('🧹 Database cache cleared');
  }

  /**
   * Show/hide loading indicator
   * @private
   * @param {boolean} show - Whether to show loading indicator
   */
  _showLoadingIndicator(show) {
    const loadingElement = document.getElementById('loading-overlay');
    if (loadingElement) {
      loadingElement.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * Show error message to user
   * @private
   * @param {string} message - Error message
   */
  _showErrorMessage(message) {
    // This will be handled by the toast system in main.js
    window.dispatchEvent(new CustomEvent('showToast', {
      detail: {
        type: 'error',
        title: 'Database Error',
        message: message
      }
    }));
  }
}

// Create global database instance
window.Database = new DatabaseManager();

// Auto-initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  window.Database.initialize().catch(error => {
    console.error('Failed to initialize database:', error);
  });
});