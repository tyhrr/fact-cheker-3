#!/usr/bin/env python3
"""
Simplified PDF to JSON Converter for Croatian Working Law
"""

import json
import re
import sys
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("Error: pdfplumber not installed. Installing...")
    sys.exit(1)

def extract_pdf_to_json(pdf_path, output_path):
    """Extract Croatian working law from PDF to JSON format."""
    
    articles = []
    
    print(f"Processing PDF: {pdf_path}")
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            
            # Extract text from all pages
            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text()
                if text:
                    full_text += text + "\n"
                    print(f"Processed page {page_num}/{len(pdf.pages)}")
            
            # Split into articles
            # Look for article patterns like "Članak 1", "Article 1", etc.
            article_pattern = r'(?:Članak|Article|Čl\.|Art\.)\s*(\d+)\.?\s*([^\n]+(?:\n(?!(?:Članak|Article|Čl\.|Art\.))[^\n]*)*)'
            
            matches = re.finditer(article_pattern, full_text, re.MULTILINE | re.IGNORECASE)
            
            for match in matches:
                article_num = match.group(1)
                title_and_content = match.group(2).strip()
                
                # Split title and content (first line is usually title)
                lines = title_and_content.split('\n')
                title = lines[0].strip()
                content = '\n'.join(lines[1:]).strip() if len(lines) > 1 else title
                
                # Categorize based on keywords
                category = categorize_article(title + " " + content)
                
                # Generate keywords
                keywords = generate_keywords(title + " " + content)
                
                article = {
                    "id": len(articles) + 1,
                    "articleNumber": f"Article {article_num}",
                    "title": title,
                    "content": content[:1000] + "..." if len(content) > 1000 else content,  # Limit content length
                    "category": category,
                    "keywords": keywords,
                    "language": "en",
                    "source": "Croatian Labor Law",
                    "lastUpdated": "2025-01-25"
                }
                
                articles.append(article)
            
            # If no articles found with pattern matching, create general entries
            if not articles:
                print("No articles found with pattern matching, creating general entries...")
                
                # Split text into chunks
                chunks = full_text.split('\n\n')
                for i, chunk in enumerate(chunks[:50]):  # Limit to first 50 chunks
                    if len(chunk.strip()) > 100:  # Only meaningful chunks
                        article = {
                            "id": i + 1,
                            "articleNumber": f"Section {i + 1}",
                            "title": chunk.strip()[:100] + "...",
                            "content": chunk.strip()[:1000] + "..." if len(chunk.strip()) > 1000 else chunk.strip(),
                            "category": categorize_article(chunk),
                            "keywords": generate_keywords(chunk),
                            "language": "en",
                            "source": "Croatian Labor Law",
                            "lastUpdated": "2025-01-25"
                        }
                        articles.append(article)
            
            # Save to JSON
            print(f"Extracted {len(articles)} articles")
            
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(articles, f, ensure_ascii=False, indent=2)
            
            print(f"✅ Successfully created {output_path}")
            return True
            
    except Exception as e:
        print(f"Error processing PDF: {e}")
        return False

def categorize_article(text):
    """Categorize article based on content keywords."""
    text_lower = text.lower()
    
    if any(word in text_lower for word in ['working time', 'hours', 'overtime', 'radno vrijeme', 'sati']):
        return "Working Time"
    elif any(word in text_lower for word in ['leave', 'vacation', 'holiday', 'godišnji', 'odmor']):
        return "Leave"
    elif any(word in text_lower for word in ['employment', 'contract', 'hiring', 'ugovor', 'zapošljavanje']):
        return "Employment"
    elif any(word in text_lower for word in ['termination', 'dismissal', 'otkazivanje', 'prestanak']):
        return "Termination"
    elif any(word in text_lower for word in ['safety', 'health', 'sigurnost', 'zdravlje']):
        return "Safety & Health"
    elif any(word in text_lower for word in ['salary', 'wage', 'payment', 'plaća', 'naknada']):
        return "Compensation"
    elif any(word in text_lower for word in ['rights', 'obligations', 'prava', 'obveze']):
        return "Rights & Obligations"
    else:
        return "General"

def generate_keywords(text):
    """Generate keywords from article text."""
    # Common stop words
    stop_words = {'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'a', 'an', 
                  'i', 'u', 'na', 'za', 'od', 'do', 'sa', 'se', 'je', 'su', 'kao'}
    
    # Extract words
    words = re.findall(r'\b[a-zA-ZčćžšđČĆŽŠĐ]+\b', text.lower())
    
    # Filter and count words
    word_count = {}
    for word in words:
        if len(word) > 3 and word not in stop_words:
            word_count[word] = word_count.get(word, 0) + 1
    
    # Return top keywords
    sorted_words = sorted(word_count.items(), key=lambda x: x[1], reverse=True)
    return [word for word, count in sorted_words[:10]]

if __name__ == "__main__":
    pdf_file = "zakon-o-radu.pdf"
    json_file = "assets/data/croatian-working-law.json"
    
    # Ensure output directory exists
    Path(json_file).parent.mkdir(parents=True, exist_ok=True)
    
    if not Path(pdf_file).exists():
        print(f"Error: PDF file '{pdf_file}' not found")
        sys.exit(1)
    
    success = extract_pdf_to_json(pdf_file, json_file)
    
    if success:
        print(f"✅ Successfully converted {pdf_file} to {json_file}")
    else:
        print(f"❌ Failed to convert {pdf_file}")
        sys.exit(1)