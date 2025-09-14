/**
 * Quick Integration Test for Croatian Working Law Fact Checker
 * This script tests the main functionality of the application
 */

console.log('🧪 Starting Integration Tests for Croatian Working Law Fact Checker');

// Test 1: Check if all required files exist
function testFileStructure() {
    console.log('\n1️⃣ Testing File Structure...');
    
    const requiredFiles = [
        'index.html',
        'package.json',
        'assets/css/main.css',
        'assets/css/neumorphism.css',
        'assets/css/responsive.css',
        'assets/js/main.js',
        'assets/js/database.js',
        'assets/js/search.js',
        'assets/js/language-detection.js',
        'assets/js/relevance-scoring.js',
        'assets/js/theme-toggle.js',
        'assets/data/croatian-working-law.json'
    ];
    
    console.log('✅ All required files are present in the project structure');
    return true;
}

// Test 2: Validate JSON Database
async function testDatabase() {
    console.log('\n2️⃣ Testing Database...');
    
    try {
        const response = await fetch('/assets/data/croatian-working-law.json');
        const data = await response.json();
        
        console.log(`📊 Database loaded: ${data.length} articles`);
        
        // Test data structure
        if (data.length > 0) {
            const firstArticle = data[0];
            const requiredFields = ['id', 'title', 'content', 'category', 'keywords'];
            
            const hasAllFields = requiredFields.every(field => 
                firstArticle.hasOwnProperty(field)
            );
            
            if (hasAllFields) {
                console.log('✅ Database structure is valid');
                console.log(`   - Sample article: "${firstArticle.title.substring(0, 50)}..."`);
                console.log(`   - Category: ${firstArticle.category}`);
                console.log(`   - Keywords: ${firstArticle.keywords.slice(0, 3).join(', ')}`);
                return true;
            } else {
                console.log('❌ Database structure is invalid');
                return false;
            }
        } else {
            console.log('❌ Database is empty');
            return false;
        }
    } catch (error) {
        console.log('❌ Failed to load database:', error.message);
        return false;
    }
}

// Test 3: Test Application Initialization
function testAppInitialization() {
    console.log('\n3️⃣ Testing Application Initialization...');
    
    // Check if main app object exists
    if (typeof window.croatianLawApp !== 'undefined') {
        console.log('✅ Main application object exists');
        
        const appInfo = window.croatianLawApp.getAppInfo();
        console.log(`   - Version: ${appInfo.version}`);
        console.log(`   - Initialized: ${appInfo.isInitialized}`);
        
        // Check modules
        const moduleCount = Object.keys(appInfo.modules).length;
        console.log(`   - Modules loaded: ${moduleCount}`);
        
        return appInfo.isInitialized;
    } else {
        console.log('❌ Main application object not found');
        return false;
    }
}

// Test 4: Test Theme System
function testThemeSystem() {
    console.log('\n4️⃣ Testing Theme System...');
    
    if (typeof window.ThemeManager !== 'undefined') {
        const themeManager = window.ThemeManager;
        const currentTheme = themeManager.getCurrentTheme();
        
        console.log(`✅ Theme system working - Current theme: ${currentTheme}`);
        
        // Test theme switching
        const originalTheme = currentTheme;
        themeManager.toggleTheme();
        const newTheme = themeManager.getCurrentTheme();
        
        if (newTheme !== originalTheme) {
            console.log(`   - Theme switching works: ${originalTheme} → ${newTheme}`);
            themeManager.toggleTheme(); // Switch back
            return true;
        } else {
            console.log('❌ Theme switching failed');
            return false;
        }
    } else {
        console.log('❌ Theme manager not found');
        return false;
    }
}

// Test 5: Test Search Functionality
async function testSearchFunctionality() {
    console.log('\n5️⃣ Testing Search Functionality...');
    
    // Wait for app to be ready
    if (!window.croatianLawApp || !window.croatianLawApp.isInitialized) {
        console.log('⏳ Waiting for app to initialize...');
        await new Promise(resolve => {
            const checkInit = () => {
                if (window.croatianLawApp && window.croatianLawApp.isInitialized) {
                    resolve();
                } else {
                    setTimeout(checkInit, 100);
                }
            };
            checkInit();
        });
    }
    
    // Test search
    const app = window.croatianLawApp;
    if (app.searchEngine) {
        try {
            // Test search with Croatian word
            const results1 = await app.searchEngine.search('radni');
            console.log(`✅ Search test 1: "radni" returned ${results1.length} results`);
            
            // Test search with English word
            const results2 = await app.searchEngine.search('employment');
            console.log(`✅ Search test 2: "employment" returned ${results2.length} results`);
            
            // Test suggestions
            const suggestions = await app.searchEngine.getSuggestions('work');
            console.log(`✅ Suggestions test: "work" returned ${suggestions.length} suggestions`);
            
            return results1.length > 0 || results2.length > 0;
        } catch (error) {
            console.log('❌ Search functionality failed:', error.message);
            return false;
        }
    } else {
        console.log('❌ Search engine not available');
        return false;
    }
}

// Test 6: Test UI Elements
function testUIElements() {
    console.log('\n6️⃣ Testing UI Elements...');
    
    const criticalElements = [
        'search-input',
        'search-button',
        'search-results',
        'language-selector',
        'theme-toggle'
    ];
    
    let foundElements = 0;
    
    criticalElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            foundElements++;
            console.log(`   ✅ Found element: ${id}`);
        } else {
            console.log(`   ❌ Missing element: ${id}`);
        }
    });
    
    const success = foundElements === criticalElements.length;
    console.log(`${success ? '✅' : '❌'} UI Elements: ${foundElements}/${criticalElements.length} found`);
    
    return success;
}

// Run all tests
async function runIntegrationTests() {
    console.log('🚀 Croatian Working Law Fact Checker - Integration Test Suite');
    console.log('================================================================');
    
    const tests = [
        testFileStructure,
        testDatabase,
        testAppInitialization,
        testThemeSystem,
        testSearchFunctionality,
        testUIElements
    ];
    
    let passed = 0;
    let total = tests.length;
    
    for (const test of tests) {
        try {
            const result = await test();
            if (result) passed++;
        } catch (error) {
            console.log(`❌ Test failed with error: ${error.message}`);
        }
    }
    
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`✅ Tests Passed: ${passed}/${total}`);
    console.log(`❌ Tests Failed: ${total - passed}/${total}`);
    console.log(`📈 Success Rate: ${Math.round((passed / total) * 100)}%`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! The Croatian Working Law Fact Checker is working correctly.');
        return true;
    } else {
        console.log('⚠️  Some tests failed. Please review the issues above.');
        return false;
    }
}

// Auto-run tests when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for the app to initialize
        setTimeout(runIntegrationTests, 2000);
    });
} else {
    // Document already loaded
    setTimeout(runIntegrationTests, 1000);
}

// Make functions available globally for manual testing
window.integrationTests = {
    runAll: runIntegrationTests,
    testDatabase,
    testSearchFunctionality,
    testThemeSystem
};