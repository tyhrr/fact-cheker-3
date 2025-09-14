#!/usr/bin/env python3
"""
Croatian Working Law Articles Translation Script
==================================================

This script automatically translates Croatian legal articles to English and Spanish
using Google Translate API, maintaining the structure and generating multilingual
keywords for comprehensive search functionality.

Author: Croatian Working Law Fact Checker
Date: September 14, 2025
"""

import json
import time
import os
import sys
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
import re

# Install required packages if not present
try:
    from googletrans import Translator, LANGUAGES
    import requests
except ImportError:
    print("Installing required packages...")
    os.system("pip install googletrans==4.0.0rc1 requests")
    from googletrans import Translator, LANGUAGES
    import requests

@dataclass
class ArticleTranslation:
    """Data class for article translation results"""
    original_id: int
    language: str
    article_number: str
    title: str
    content: str
    category: str
    keywords: List[str]
    source: str = "Croatian Labor Law"
    last_updated: str = "2025-09-14"

class LegalArticleTranslator:
    """
    Handles translation of Croatian legal articles to multiple languages
    with specialized legal terminology handling and keyword extraction.
    """
    
    def __init__(self, rate_limit_delay: float = 1.0):
        """
        Initialize the translator with rate limiting.
        
        Args:
            rate_limit_delay: Delay between API calls to avoid rate limiting
        """
        self.translator = Translator()
        self.rate_limit_delay = rate_limit_delay
        self.translation_cache = {}
        
        # Language configuration
        self.target_languages = {
            'hr': 'Croatian',  # Original language
            'en': 'English',
            'es': 'Spanish'
        }
        
        # Legal terminology mappings for better translations
        self.legal_term_mappings = {
            'en': {
                'Narodne novine': 'Official Gazette',
                'Republika Hrvatska': 'Republic of Croatia',
                'radni odnosi': 'labor relations', 
                'poslodavac': 'employer',
                'radnik': 'employee',
                'ugovor o radu': 'employment contract',
                'radno vrijeme': 'working hours',
                'godišnji odmor': 'annual leave',
                'bolovanje': 'sick leave',
                'otkaz': 'termination',
                'otpremnina': 'severance pay'
            },
            'es': {
                'Narodne novine': 'Boletín Oficial', 
                'Republika Hrvatska': 'República de Croacia',
                'radni odnosi': 'relaciones laborales',
                'poslodavac': 'empleador',
                'radnik': 'empleado',
                'ugovor o radu': 'contrato de trabajo',
                'radno vrijeme': 'horario de trabajo',
                'godišnji odmor': 'vacaciones anuales',
                'bolovanje': 'baja por enfermedad',
                'otkaz': 'despido',
                'otpremnina': 'indemnización por despido'
            }
        }
        
        print("🌍 Legal Article Translator initialized")
        print(f"📋 Target languages: {', '.join(self.target_languages.values())}")

    def apply_legal_terminology(self, text: str, target_language: str) -> str:
        """
        Apply legal terminology corrections to translated text.
        
        Args:
            text: Translated text
            target_language: Target language code
            
        Returns:
            Text with corrected legal terminology
        """
        if target_language not in self.legal_term_mappings:
            return text
            
        corrected_text = text
        for croatian_term, translation in self.legal_term_mappings[target_language].items():
            # Case-insensitive replacement
            corrected_text = re.sub(
                re.escape(croatian_term), 
                translation, 
                corrected_text, 
                flags=re.IGNORECASE
            )
            
        return corrected_text

    def translate_text(self, text: str, target_language: str, text_type: str = "content") -> str:
        """
        Translate text with caching and rate limiting.
        
        Args:
            text: Text to translate
            target_language: Target language code
            text_type: Type of text (title, content, etc.) for logging
            
        Returns:
            Translated text
        """
        if not text or not text.strip():
            return text
            
        # Create cache key
        cache_key = f"{text[:50]}_{target_language}"
        
        if cache_key in self.translation_cache:
            return self.translation_cache[cache_key]
            
        try:
            # Rate limiting
            time.sleep(self.rate_limit_delay)
            
            # Translate
            result = self.translator.translate(text, src='hr', dest=target_language)
            translated = result.text
            
            # Apply legal terminology corrections
            translated = self.apply_legal_terminology(translated, target_language)
            
            # Cache the result
            self.translation_cache[cache_key] = translated
            
            print(f"✅ Translated {text_type} to {target_language}: {text[:30]}...")
            
            return translated
            
        except Exception as e:
            print(f"❌ Translation error for {text_type}: {str(e)}")
            return text  # Return original if translation fails

    def extract_keywords(self, title: str, content: str, language: str) -> List[str]:
        """
        Extract relevant keywords from title and content for search indexing.
        
        Args:
            title: Article title
            content: Article content  
            language: Language code
            
        Returns:
            List of extracted keywords
        """
        # Combine title and content
        combined_text = f"{title} {content}".lower()
        
        # Define stop words for each language
        stop_words = {
            'hr': {'i', 'ili', 'je', 'na', 'u', 'se', 'za', 'od', 'do', 'kao', 'koji', 'koja', 'koje', 'te', 'a', 'o'},
            'en': {'and', 'or', 'is', 'in', 'on', 'the', 'for', 'of', 'to', 'as', 'that', 'which', 'who', 'a', 'an'},
            'es': {'y', 'o', 'es', 'en', 'la', 'el', 'para', 'de', 'a', 'como', 'que', 'cual', 'quien', 'un', 'una'}
        }
        
        # Extract words (letters only, minimum length 3)
        words = re.findall(r'\b[a-záčđšžñü]{3,}\b', combined_text)
        
        # Filter out stop words and get unique keywords
        keywords = []
        seen = set()
        lang_stop_words = stop_words.get(language, set())
        
        for word in words:
            if word not in lang_stop_words and word not in seen:
                keywords.append(word)
                seen.add(word)
                
        # Return top 10 most relevant keywords
        return keywords[:10]

    def translate_article(self, article: Dict[str, Any], target_language: str, new_id: int) -> ArticleTranslation:
        """
        Translate a single article to the target language.
        
        Args:
            article: Original article data
            target_language: Target language code  
            new_id: New unique ID for the translated article
            
        Returns:
            ArticleTranslation object with translated content
        """
        print(f"\n🔄 Translating Article {article['id']} to {self.target_languages[target_language]}...")
        
        # If it's already Croatian (original), just update the language field
        if target_language == 'hr':
            return ArticleTranslation(
                original_id=article['id'],
                language='hr',
                article_number=article['articleNumber'], 
                title=article['title'],
                content=article['content'],
                category=article['category'],
                keywords=article['keywords'][:10]  # Keep existing keywords, limit to 10
            )
            
        # Translate title and content
        translated_title = self.translate_text(article['title'], target_language, "title")
        translated_content = self.translate_text(article['content'], target_language, "content")
        
        # Translate article number if needed
        article_number = article['articleNumber']
        if target_language == 'es':
            article_number = article_number.replace('Article', 'Artículo')
            
        # Generate keywords from translated content
        keywords = self.extract_keywords(translated_title, translated_content, target_language)
        
        return ArticleTranslation(
            original_id=article['id'],
            language=target_language,
            article_number=article_number,
            title=translated_title,
            content=translated_content, 
            category=article['category'],  # Category remains the same
            keywords=keywords
        )

    def translate_all_articles(self, input_file: str, output_file: str) -> None:
        """
        Translate all articles from the input file and save to output file.
        
        Args:
            input_file: Path to input JSON file
            output_file: Path to output JSON file
        """
        print(f"\n📖 Loading articles from {input_file}...")
        
        # Load original articles
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                articles = json.load(f)
        except FileNotFoundError:
            print(f"❌ Error: File {input_file} not found!")
            return
        except json.JSONDecodeError as e:
            print(f"❌ Error parsing JSON: {e}")
            return
            
        print(f"📊 Found {len(articles)} articles to translate")
        
        # Initialize results list
        multilingual_articles = []
        current_id = 1
        
        # Process each article
        total_articles = len(articles)
        
        for i, article in enumerate(articles):
            print(f"\n{'='*60}")
            print(f"Processing Article {article['id']} ({i+1}/{total_articles})")
            print(f"{'='*60}")
            
            # Translate to each target language  
            for lang_code in self.target_languages.keys():
                try:
                    translated_article = self.translate_article(article, lang_code, current_id)
                    
                    # Convert to dictionary format
                    article_dict = {
                        "id": current_id,
                        "originalId": translated_article.original_id,
                        "articleNumber": translated_article.article_number,
                        "title": translated_article.title,
                        "content": translated_article.content,
                        "category": translated_article.category,
                        "keywords": translated_article.keywords,
                        "language": translated_article.language,
                        "source": translated_article.source,
                        "lastUpdated": translated_article.last_updated
                    }
                    
                    multilingual_articles.append(article_dict)
                    current_id += 1
                    
                    print(f"✅ Completed {lang_code.upper()} version (ID: {article_dict['id']})")
                    
                except Exception as e:
                    print(f"❌ Error translating article {article['id']} to {lang_code}: {e}")
                    continue
                    
            # Save progress every 10 articles
            if (i + 1) % 10 == 0:
                self.save_progress(multilingual_articles, f"{output_file}.progress")
                print(f"💾 Progress saved: {len(multilingual_articles)} articles completed")
                
        # Save final result
        print(f"\n💾 Saving {len(multilingual_articles)} multilingual articles to {output_file}...")
        
        try:
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(multilingual_articles, f, ensure_ascii=False, indent=2)
                
            print(f"🎉 Translation completed successfully!")
            print(f"📊 Final statistics:")
            print(f"   - Original articles: {total_articles}")
            print(f"   - Total multilingual articles: {len(multilingual_articles)}")
            print(f"   - Languages: {len(self.target_languages)}")
            print(f"   - Articles per language: {len(multilingual_articles) // len(self.target_languages)}")
            
        except Exception as e:
            print(f"❌ Error saving file: {e}")
            
    def save_progress(self, articles: List[Dict], progress_file: str) -> None:
        """Save translation progress to a temporary file."""
        try:
            with open(progress_file, 'w', encoding='utf-8') as f:
                json.dump(articles, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"⚠️ Warning: Could not save progress: {e}")

def main():
    """Main execution function"""
    print("🌍 Croatian Working Law Articles Translator")
    print("=" * 50)
    
    # Configuration
    input_file = "assets/data/croatian-working-law.json"
    output_file = "assets/data/croatian-working-law-multilingual.json"
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"❌ Error: Input file {input_file} not found!")
        print("Please make sure the file exists and try again.")
        return
        
    # Initialize translator
    translator = LegalArticleTranslator(rate_limit_delay=0.5)  # 0.5 second delay between requests
    
    # Start translation process
    try:
        translator.translate_all_articles(input_file, output_file)
        print("\n🎉 All translations completed successfully!")
        
    except KeyboardInterrupt:
        print("\n⏹️ Translation interrupted by user.")
        print("Progress has been saved to .progress file if available.")
        
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        
if __name__ == "__main__":
    main()