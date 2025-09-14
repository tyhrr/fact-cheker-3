/**
 * PDF to JSON Converter for Croatian Labor Law
 * Extracts articles, sections, and creates searchable database
 * 
 * @author Croatian Working Law Fact Checker
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const natural = require('natural');

// Translation dictionaries for search terms
const translations = {
  // Employment related terms
  employment: {
    hr: ['zapošljavanje', 'posao', 'rad', 'zaposlavanje', 'radni odnos', 'radnica', 'radnik'],
    en: ['employment', 'job', 'work', 'hiring', 'labor relation', 'worker', 'employee'],
    es: ['empleo', 'trabajo', 'contratación', 'relación laboral', 'trabajador', 'empleado']
  },
  
  // Termination related terms
  termination: {
    hr: ['otkaz', 'prestanak', 'razrješenje', 'prekidanje', 'završetak rada', 'otkazivanje'],
    en: ['termination', 'dismissal', 'firing', 'layoff', 'end of employment', 'discharge'],
    es: ['terminación', 'despido', 'cese', 'fin del empleo', 'despedida']
  },
  
  // Vacation and leave terms
  vacation: {
    hr: ['godišnji odmor', 'odmor', 'dopust', 'slobodni dani', 'praznici', 'godišnji'],
    en: ['vacation', 'holiday', 'leave', 'time off', 'annual leave', 'days off'],
    es: ['vacaciones', 'días libres', 'permiso', 'descanso', 'licencia anual']
  },
  
  // Working time terms
  workingTime: {
    hr: ['radno vrijeme', 'radni sati', 'smjena', 'prekovremeni rad', 'noćni rad', 'vikend'],
    en: ['working hours', 'work time', 'shift', 'overtime', 'night work', 'weekend'],
    es: ['horario de trabajo', 'horas laborales', 'turno', 'horas extras', 'trabajo nocturno']
  },
  
  // Wages and benefits terms
  wages: {
    hr: ['plaća', 'naknada', 'bonus', 'primanja', 'novčani dohodak', 'honorar', 'stipendija'],
    en: ['salary', 'wage', 'compensation', 'pay', 'remuneration', 'benefits', 'bonus'],
    es: ['salario', 'sueldo', 'compensación', 'pago', 'remuneración', 'beneficios']
  },
  
  // Sick leave terms
  sickLeave: {
    hr: ['bolovanje', 'bolovanji', 'zdravstveni dopust', 'medicinski odmor', 'bolesnost'],
    en: ['sick leave', 'medical leave', 'illness absence', 'health leave', 'sickness'],
    es: ['baja por enfermedad', 'permiso médico', 'ausencia por enfermedad']
  }
};

class CroatianLaborLawExtractor {
  constructor(pdfPath, outputPath) {
    this.pdfPath = pdfPath;
    this.outputPath = outputPath;
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
    this.database = {
      metadata: {
        title: "Croatian Labor Law Database",
        source: "Zakon o radu - Republic of Croatia",
        sourceUrl: "https://www.zakon.hr/z/307/zakon-o-radu",
        extractionDate: new Date().toISOString(),
        version: "1.0.0",
        totalArticles: 0,
        languages: ["hr", "en", "es"]
      },
      articles: [],
      searchIndex: {},
      categories: {
        employment: { hr: "Zapošljavanje", en: "Employment", es: "Empleo" },
        termination: { hr: "Otkaz", en: "Termination", es: "Terminación" },
        vacation: { hr: "Godišnji odmor", en: "Vacation & Leave", es: "Vacaciones" },
        wages: { hr: "Plaće", en: "Wages & Benefits", es: "Salarios" },
        workingTime: { hr: "Radno vrijeme", en: "Working Time", es: "Horario de trabajo" },
        sickLeave: { hr: "Bolovanje", en: "Sick Leave", es: "Baja por enfermedad" }
      },
      translations
    };
  }

  /**
   * Extract text from PDF file
   * @returns {Promise<string>} Extracted text
   */
  async extractPDFText() {
    try {
      console.log('📄 Reading PDF file...');
      const dataBuffer = await fs.readFile(this.pdfPath);
      const data = await pdfParse(dataBuffer);
      console.log(`✅ PDF extracted: ${data.numpages} pages, ${data.text.length} characters`);
      return data.text;
    } catch (error) {
      console.error('❌ Error extracting PDF:', error.message);
      throw error;
    }
  }

  /**
   * Parse Croatian legal text into structured articles
   * @param {string} text - Raw PDF text
   * @returns {Array} Structured articles
   */
  parseArticles(text) {
    console.log('🔍 Parsing articles from text...');
    
    const articles = [];
    
    // Croatian legal document patterns
    const articlePattern = /Članak\s+(\d+)\.?\s*\n([\s\S]*?)(?=Članak\s+\d+\.?\s*\n|$)/gi;
    const sectionPattern = /\((\d+)\)\s*(.*?)(?=\(\d+\)|$)/gs;
    const paragraphPattern = /^\d+\.\s*(.*?)(?=^\d+\.\s*|$)/gm;
    
    let match;
    let articleCount = 0;
    
    while ((match = articlePattern.exec(text)) !== null) {
      articleCount++;
      const articleNumber = parseInt(match[1]);
      const articleContent = match[2].trim();
      
      // Extract article title (usually the first line or sentence)
      const titleMatch = articleContent.match(/^([^\n.]+)(?:\.|$)/);
      const title = titleMatch ? titleMatch[1].trim() : `Članak ${articleNumber}`;
      
      // Parse sections within the article
      const sections = [];
      let sectionMatch;
      const sectionRegex = new RegExp(sectionPattern);
      
      while ((sectionMatch = sectionRegex.exec(articleContent)) !== null) {
        sections.push({
          number: parseInt(sectionMatch[1]),
          text: sectionMatch[2].trim()
        });
      }
      
      // If no sections found, treat entire content as single section
      if (sections.length === 0) {
        sections.push({
          number: 1,
          text: articleContent
        });
      }
      
      // Categorize article based on content
      const category = this.categorizeArticle(title, articleContent);
      
      // Generate keywords for search
      const keywords = this.generateKeywords(title, articleContent);
      
      const article = {
        id: `article_${articleNumber}`,
        number: articleNumber,
        title: title,
        content: articleContent,
        sections: sections,
        category: category,
        keywords: keywords,
        searchText: `${title} ${articleContent}`.toLowerCase(),
        relevanceScore: 1.0, // Base relevance score
        userFeedback: {
          helpful: 0,
          notHelpful: 0
        },
        translations: {
          title: {
            hr: title,
            en: this.translateToEnglish(title),
            es: this.translateToSpanish(title)
          },
          summary: {
            hr: this.generateSummary(articleContent),
            en: this.translateToEnglish(this.generateSummary(articleContent)),
            es: this.translateToSpanish(this.generateSummary(articleContent))
          }
        }
      };
      
      articles.push(article);
      
      // Progress indicator
      if (articleCount % 10 === 0) {
        console.log(`   Processed ${articleCount} articles...`);
      }
    }
    
    console.log(`✅ Parsed ${articles.length} articles`);
    return articles;
  }

  /**
   * Categorize article based on content analysis
   * @param {string} title - Article title
   * @param {string} content - Article content
   * @returns {string} Category key
   */
  categorizeArticle(title, content) {
    const text = `${title} ${content}`.toLowerCase();
    
    // Category scoring system
    const scores = {
      employment: 0,
      termination: 0,
      vacation: 0,
      wages: 0,
      workingTime: 0,
      sickLeave: 0
    };
    
    // Score based on keyword presence
    Object.keys(translations).forEach(category => {
      const keywords = translations[category].hr;
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          scores[category] += matches.length;
        }
      });
    });
    
    // Additional specific patterns
    if (text.includes('ugovor o radu') || text.includes('sklapanje')) {
      scores.employment += 3;
    }
    
    if (text.includes('otkaz') || text.includes('prestanak')) {
      scores.termination += 3;
    }
    
    if (text.includes('godišnji') || text.includes('odmor')) {
      scores.vacation += 3;
    }
    
    if (text.includes('plaća') || text.includes('naknada')) {
      scores.wages += 3;
    }
    
    if (text.includes('radno vrijeme') || text.includes('smjena')) {
      scores.workingTime += 3;
    }
    
    if (text.includes('bolovanje') || text.includes('bolest')) {
      scores.sickLeave += 3;
    }
    
    // Find category with highest score
    let maxScore = 0;
    let bestCategory = 'employment'; // Default category
    
    Object.keys(scores).forEach(category => {
      if (scores[category] > maxScore) {
        maxScore = scores[category];
        bestCategory = category;
      }
    });
    
    return bestCategory;
  }

  /**
   * Generate keywords for search indexing
   * @param {string} title - Article title
   * @param {string} content - Article content
   * @returns {Array} Keywords array
   */
  generateKeywords(title, content) {
    const text = `${title} ${content}`;
    const tokens = this.tokenizer.tokenize(text.toLowerCase());
    
    // Remove common Croatian stop words
    const stopWords = new Set([
      'i', 'u', 'na', 'za', 'od', 'do', 'iz', 'sa', 'po', 'pri', 'kroz',
      'između', 'prije', 'nakon', 'tijekom', 'unutar', 'iznad', 'ispod',
      'je', 'su', 'biti', 'ima', 'nema', 'može', 'mora', 'treba',
      'ako', 'kada', 'gdje', 'kako', 'što', 'koji', 'koja', 'koje',
      'ili', 'ali', 'jer', 'da', 'ne', 'se', 'će', 'bi', 'bu'
    ]);
    
    // Filter and stem keywords
    const keywords = tokens
      .filter(token => token.length > 2 && !stopWords.has(token))
      .filter(token => /^[a-zA-ZčćžšđČĆŽŠĐ]+$/.test(token))
      .map(token => this.stemmer.stem(token))
      .filter((token, index, array) => array.indexOf(token) === index) // Remove duplicates
      .slice(0, 20); // Limit to 20 keywords
    
    return keywords;
  }

  /**
   * Generate summary for article
   * @param {string} content - Article content
   * @returns {string} Summary text
   */
  generateSummary(content) {
    // Simple extractive summarization - take first 2 sentences
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const summary = sentences.slice(0, 2).join('. ');
    return summary.length > 200 ? summary.substring(0, 200) + '...' : summary;
  }

  /**
   * Simple translation to English (placeholder - in real implementation would use translation API)
   * @param {string} text - Croatian text
   * @returns {string} English translation
   */
  translateToEnglish(text) {
    // This is a simplified translation - in production, use a proper translation service
    const commonTranslations = {
      'Članak': 'Article',
      'radnik': 'worker',
      'radnica': 'female worker',
      'poslodavac': 'employer',
      'ugovor o radu': 'employment contract',
      'radno vrijeme': 'working hours',
      'godišnji odmor': 'annual leave',
      'otkaz': 'termination',
      'plaća': 'salary',
      'naknada': 'compensation',
      'bolovanje': 'sick leave'
    };
    
    let translated = text;
    Object.keys(commonTranslations).forEach(croatian => {
      const regex = new RegExp(`\\b${croatian}\\b`, 'gi');
      translated = translated.replace(regex, commonTranslations[croatian]);
    });
    
    return translated;
  }

  /**
   * Simple translation to Spanish (placeholder - in real implementation would use translation API)
   * @param {string} text - Croatian text
   * @returns {string} Spanish translation
   */
  translateToSpanish(text) {
    // This is a simplified translation - in production, use a proper translation service
    const commonTranslations = {
      'Članak': 'Artículo',
      'radnik': 'trabajador',
      'radnica': 'trabajadora',
      'poslodavac': 'empleador',
      'ugovor o radu': 'contrato de trabajo',
      'radno vrijeme': 'horario de trabajo',
      'godišnji odmor': 'vacaciones anuales',
      'otkaz': 'terminación',
      'plaća': 'salario',
      'naknada': 'compensación',
      'bolovanje': 'baja por enfermedad'
    };
    
    let translated = text;
    Object.keys(commonTranslations).forEach(croatian => {
      const regex = new RegExp(`\\b${croatian}\\b`, 'gi');
      translated = translated.replace(regex, commonTranslations[croatian]);
    });
    
    return translated;
  }

  /**
   * Build search index for fast text search
   * @param {Array} articles - Articles array
   * @returns {Object} Search index
   */
  buildSearchIndex(articles) {
    console.log('🗂️ Building search index...');
    
    const index = {};
    
    articles.forEach(article => {
      const words = [
        ...article.keywords,
        ...this.tokenizer.tokenize(article.title.toLowerCase()),
        ...this.tokenizer.tokenize(article.content.toLowerCase())
      ].filter(word => word.length > 2);
      
      words.forEach(word => {
        const stemmed = this.stemmer.stem(word);
        if (!index[stemmed]) {
          index[stemmed] = [];
        }
        
        // Add article reference if not already present
        const existingRef = index[stemmed].find(ref => ref.articleId === article.id);
        if (!existingRef) {
          index[stemmed].push({
            articleId: article.id,
            frequency: 1,
            positions: [words.indexOf(word)]
          });
        } else {
          existingRef.frequency++;
          existingRef.positions.push(words.indexOf(word));
        }
      });
    });
    
    console.log(`✅ Built search index with ${Object.keys(index).length} terms`);
    return index;
  }

  /**
   * Main extraction process
   */
  async extract() {
    try {
      console.log('🚀 Starting Croatian Labor Law extraction...');
      
      // Extract PDF text
      const pdfText = await this.extractPDFText();
      
      // Parse articles
      const articles = this.parseArticles(pdfText);
      
      // Build search index
      const searchIndex = this.buildSearchIndex(articles);
      
      // Update database
      this.database.articles = articles;
      this.database.searchIndex = searchIndex;
      this.database.metadata.totalArticles = articles.length;
      
      // Calculate category statistics
      const categoryStats = {};
      articles.forEach(article => {
        if (!categoryStats[article.category]) {
          categoryStats[article.category] = 0;
        }
        categoryStats[article.category]++;
      });
      
      this.database.metadata.categoryStats = categoryStats;
      
      console.log('📊 Extraction Statistics:');
      console.log(`   Total Articles: ${articles.length}`);
      console.log(`   Search Index Terms: ${Object.keys(searchIndex).length}`);
      console.log('   Category Distribution:');
      Object.keys(categoryStats).forEach(category => {
        console.log(`     ${category}: ${categoryStats[category]} articles`);
      });
      
      // Save to JSON file
      await this.saveDatabase();
      
      console.log('✅ Extraction completed successfully!');
      
    } catch (error) {
      console.error('❌ Extraction failed:', error.message);
      throw error;
    }
  }

  /**
   * Save database to JSON file
   */
  async saveDatabase() {
    try {
      console.log('💾 Saving database to JSON file...');
      
      const jsonData = JSON.stringify(this.database, null, 2);
      await fs.writeFile(this.outputPath, jsonData, 'utf8');
      
      const fileSizeKB = Math.round(jsonData.length / 1024);
      console.log(`✅ Database saved: ${this.outputPath} (${fileSizeKB} KB)`);
      
    } catch (error) {
      console.error('❌ Error saving database:', error.message);
      throw error;
    }
  }

  /**
   * Validate the generated database
   */
  async validate() {
    try {
      console.log('🔍 Validating generated database...');
      
      const data = JSON.parse(await fs.readFile(this.outputPath, 'utf8'));
      
      // Basic validation checks
      const issues = [];
      
      if (!data.articles || data.articles.length === 0) {
        issues.push('No articles found');
      }
      
      if (!data.searchIndex || Object.keys(data.searchIndex).length === 0) {
        issues.push('Search index is empty');
      }
      
      // Check for required article fields
      data.articles.forEach((article, index) => {
        if (!article.id) issues.push(`Article ${index + 1}: Missing ID`);
        if (!article.title) issues.push(`Article ${index + 1}: Missing title`);
        if (!article.content) issues.push(`Article ${index + 1}: Missing content`);
        if (!article.category) issues.push(`Article ${index + 1}: Missing category`);
      });
      
      if (issues.length > 0) {
        console.log('⚠️ Validation issues found:');
        issues.forEach(issue => console.log(`   - ${issue}`));
        return false;
      }
      
      console.log('✅ Database validation passed!');
      return true;
      
    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      return false;
    }
  }
}

// Main execution
async function main() {
  const pdfPath = path.join(__dirname, '..', 'zakon-o-radu.pdf');
  const outputPath = path.join(__dirname, '..', 'assets', 'data', 'croatian-working-law.json');
  
  const extractor = new CroatianLaborLawExtractor(pdfPath, outputPath);
  
  try {
    await extractor.extract();
    await extractor.validate();
    
    console.log('\n🎉 Croatian Labor Law database successfully created!');
    console.log(`📂 Database location: ${outputPath}`);
    console.log('🔧 Ready for use in the web application');
    
  } catch (error) {
    console.error('\n💥 Process failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = CroatianLaborLawExtractor;