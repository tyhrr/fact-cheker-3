/**
 * Relevance Scoring and Machine Learning System
 * Implements user feedback collection and intelligent relevance scoring
 * 
 * @author Croatian Working Law Fact Checker
 * @version 1.0.0
 */

class RelevanceScoring {
  constructor() {
    this.isInitialized = false;
    this.userProfiles = new Map();
    this.currentUserId = null;
    this.sessionData = {
      searches: [],
      feedback: [],
      preferences: {}
    };
    
    // Learning parameters
    this.learningRate = 0.1;
    this.decayFactor = 0.95;
    this.minFeedbackThreshold = 3;
    
    // User behavior tracking
    this.behaviorMetrics = {
      searchPatterns: new Map(),
      categoryPreferences: new Map(),
      timeSpentOnResults: new Map(),
      feedbackFrequency: 0
    };
    
    // Adaptive scoring weights
    this.scoringWeights = {
      userFeedback: 0.4,
      globalRelevance: 0.3,
      personalizedScore: 0.2,
      recencyBoost: 0.1
    };
  }

  /**
   * Initialize relevance scoring system
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      console.log('🧠 Initializing relevance scoring system...');
      
      // Generate or restore user ID
      this.initializeUserId();
      
      // Load user data
      await this.loadUserData();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize behavior tracking
      this.initializeBehaviorTracking();
      
      // Start session tracking
      this.startSession();
      
      this.isInitialized = true;
      console.log('✅ Relevance scoring system initialized');
      
    } catch (error) {
      console.error('❌ Failed to initialize relevance scoring:', error);
      throw error;
    }
  }

  /**
   * Initialize unique user ID
   * @private
   */
  initializeUserId() {
    try {
      let userId = localStorage.getItem('croatianLawUserId');
      
      if (!userId) {
        // Generate unique ID
        userId = this.generateUserId();
        localStorage.setItem('croatianLawUserId', userId);
      }
      
      this.currentUserId = userId;
      console.log(`👤 User ID: ${userId.substring(0, 8)}...`);
      
    } catch (error) {
      console.warn('Unable to initialize user ID:', error);
      this.currentUserId = this.generateUserId();
    }
  }

  /**
   * Generate unique user ID
   * @private
   * @returns {string} Unique user ID
   */
  generateUserId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Load user data from localStorage
   * @private
   * @returns {Promise<void>}
   */
  async loadUserData() {
    try {
      // Load user profile
      const profileData = localStorage.getItem(`croatianLawProfile_${this.currentUserId}`);
      if (profileData) {
        const profile = JSON.parse(profileData);
        this.userProfiles.set(this.currentUserId, profile);
      }
      
      // Load behavior metrics
      const behaviorData = localStorage.getItem(`croatianLawBehavior_${this.currentUserId}`);
      if (behaviorData) {
        const behavior = JSON.parse(behaviorData);
        this.behaviorMetrics = { ...this.behaviorMetrics, ...behavior };
      }
      
      // Load session preferences
      const preferencesData = localStorage.getItem('croatianLawPreferences');
      if (preferencesData) {
        this.sessionData.preferences = JSON.parse(preferencesData);
      }
      
      console.log('📊 User data loaded successfully');
      
    } catch (error) {
      console.warn('Unable to load user data:', error);
    }
  }

  /**
   * Save user data to localStorage
   * @private
   */
  saveUserData() {
    try {
      // Save user profile
      const profile = this.userProfiles.get(this.currentUserId);
      if (profile) {
        localStorage.setItem(`croatianLawProfile_${this.currentUserId}`, JSON.stringify(profile));
      }
      
      // Save behavior metrics
      localStorage.setItem(`croatianLawBehavior_${this.currentUserId}`, JSON.stringify(this.behaviorMetrics));
      
      // Save session preferences
      localStorage.setItem('croatianLawPreferences', JSON.stringify(this.sessionData.preferences));
      
    } catch (error) {
      console.warn('Unable to save user data:', error);
    }
  }

