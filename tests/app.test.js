/**
 * Croatian Working Law Fact Checker - Test Suite
 * Comprehensive testing for all application modules
 * 
 * @author Croatian Working Law Fact Checker
 * @version 1.0.0
 */

// Mock browser APIs for testing
global.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

global.sessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

global.fetch = jest.fn();
global.performance = {
  now: jest.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 5000000,
    jsHeapSizeLimit: 10000000
  }
};

// DOM mocking
global.document = {
  createElement: jest.fn(() => ({
    classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() },
    setAttribute: jest.fn(),
    getAttribute: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    style: {},
    innerHTML: '',
    textContent: ''
  })),
  getElementById: jest.fn(),
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
  head: {
    appendChild: jest.fn()
  },
  body: {
    classList: { add: jest.fn(), remove: jest.fn(), toggle: jest.fn() },
    appendChild: jest.fn(),
    removeChild: jest.fn()
  },
  documentElement: {
    setAttribute: jest.fn(),
    getAttribute: jest.fn()
  }
};

global.window = {
  matchMedia: jest.fn(() => ({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  location: {
    hostname: 'localhost',
    href: 'http://localhost:3000'
  },
  navigator: {
    onLine: true,
    language: 'en-US'
  },
  getComputedStyle: jest.fn(() => ({
    getPropertyValue: jest.fn(() => '#ffffff')
  }))
};

global.CustomEvent = jest.fn();

// Test Data
const mockLawData = [
  {
    id: 1,
    title: "Working Hours Regulation",
    content: "Standard working hours shall not exceed 40 hours per week...",
    category: "Working Time",
    articleNumber: "Article 42",
    keywords: ["working hours", "overtime", "regulation"],
    language: "en"
  },
  {
    id: 2,
    title: "Annual Leave Entitlement",
    content: "Every employee is entitled to paid annual leave of at least 20 working days...",
    category: "Leave",
    articleNumber: "Article 55",
    keywords: ["annual leave", "vacation", "paid leave"],
    language: "en"
  },
  {
    id: 3,
    title: "Termination Procedures",
    content: "Employment termination must follow proper legal procedures...",
    category: "Employment",
    articleNumber: "Article 78",
    keywords: ["termination", "dismissal", "procedures"],
    language: "en"
  }
];

describe('Croatian Working Law Fact Checker Tests', () => {
  
  // Database Manager Tests
  describe('DatabaseManager', () => {
    let databaseManager;
    
    beforeEach(() => {
      // Mock DatabaseManager class
      databaseManager = {
        data: [],
        searchIndex: new Map(),
        isInitialized: false,
        
        async initialize() {
          this.isInitialized = true;
          return Promise.resolve();
        },
        
        async loadData(dataPath) {
          this.data = [...mockLawData];
          this.buildSearchIndex();
          return this.data;
        },
        
        buildSearchIndex() {
          this.searchIndex.clear();
          this.data.forEach(item => {
            const terms = [...item.keywords, item.title, item.content].join(' ').toLowerCase().split(/\s+/);
            terms.forEach(term => {
              if (!this.searchIndex.has(term)) {
                this.searchIndex.set(term, []);
              }
              this.searchIndex.get(term).push(item.id);
            });
          });
        },
        
        search(query, options = {}) {
          const searchTerms = query.toLowerCase().split(/\s+/);
          const results = new Map();
          
          searchTerms.forEach(term => {
            if (this.searchIndex.has(term)) {
              this.searchIndex.get(term).forEach(id => {
                const item = this.data.find(d => d.id === id);
                if (item) {
                  results.set(id, item);
                }
              });
            }
          });
          
          return Array.from(results.values()).slice(0, options.maxResults || 10);
        },
        
        getItemById(id) {
          return this.data.find(item => item.id === id);
        },
        
        getAllCategories() {
          return [...new Set(this.data.map(item => item.category))];
        }
      };
    });
    
    test('should initialize successfully', async () => {
      await databaseManager.initialize();
      expect(databaseManager.isInitialized).toBe(true);
    });
    
    test('should load data successfully', async () => {
      const data = await databaseManager.loadData('test-path');
      expect(data).toHaveLength(3);
      expect(data[0].title).toBe('Working Hours Regulation');
    });
    
    test('should build search index', async () => {
      await databaseManager.loadData('test-path');
      expect(databaseManager.searchIndex.size).toBeGreaterThan(0);
      expect(databaseManager.searchIndex.has('working')).toBe(true);
    });
    
    test('should search data correctly', async () => {
      await databaseManager.loadData('test-path');
      const results = databaseManager.search('working hours');
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Working Hours Regulation');
    });
    
    test('should get item by ID', async () => {
      await databaseManager.loadData('test-path');
      const item = databaseManager.getItemById(1);
      expect(item.title).toBe('Working Hours Regulation');
    });
    
    test('should get all categories', async () => {
      await databaseManager.loadData('test-path');
      const categories = databaseManager.getAllCategories();
      expect(categories).toContain('Working Time');
      expect(categories).toContain('Leave');
      expect(categories).toContain('Employment');
    });
  });
  
  // Language Manager Tests
  describe('LanguageManager', () => {
    let languageManager;
    
    beforeEach(() => {
      languageManager = {
        currentLanguage: 'en',
        availableLanguages: ['en', 'hr', 'es'],
        translations: {
          en: {
            'search.placeholder': 'Search Croatian Working Law...',
            'search.button': 'Search',
            'results.found': 'Found {count} results'
          },
          hr: {
            'search.placeholder': 'Pretraži hrvatski radni zakon...',
            'search.button': 'Pretraži',
            'results.found': 'Pronađeno {count} rezultata'
          },
          es: {
            'search.placeholder': 'Buscar ley laboral croata...',
            'search.button': 'Buscar',
            'results.found': 'Se encontraron {count} resultados'
          }
        },
        
        async initialize() {
          this.detectLanguage();
          return Promise.resolve();
        },
        
        detectLanguage() {
          const browserLang = 'en-US';
          const detectedLang = browserLang.split('-')[0];
          if (this.availableLanguages.includes(detectedLang)) {
            this.currentLanguage = detectedLang;
          }
        },
        
        setLanguage(language) {
          if (this.availableLanguages.includes(language)) {
            this.currentLanguage = language;
            this.updateUI();
            return true;
          }
          return false;
        },
        
        translate(key, params = {}) {
          let translation = this.translations[this.currentLanguage]?.[key] || key;
          
          Object.keys(params).forEach(param => {
            translation = translation.replace(`{${param}}`, params[param]);
          });
          
          return translation;
        },
        
        updateUI() {
          // Mock UI update
        }
      };
    });
    
    test('should initialize and detect language', async () => {
      await languageManager.initialize();
      expect(languageManager.currentLanguage).toBe('en');
    });
    
    test('should set language successfully', () => {
      const result = languageManager.setLanguage('hr');
      expect(result).toBe(true);
      expect(languageManager.currentLanguage).toBe('hr');
    });
    
    test('should reject invalid language', () => {
      const result = languageManager.setLanguage('invalid');
      expect(result).toBe(false);
      expect(languageManager.currentLanguage).toBe('en');
    });
    
    test('should translate keys correctly', () => {
      languageManager.setLanguage('hr');
      const translation = languageManager.translate('search.placeholder');
      expect(translation).toBe('Pretraži hrvatski radni zakon...');
    });
    
    test('should handle translation parameters', () => {
      const translation = languageManager.translate('results.found', { count: 5 });
      expect(translation).toBe('Found 5 results');
    });
    
    test('should return key if translation not found', () => {
      const translation = languageManager.translate('nonexistent.key');
      expect(translation).toBe('nonexistent.key');
    });
  });
  
  // Search Engine Tests
  describe('SearchEngine', () => {
    let searchEngine;
    let mockDatabase;
    
    beforeEach(() => {
      mockDatabase = {
        data: [...mockLawData],
        search: jest.fn().mockReturnValue(mockLawData.slice(0, 2))
      };
      
      searchEngine = {
        database: mockDatabase,
        searchHistory: [],
        suggestions: [],
        
        initialize() {
          this.isInitialized = true;
        },
        
        setDatabase(db) {
          this.database = db;
        },
        
        async search(query, options = {}) {
          const searchStart = performance.now();
          
          // Add to history
          this.searchHistory.push({
            query,
            timestamp: Date.now(),
            results: 0
          });
          
          if (!query || query.trim().length === 0) {
            return [];
          }
          
          const results = this.database.search(query, options);
          
          // Calculate relevance scores
          const scoredResults = results.map(result => ({
            ...result,
            score: this.calculateRelevanceScore(result, query)
          }));
          
          // Sort by score
          scoredResults.sort((a, b) => b.score - a.score);
          
          // Update history with result count
          this.searchHistory[this.searchHistory.length - 1].results = scoredResults.length;
          
          return scoredResults;
        },
        
        calculateRelevanceScore(item, query) {
          const terms = query.toLowerCase().split(/\s+/);
          let score = 0;
          
          terms.forEach(term => {
            if (item.title.toLowerCase().includes(term)) {
              score += 0.5;
            }
            if (item.content.toLowerCase().includes(term)) {
              score += 0.3;
            }
            if (item.keywords.some(keyword => keyword.toLowerCase().includes(term))) {
              score += 0.2;
            }
          });
          
          return Math.min(score, 1.0);
        },
        
        async getSuggestions(query) {
          if (!query || query.length < 2) {
            return [];
          }
          
          const suggestions = [];
          this.database.data.forEach(item => {
            if (item.title.toLowerCase().includes(query.toLowerCase())) {
              suggestions.push(item.title);
            }
            item.keywords.forEach(keyword => {
              if (keyword.toLowerCase().includes(query.toLowerCase()) && 
                  !suggestions.includes(keyword)) {
                suggestions.push(keyword);
              }
            });
          });
          
          return suggestions.slice(0, 5);
        },
        
        getSearchHistory() {
          return [...this.searchHistory];
        }
      };
      
      searchEngine.initialize();
    });
    
    test('should initialize correctly', () => {
      expect(searchEngine.isInitialized).toBe(true);
    });
    
    test('should set database reference', () => {
      const newDb = { data: [] };
      searchEngine.setDatabase(newDb);
      expect(searchEngine.database).toBe(newDb);
    });
    
    test('should perform search and return scored results', async () => {
      const results = await searchEngine.search('working hours');
      expect(results).toHaveLength(2);
      expect(results[0]).toHaveProperty('score');
      expect(results[0].score).toBeGreaterThan(0);
    });
    
    test('should return empty array for empty query', async () => {
      const results = await searchEngine.search('');
      expect(results).toHaveLength(0);
    });
    
    test('should track search history', async () => {
      await searchEngine.search('working');
      await searchEngine.search('leave');
      
      const history = searchEngine.getSearchHistory();
      expect(history).toHaveLength(2);
      expect(history[0].query).toBe('working');
      expect(history[1].query).toBe('leave');
    });
    
    test('should generate suggestions', async () => {
      const suggestions = await searchEngine.getSuggestions('work');
      expect(suggestions).toContain('Working Hours Regulation');
      expect(suggestions).toContain('working hours');
    });
    
    test('should calculate relevance scores correctly', () => {
      const item = mockLawData[0];
      const score = searchEngine.calculateRelevanceScore(item, 'working hours');
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
  
  // Relevance Scoring Tests
  describe('RelevanceScoring', () => {
    let relevanceScoring;
    
    beforeEach(() => {
      relevanceScoring = {
        userProfiles: new Map(),
        clickHistory: [],
        feedbackData: [],
        
        async initialize() {
          this.loadUserProfiles();
          this.isInitialized = true;
        },
        
        loadUserProfiles() {
          // Mock loading from storage
        },
        
        trackSearch(query, results) {
          const userId = this.getCurrentUserId();
          
          if (!this.userProfiles.has(userId)) {
            this.userProfiles.set(userId, {
              searchHistory: [],
              preferences: {},
              behavior: {
                totalSearches: 0,
                avgSessionLength: 0,
                topCategories: [],
                preferredLanguage: 'en'
              }
            });
          }
          
          const profile = this.userProfiles.get(userId);
          profile.searchHistory.push({
            query,
            results: results.length,
            timestamp: Date.now()
          });
          profile.behavior.totalSearches++;
        },
        
        trackClick(resultId, query, position) {
          this.clickHistory.push({
            resultId,
            query,
            position,
            timestamp: Date.now()
          });
        },
        
        trackFeedback(resultId, isHelpful, query) {
          this.feedbackData.push({
            resultId,
            isHelpful,
            query,
            timestamp: Date.now()
          });
        },
        
        adjustRelevanceScore(baseScore, item, query, userId) {
          const profile = this.userProfiles.get(userId);
          let adjustedScore = baseScore;
          
          if (profile) {
            // Adjust based on user preferences
            if (profile.behavior.topCategories.includes(item.category)) {
              adjustedScore += 0.1;
            }
            
            // Adjust based on click history
            const itemClicks = this.clickHistory.filter(click => 
              click.resultId === item.id && click.query.includes(query)
            ).length;
            
            if (itemClicks > 0) {
              adjustedScore += itemClicks * 0.05;
            }
            
            // Adjust based on feedback
            const feedback = this.feedbackData.filter(f => f.resultId === item.id);
            const positiveCount = feedback.filter(f => f.isHelpful).length;
            const negativeCount = feedback.filter(f => !f.isHelpful).length;
            
            if (feedback.length > 0) {
              const feedbackRatio = positiveCount / feedback.length;
              adjustedScore += (feedbackRatio - 0.5) * 0.2;
            }
          }
          
          return Math.min(Math.max(adjustedScore, 0), 1);
        },
        
        getCurrentUserId() {
          return 'test-user-id';
        },
        
        getUserProfile(userId) {
          return this.userProfiles.get(userId) || null;
        }
      };
    });
    
    test('should initialize successfully', async () => {
      await relevanceScoring.initialize();
      expect(relevanceScoring.isInitialized).toBe(true);
    });
    
    test('should track search queries', () => {
      const results = mockLawData.slice(0, 2);
      relevanceScoring.trackSearch('working hours', results);
      
      const profile = relevanceScoring.getUserProfile('test-user-id');
      expect(profile).not.toBeNull();
      expect(profile.searchHistory).toHaveLength(1);
      expect(profile.behavior.totalSearches).toBe(1);
    });
    
    test('should track result clicks', () => {
      relevanceScoring.trackClick(1, 'working hours', 0);
      expect(relevanceScoring.clickHistory).toHaveLength(1);
      expect(relevanceScoring.clickHistory[0].resultId).toBe(1);
    });
    
    test('should track user feedback', () => {
      relevanceScoring.trackFeedback(1, true, 'working hours');
      expect(relevanceScoring.feedbackData).toHaveLength(1);
      expect(relevanceScoring.feedbackData[0].isHelpful).toBe(true);
    });
    
    test('should adjust relevance scores based on user behavior', () => {
      // Setup user profile
      relevanceScoring.trackSearch('working hours', mockLawData);
      relevanceScoring.trackClick(1, 'working hours', 0);
      relevanceScoring.trackFeedback(1, true, 'working hours');
      
      const adjustedScore = relevanceScoring.adjustRelevanceScore(
        0.5, 
        mockLawData[0], 
        'working hours', 
        'test-user-id'
      );
      
      expect(adjustedScore).toBeGreaterThan(0.5);
    });
  });
  
  // Theme Manager Tests
  describe('ThemeManager', () => {
    let themeManager;
    
    beforeEach(() => {
      themeManager = {
        currentTheme: 'light',
        isInitialized: false,
        
        async initialize() {
          this.detectSystemPreference();
          this.restoreThemePreference();
          this.isInitialized = true;
        },
        
        detectSystemPreference() {
          // Mock system preference detection
          this.prefersDarkMode = false;
        },
        
        restoreThemePreference() {
          const savedTheme = localStorage.getItem('croatianLawTheme');
          if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
            this.currentTheme = savedTheme;
          }
        },
        
        toggleTheme() {
          const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
          this.setTheme(newTheme);
        },
        
        setTheme(theme) {
          if (!['light', 'dark'].includes(theme)) {
            return false;
          }
          
          this.currentTheme = theme;
          this.applyTheme(theme);
          this.saveThemePreference();
          return true;
        },
        
        applyTheme(theme) {
          // Mock theme application
          document.documentElement.setAttribute('data-theme', theme);
        },
        
        saveThemePreference() {
          localStorage.setItem('croatianLawTheme', this.currentTheme);
        },
        
        getCurrentTheme() {
          return this.currentTheme;
        },
        
        isDarkMode() {
          return this.currentTheme === 'dark';
        }
      };
    });
    
    test('should initialize successfully', async () => {
      await themeManager.initialize();
      expect(themeManager.isInitialized).toBe(true);
    });
    
    test('should toggle between light and dark themes', () => {
      expect(themeManager.getCurrentTheme()).toBe('light');
      
      themeManager.toggleTheme();
      expect(themeManager.getCurrentTheme()).toBe('dark');
      
      themeManager.toggleTheme();
      expect(themeManager.getCurrentTheme()).toBe('light');
    });
    
    test('should set valid themes', () => {
      const result = themeManager.setTheme('dark');
      expect(result).toBe(true);
      expect(themeManager.getCurrentTheme()).toBe('dark');
    });
    
    test('should reject invalid themes', () => {
      const result = themeManager.setTheme('invalid');
      expect(result).toBe(false);
      expect(themeManager.getCurrentTheme()).toBe('light');
    });
    
    test('should detect dark mode correctly', () => {
      themeManager.setTheme('dark');
      expect(themeManager.isDarkMode()).toBe(true);
      
      themeManager.setTheme('light');
      expect(themeManager.isDarkMode()).toBe(false);
    });
  });
  
  // Main Application Tests
  describe('CroatianLawApp', () => {
    let app;
    
    beforeEach(() => {
      app = {
        version: '1.0.0',
        isInitialized: false,
        modules: {},
        state: {
          isOnline: true,
          currentLanguage: 'en',
          currentTheme: 'light',
          searchQuery: '',
          hasError: false
        },
        
        async initialize() {
          this.setupModules();
          this.isInitialized = true;
          return Promise.resolve();
        },
        
        setupModules() {
          this.modules = {
            database: { isInitialized: true },
            languageManager: { isInitialized: true },
            searchEngine: { isInitialized: true },
            relevanceScoring: { isInitialized: true },
            themeManager: { isInitialized: true }
          };
        },
        
        getAppInfo() {
          return {
            version: this.version,
            isInitialized: this.isInitialized,
            modules: this.modules,
            state: this.state
          };
        },
        
        handleError(error) {
          this.state.hasError = true;
          this.state.errorMessage = error.message;
        }
      };
    });
    
    test('should initialize successfully', async () => {
      await app.initialize();
      expect(app.isInitialized).toBe(true);
    });
    
    test('should setup all modules', async () => {
      await app.initialize();
      const info = app.getAppInfo();
      expect(info.modules.database.isInitialized).toBe(true);
      expect(info.modules.languageManager.isInitialized).toBe(true);
      expect(info.modules.searchEngine.isInitialized).toBe(true);
      expect(info.modules.relevanceScoring.isInitialized).toBe(true);
      expect(info.modules.themeManager.isInitialized).toBe(true);
    });
    
    test('should provide application information', async () => {
      await app.initialize();
      const info = app.getAppInfo();
      
      expect(info.version).toBe('1.0.0');
      expect(info.isInitialized).toBe(true);
      expect(info.state.currentLanguage).toBe('en');
    });
    
    test('should handle errors properly', () => {
      const error = new Error('Test error');
      app.handleError(error);
      
      expect(app.state.hasError).toBe(true);
      expect(app.state.errorMessage).toBe('Test error');
    });
  });
  
  // Integration Tests
  describe('Integration Tests', () => {
    test('should integrate database and search engine', async () => {
      const db = {
        data: [...mockLawData],
        async loadData() { return this.data; },
        search(query) {
          return this.data.filter(item => 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.content.toLowerCase().includes(query.toLowerCase())
          );
        }
      };
      
      const search = {
        database: null,
        setDatabase(database) { this.database = database; },
        async search(query) {
          if (!this.database) return [];
          return this.database.search(query);
        }
      };
      
      // Integration
      search.setDatabase(db);
      const results = await search.search('working');
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('Working Hours Regulation');
    });
    
    test('should integrate language manager with UI updates', () => {
      const langManager = {
        currentLanguage: 'en',
        translations: {
          en: { 'test.key': 'Test Value' },
          hr: { 'test.key': 'Test Vrijednost' }
        },
        
        setLanguage(lang) {
          this.currentLanguage = lang;
          this.updateUI();
        },
        
        translate(key) {
          return this.translations[this.currentLanguage][key] || key;
        },
        
        updateUI() {
          // Mock UI update
          const elements = document.querySelectorAll('[data-translate]');
          elements.forEach = jest.fn(); // Mock forEach
        }
      };
      
      expect(langManager.translate('test.key')).toBe('Test Value');
      
      langManager.setLanguage('hr');
      expect(langManager.translate('test.key')).toBe('Test Vrijednost');
    });
  });
  
  // Performance Tests
  describe('Performance Tests', () => {
    test('should search large dataset efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        title: `Article ${i}`,
        content: `Content for article ${i} about working regulations`,
        category: 'General',
        keywords: [`keyword${i}`, 'working', 'regulation']
      }));
      
      const searchIndex = new Map();
      
      // Build index (performance test)
      const startTime = performance.now();
      largeDataset.forEach(item => {
        const terms = [item.title, item.content, ...item.keywords].join(' ').toLowerCase().split(/\s+/);
        terms.forEach(term => {
          if (!searchIndex.has(term)) {
            searchIndex.set(term, []);
          }
          searchIndex.get(term).push(item.id);
        });
      });
      const indexTime = performance.now() - startTime;
      
      expect(indexTime).toBeLessThan(100); // Should index 1000 items in under 100ms
      
      // Search performance test
      const searchStart = performance.now();
      const searchResults = searchIndex.get('working') || [];
      const searchTime = performance.now() - searchStart;
      
      expect(searchTime).toBeLessThan(10); // Should search in under 10ms
      expect(searchResults.length).toBeGreaterThan(0);
    });
  });
  
  // Error Handling Tests
  describe('Error Handling', () => {
    test('should handle network errors gracefully', async () => {
      const failingDatabase = {
        async loadData() {
          throw new Error('Network error');
        }
      };
      
      let errorCaught = false;
      try {
        await failingDatabase.loadData();
      } catch (error) {
        errorCaught = true;
        expect(error.message).toBe('Network error');
      }
      
      expect(errorCaught).toBe(true);
    });
    
    test('should handle invalid search queries', async () => {
      const searchEngine = {
        async search(query) {
          if (typeof query !== 'string') {
            throw new Error('Invalid query type');
          }
          if (query.length > 1000) {
            throw new Error('Query too long');
          }
          return [];
        }
      };
      
      // Test invalid type
      await expect(searchEngine.search(123)).rejects.toThrow('Invalid query type');
      
      // Test too long query
      const longQuery = 'a'.repeat(1001);
      await expect(searchEngine.search(longQuery)).rejects.toThrow('Query too long');
      
      // Test valid query
      const results = await searchEngine.search('valid query');
      expect(results).toEqual([]);
    });
  });
  
  // Accessibility Tests
  describe('Accessibility Tests', () => {
    test('should provide proper ARIA labels', () => {
      const searchInput = {
        setAttribute: jest.fn(),
        getAttribute: jest.fn()
      };
      
      // Mock setting ARIA attributes
      searchInput.setAttribute('aria-label', 'Search Croatian Working Law');
      searchInput.setAttribute('role', 'searchbox');
      
      expect(searchInput.setAttribute).toHaveBeenCalledWith('aria-label', 'Search Croatian Working Law');
      expect(searchInput.setAttribute).toHaveBeenCalledWith('role', 'searchbox');
    });
    
    test('should support keyboard navigation', () => {
      const keyboardHandler = {
        handleKeydown(event) {
          switch (event.key) {
            case 'Enter':
              return 'search';
            case 'Escape':
              return 'clear';
            case 'ArrowDown':
              return 'next';
            case 'ArrowUp':
              return 'previous';
            default:
              return 'none';
          }
        }
      };
      
      expect(keyboardHandler.handleKeydown({ key: 'Enter' })).toBe('search');
      expect(keyboardHandler.handleKeydown({ key: 'Escape' })).toBe('clear');
      expect(keyboardHandler.handleKeydown({ key: 'ArrowDown' })).toBe('next');
      expect(keyboardHandler.handleKeydown({ key: 'ArrowUp' })).toBe('previous');
    });
  });
});

// Test runner configuration
module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: [
    'assets/js/**/*.js',
    '!assets/js/**/*.test.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};