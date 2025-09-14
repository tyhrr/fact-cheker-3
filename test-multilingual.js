#!/usr/bin/env node

/**
 * Multilingual Search System Test Script
 * Tests the Croatian Working Law multilingual search functionality
 */

const fs = require('fs');
const path = require('path');

// Load the multilingual data
const dataPath = path.join(__dirname, 'assets', 'data', 'croatian-working-law-multilingual.json');

console.log('🧪 Croatian Working Law - Multilingual System Test');
console.log('=' .repeat(60));

try {
    console.log('📊 Loading multilingual database...');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const articles = JSON.parse(rawData);
    
    console.log(`✅ Database loaded successfully`);
    console.log(`   Total articles: ${articles.length}`);
    
    // Analyze language distribution
    const languageStats = {};
    articles.forEach(article => {
        languageStats[article.language] = (languageStats[article.language] || 0) + 1;
    });
    
    console.log(`   Language distribution:`);
    Object.keys(languageStats).forEach(lang => {
        const flag = lang === 'hr' ? '🇭🇷' : lang === 'en' ? '🇺🇸' : '🇪🇸';
        console.log(`     ${flag} ${lang.toUpperCase()}: ${languageStats[lang]} articles`);
    });
    
    // Test original ID linking
    console.log('\n🔗 Testing article linking...');
    const originalIds = new Set();
    articles.forEach(article => {
        if (article.originalId) {
            originalIds.add(article.originalId);
        }
    });
    
    console.log(`   Unique original articles: ${originalIds.size}`);
    console.log(`   Expected: 275`);
    console.log(`   ${originalIds.size === 275 ? '✅' : '❌'} Article linking test`);
    
    // Test sample searches
    console.log('\n🔍 Testing search functionality...');
    
    const testQueries = [
        { query: 'radno vrijeme', language: 'hr', description: 'Croatian: working hours' },
        { query: 'working hours', language: 'en', description: 'English: working hours' },
        { query: 'horas de trabajo', language: 'es', description: 'Spanish: working hours' },
        { query: 'employment', language: 'en', description: 'English: employment' },
        { query: 'empleo', language: 'es', description: 'Spanish: employment' }
    ];
    
    testQueries.forEach((test, index) => {
        console.log(`\nTest ${index + 1}: ${test.description}`);
        console.log(`Query: "${test.query}" (Language: ${test.language})`);
        
        // Simple text search simulation
        const matches = articles.filter(article => {
            if (article.language !== test.language) return false;
            
            const searchText = (article.title + ' ' + article.content + ' ' + 
                              (article.keywords || []).join(' ')).toLowerCase();
            const queryWords = test.query.toLowerCase().split(/\s+/);
            
            return queryWords.some(word => searchText.includes(word));
        });
        
        console.log(`Results: ${matches.length} articles found`);
        
        if (matches.length > 0) {
            console.log(`Sample result: "${matches[0].title.substring(0, 80)}..."`);
            console.log(`✅ Search test passed`);
        } else {
            console.log(`❌ Search test failed - no results found`);
        }
    });
    
    // Test cross-language article availability
    console.log('\n🌍 Testing cross-language availability...');
    
    // Pick a random original ID and check if it exists in all languages
    const sampleOriginalId = Array.from(originalIds)[Math.floor(Math.random() * originalIds.size)];
    const languageVersions = {};
    
    articles.forEach(article => {
        if (article.originalId === sampleOriginalId) {
            languageVersions[article.language] = article;
        }
    });
    
    console.log(`Sample article ID: ${sampleOriginalId}`);
    console.log(`Available in:`);
    
    const expectedLanguages = ['hr', 'en', 'es'];
    let allLanguagesAvailable = true;
    
    expectedLanguages.forEach(lang => {
        const flag = lang === 'hr' ? '🇭🇷' : lang === 'en' ? '🇺🇸' : '🇪🇸';
        if (languageVersions[lang]) {
            console.log(`  ${flag} ${lang.toUpperCase()}: "${languageVersions[lang].title.substring(0, 60)}..."`);
        } else {
            console.log(`  ❌ ${lang.toUpperCase()}: Missing`);
            allLanguagesAvailable = false;
        }
    });
    
    console.log(`${allLanguagesAvailable ? '✅' : '❌'} Cross-language availability test`);
    
    // Final summary
    console.log('\n📋 Test Summary');
    console.log('=' .repeat(30));
    console.log(`✅ Database loaded: ${articles.length} articles`);
    console.log(`${originalIds.size === 275 ? '✅' : '❌'} Article structure: ${originalIds.size}/275 original articles`);
    console.log(`${Object.keys(languageStats).length === 3 ? '✅' : '❌'} Languages: ${Object.keys(languageStats).join(', ')}`);
    console.log(`${allLanguagesAvailable ? '✅' : '❌'} Cross-language linking works`);
    
    console.log('\n🎉 Multilingual system test completed!');
    
} catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
}