  /**
   * Setup event listeners for user interactions
   * @private
   */
  setupEventListeners() {
    // Track search queries
    document.addEventListener('searchPerformed', (e) => {
      this.trackSearch(e.detail);
    });
    
    // Track result clicks and interactions
    document.addEventListener('click', (e) => {
      if (e.target.closest('.result-card')) {
        this.trackResultInteraction(e);
      }
    });
    
    // Track time spent on results
    document.addEventListener('visibilitychange', () => {
      this.trackTimeSpent();
    });
    
    // Track feedback submissions
    document.addEventListener('feedbackSubmitted', (e) => {
      this.processFeedback(e.detail);
    });
    
    // Save data before page unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
      this.saveUserData();
    });
    
    // Periodic save
    setInterval(() => {
      this.saveUserData();
    }, 30000); // Save every 30 seconds
  }

  /**
   * Initialize behavior tracking
   * @private
   */
  initializeBehaviorTracking() {
    this.sessionStartTime = Date.now();
    this.currentResultStartTime = null;
    this.currentSearchContext = null;
  }

  /**
   * Start new session
   * @private
   */
  startSession() {
    this.sessionData = {
      searches: [],
      feedback: [],
      preferences: this.sessionData.preferences || {},
      startTime: Date.now(),
      endTime: null
    };
  }

  /**
   * End current session
   * @private
   */
  endSession() {
    this.sessionData.endTime = Date.now();
    this.analyzeSession();
  }

  /**
   * Track search query and context
   * @param {Object} searchData - Search data
   */
  trackSearch(searchData) {
    const searchEvent = {
      query: searchData.query,
      category: searchData.category,
      language: searchData.language,
      timestamp: Date.now(),
      resultsCount: searchData.resultsCount,
      searchTime: searchData.searchTime
    };
    
    // Add to session data
    this.sessionData.searches.push(searchEvent);
    
    // Update search patterns
    this.updateSearchPatterns(searchData.query);
    
    // Update category preferences
    this.updateCategoryPreferences(searchData.category);
    
    // Store current search context
    this.currentSearchContext = searchEvent;
    
    console.log(`🔍 Tracked search: "${searchData.query}" in ${searchData.category}`);
  }

  /**
   * Update search patterns analysis
   * @private
   * @param {string} query - Search query
   */
  updateSearchPatterns(query) {
    const patterns = this.behaviorMetrics.searchPatterns;
    
    // Track query length preferences
    const length = query.length;
    const lengthCategory = length < 10 ? 'short' : length < 30 ? 'medium' : 'long';
    patterns.set(`length_${lengthCategory}`, (patterns.get(`length_${lengthCategory}`) || 0) + 1);
    
    // Track language patterns (detected automatically)
    if (window.LanguageManager) {
      const detectedLang = window.LanguageManager.detectLanguage(query);
      patterns.set(`lang_${detectedLang}`, (patterns.get(`lang_${detectedLang}`) || 0) + 1);
    }
    
    // Track keyword frequency
    const keywords = query.toLowerCase().split(/\s+/);
    keywords.forEach(keyword => {
      if (keyword.length > 2) {
        patterns.set(`keyword_${keyword}`, (patterns.get(`keyword_${keyword}`) || 0) + 1);
      }
    });
  }

  /**
   * Update category preferences
   * @private
   * @param {string} category - Search category
   */
  updateCategoryPreferences(category) {
    const preferences = this.behaviorMetrics.categoryPreferences;
    preferences.set(category, (preferences.get(category) || 0) + 1);
  }

  /**
   * Track result interaction
   * @param {Event} e - Click event
   */
  trackResultInteraction(e) {
    const card = e.target.closest('.result-card');
    if (!card) return;
    
    const articleId = card.getAttribute('data-article-id');
    if (!articleId) return;
    
    const interactionData = {
      articleId,
      searchContext: this.currentSearchContext,
      timestamp: Date.now(),
      interactionType: this.getInteractionType(e.target),
      elementClicked: e.target.tagName.toLowerCase()
    };
    
    // Track time to interaction
    if (this.currentSearchContext) {
      interactionData.timeToInteraction = Date.now() - this.currentSearchContext.timestamp;
    }
    
    // Store interaction
    this.sessionData.interactions = this.sessionData.interactions || [];
    this.sessionData.interactions.push(interactionData);
    
    // Start timing for this result
    this.currentResultStartTime = Date.now();
    
    console.log(`👆 Tracked interaction with article: ${articleId}`);
  }

  /**
   * Determine interaction type
   * @private
   * @param {Element} element - Clicked element
   * @returns {string} Interaction type
   */
  getInteractionType(element) {
    if (element.closest('.relevance-btn')) {
      return 'feedback';
    } else if (element.closest('.result-title')) {
      return 'title_click';
    } else if (element.closest('.result-content')) {
      return 'content_click';
    } else {
      return 'general_click';
    }
  }

  /**
   * Track time spent on results
   */
  trackTimeSpent() {
    if (!this.currentResultStartTime) return;
    
    const timeSpent = Date.now() - this.currentResultStartTime;
    
    if (timeSpent > 1000) { // Only track if more than 1 second
      const timeData = this.behaviorMetrics.timeSpentOnResults;
      const currentResult = this.getCurrentResultId();
      
      if (currentResult) {
        timeData.set(currentResult, (timeData.get(currentResult) || 0) + timeSpent);
      }
    }
    
    this.currentResultStartTime = null;
  }

  /**
   * Get current result ID being viewed
   * @private
   * @returns {string|null} Current result ID
   */
  getCurrentResultId() {
    // This is a simplified implementation
    // In a more advanced version, we'd track which result is currently in viewport
    const activeResult = document.querySelector('.result-card:hover');
    return activeResult ? activeResult.getAttribute('data-article-id') : null;
  }

  /**
   * Process user feedback
   * @param {Object} feedbackData - Feedback data
   */
  processFeedback(feedbackData) {
    const feedback = {
      articleId: feedbackData.articleId,
      isHelpful: feedbackData.isHelpful,
      searchContext: this.currentSearchContext,
      timestamp: Date.now(),
      confidence: this.calculateFeedbackConfidence(feedbackData)
    };
    
    // Add to session data
    this.sessionData.feedback.push(feedback);
    
    // Update behavior metrics
    this.behaviorMetrics.feedbackFrequency++;
    
    // Update article scoring
    this.updateArticleScoring(feedback);
    
    // Update user profile
    this.updateUserProfile(feedback);
    
    console.log(`💭 Processed feedback for article: ${feedbackData.articleId} (${feedbackData.isHelpful ? 'helpful' : 'not helpful'})`);
  }

  /**
   * Calculate confidence score for feedback
   * @private
   * @param {Object} feedbackData - Feedback data
   * @returns {number} Confidence score (0-1)
   */
  calculateFeedbackConfidence(feedbackData) {
    let confidence = 0.5; // Base confidence
    
    // Increase confidence based on time spent on result
    if (this.currentResultStartTime) {
      const timeSpent = Date.now() - this.currentResultStartTime;
      if (timeSpent > 5000) confidence += 0.3; // 5+ seconds
      else if (timeSpent > 2000) confidence += 0.2; // 2+ seconds
    }
    
    // Increase confidence for users who provide frequent feedback
    if (this.behaviorMetrics.feedbackFrequency > 5) {
      confidence += 0.1;
    }
    
    // Decrease confidence for very quick feedback
    if (this.currentSearchContext) {
      const timeSinceSearch = Date.now() - this.currentSearchContext.timestamp;
      if (timeSinceSearch < 2000) confidence -= 0.2; // Less than 2 seconds
    }
    
    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Update article scoring based on feedback
   * @private
   * @param {Object} feedback - Feedback object
   */
  updateArticleScoring(feedback) {
    // This integrates with the Database.updateRelevanceScore method
    // but adds additional machine learning-like behavior
    
    const weightedFeedback = {
      value: feedback.isHelpful ? 1 : -1,
      weight: feedback.confidence,
      context: feedback.searchContext
    };
    
    // Store weighted feedback for learning
    const articleFeedback = this.getArticleFeedbackHistory(feedback.articleId);
    articleFeedback.push(weightedFeedback);
    
    // Trigger adaptive learning if enough feedback collected
    if (articleFeedback.length >= this.minFeedbackThreshold) {
      this.performAdaptiveLearning(feedback.articleId, articleFeedback);
    }
  }

  /**
   * Get feedback history for an article
   * @private
   * @param {string} articleId - Article ID
   * @returns {Array} Feedback history
   */
  getArticleFeedbackHistory(articleId) {
    if (!this.sessionData.articleFeedback) {
      this.sessionData.articleFeedback = {};
    }
    
    if (!this.sessionData.articleFeedback[articleId]) {
      this.sessionData.articleFeedback[articleId] = [];
    }
    
    return this.sessionData.articleFeedback[articleId];
  }

  /**
   * Perform adaptive learning for article
   * @private
   * @param {string} articleId - Article ID
   * @param {Array} feedbackHistory - Feedback history
   */
  performAdaptiveLearning(articleId, feedbackHistory) {
    // Calculate weighted average of feedback
    let totalWeight = 0;
    let weightedSum = 0;
    
    feedbackHistory.forEach(feedback => {
      const decayedWeight = feedback.weight * Math.pow(this.decayFactor, 
        (Date.now() - feedback.timestamp) / (24 * 60 * 60 * 1000)); // Decay over days
      
      totalWeight += decayedWeight;
      weightedSum += feedback.value * decayedWeight;
    });
    
    if (totalWeight > 0) {
      const adaptiveScore = weightedSum / totalWeight;
      
      // Update the article's adaptive relevance score
      this.updateAdaptiveScore(articleId, adaptiveScore);
      
      console.log(`🧠 Updated adaptive score for ${articleId}: ${adaptiveScore.toFixed(3)}`);
    }
  }

  /**
   * Update adaptive score for article
   * @private
   * @param {string} articleId - Article ID
   * @param {number} adaptiveScore - Calculated adaptive score
   */
  updateAdaptiveScore(articleId, adaptiveScore) {
    // Store adaptive scores in a separate map for efficiency
    if (!this.adaptiveScores) {
      this.adaptiveScores = new Map();
    }
    
    this.adaptiveScores.set(articleId, adaptiveScore);
  }

  /**
   * Update user profile based on feedback patterns
   * @private
   * @param {Object} feedback - Feedback object
   */
  updateUserProfile(feedback) {
    let profile = this.userProfiles.get(this.currentUserId) || {
      categories: {},
      keywords: {},
      languages: {},
      feedbackPatterns: {
        helpfulCount: 0,
        notHelpfulCount: 0,
        totalFeedback: 0
      }
    };
    
    // Update feedback patterns
    if (feedback.isHelpful) {
      profile.feedbackPatterns.helpfulCount++;
    } else {
      profile.feedbackPatterns.notHelpfulCount++;
    }
    profile.feedbackPatterns.totalFeedback++;
    
    // Update category preferences based on feedback
    if (feedback.searchContext && feedback.searchContext.category) {
      const category = feedback.searchContext.category;
      if (!profile.categories[category]) {
        profile.categories[category] = { helpful: 0, notHelpful: 0 };
      }
      
      if (feedback.isHelpful) {
        profile.categories[category].helpful++;
      } else {
        profile.categories[category].notHelpful++;
      }
    }
    
    // Update keyword preferences
    if (feedback.searchContext && feedback.searchContext.query) {
      const keywords = feedback.searchContext.query.toLowerCase().split(/\s+/);
      keywords.forEach(keyword => {
        if (keyword.length > 2) {
          if (!profile.keywords[keyword]) {
            profile.keywords[keyword] = { helpful: 0, notHelpful: 0 };
          }
          
          if (feedback.isHelpful) {
            profile.keywords[keyword].helpful++;
          } else {
            profile.keywords[keyword].notHelpful++;
          }
        }
      });
    }
    
    this.userProfiles.set(this.currentUserId, profile);
  }

  /**
   * Calculate personalized relevance score for an article
   * @param {string} articleId - Article ID
   * @param {Object} searchContext - Current search context
   * @returns {number} Personalized relevance score
   */
  calculatePersonalizedScore(articleId, searchContext) {
    const profile = this.userProfiles.get(this.currentUserId);
    
    if (!profile) {
      return 1.0; // Default score for new users
    }
    
    let personalizedScore = 1.0;
    
    // Category preference bonus
    if (searchContext.category && profile.categories[searchContext.category]) {
      const categoryData = profile.categories[searchContext.category];
      const categoryScore = categoryData.helpful / (categoryData.helpful + categoryData.notHelpful + 1);
      personalizedScore += categoryScore * 0.3;
    }
    
    // Keyword preference bonus
    if (searchContext.query) {
      const keywords = searchContext.query.toLowerCase().split(/\s+/);
      let keywordBonus = 0;
      let keywordCount = 0;
      
      keywords.forEach(keyword => {
        if (keyword.length > 2 && profile.keywords[keyword]) {
          const keywordData = profile.keywords[keyword];
          const keywordScore = keywordData.helpful / (keywordData.helpful + keywordData.notHelpful + 1);
          keywordBonus += keywordScore;
          keywordCount++;
        }
      });
      
      if (keywordCount > 0) {
        personalizedScore += (keywordBonus / keywordCount) * 0.2;
      }
    }
    
    // Adaptive score bonus
    if (this.adaptiveScores && this.adaptiveScores.has(articleId)) {
      const adaptiveScore = this.adaptiveScores.get(articleId);
      personalizedScore += adaptiveScore * 0.4;
    }
    
    return Math.max(0, Math.min(3, personalizedScore)); // Clamp to reasonable range
  }

  /**
   * Analyze session data for insights
   * @private
   */
  analyzeSession() {
    const sessionDuration = this.sessionData.endTime - this.sessionData.startTime;
    const searchCount = this.sessionData.searches.length;
    const feedbackCount = this.sessionData.feedback.length;
    
    console.log('📊 Session Analysis:', {
      duration: `${Math.round(sessionDuration / 1000)}s`,
      searches: searchCount,
      feedback: feedbackCount,
      feedbackRate: searchCount > 0 ? (feedbackCount / searchCount * 100).toFixed(1) + '%' : '0%'
    });
    
    // Store session insights
    this.sessionInsights = {
      duration: sessionDuration,
      searchCount,
      feedbackCount,
      avgSearchTime: searchCount > 0 ? 
        this.sessionData.searches.reduce((sum, s) => sum + s.searchTime, 0) / searchCount : 0,
      mostSearchedCategory: this.getMostSearchedCategory(),
      feedbackRatio: feedbackCount > 0 ? 
        this.sessionData.feedback.filter(f => f.isHelpful).length / feedbackCount : 0
    };
  }

  /**
   * Get most searched category in session
   * @private
   * @returns {string} Most searched category
   */
  getMostSearchedCategory() {
    const categoryCount = {};
    
    this.sessionData.searches.forEach(search => {
      categoryCount[search.category] = (categoryCount[search.category] || 0) + 1;
    });
    
    return Object.keys(categoryCount).reduce((a, b) => 
      categoryCount[a] > categoryCount[b] ? a : b, 'all');
  }

  /**
   * Get user behavior insights
   * @returns {Object} Behavior insights
   */
  getBehaviorInsights() {
    const profile = this.userProfiles.get(this.currentUserId);
    
    return {
      sessionInsights: this.sessionInsights,
      searchPatterns: Object.fromEntries(this.behaviorMetrics.searchPatterns),
      categoryPreferences: Object.fromEntries(this.behaviorMetrics.categoryPreferences),
      userProfile: profile,
      feedbackFrequency: this.behaviorMetrics.feedbackFrequency
    };
  }

  /**
   * Export user data for analysis or backup
   * @returns {Object} Exported user data
   */
  exportUserData() {
    return {
      userId: this.currentUserId,
      profile: this.userProfiles.get(this.currentUserId),
      behaviorMetrics: Object.fromEntries(this.behaviorMetrics.searchPatterns),
      sessionData: this.sessionData,
      adaptiveScores: this.adaptiveScores ? Object.fromEntries(this.adaptiveScores) : {},
      exportTimestamp: Date.now()
    };
  }

  /**
   * Reset user data (for privacy or testing)
   */
  resetUserData() {
    // Clear localStorage
    try {
      localStorage.removeItem(`croatianLawProfile_${this.currentUserId}`);
      localStorage.removeItem(`croatianLawBehavior_${this.currentUserId}`);
      localStorage.removeItem('croatianLawPreferences');
      localStorage.removeItem('croatianLawUserId');
    } catch (error) {
      console.warn('Unable to clear localStorage:', error);
    }
    
    // Reset in-memory data
    this.userProfiles.clear();
    this.behaviorMetrics = {
      searchPatterns: new Map(),
      categoryPreferences: new Map(),
      timeSpentOnResults: new Map(),
      feedbackFrequency: 0
    };
    this.adaptiveScores = new Map();
    
    // Generate new user ID
    this.initializeUserId();
    
    console.log('🔄 User data reset successfully');
  }
}

// Create global relevance scoring instance
window.RelevanceScoring = new RelevanceScoring();

// Auto-initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  window.RelevanceScoring.initialize().catch(error => {
    console.error('Failed to initialize relevance scoring:', error);
  });
});