#!/usr/bin/env node
/**
 * Test script to verify validation words JSON implementation
 * Run with: node scripts/test-validation-words.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Validation Words Implementation\n');

let errors = 0;
let warnings = 0;

// Test 1: Check if JSON file exists
console.log('1️⃣  Checking if JSON file exists...');
const jsonPath = path.join(__dirname, '../lib/curated-validation-words.json');
if (!fs.existsSync(jsonPath)) {
  console.error('   ❌ JSON file not found at:', jsonPath);
  errors++;
  process.exit(1);
}
console.log('   ✅ JSON file exists');

// Test 2: Validate JSON structure
console.log('\n2️⃣  Validating JSON structure...');
try {
  const content = fs.readFileSync(jsonPath, 'utf-8');
  const words = JSON.parse(content);
  
  if (!Array.isArray(words)) {
    console.error('   ❌ JSON is not an array');
    errors++;
  } else {
    console.log(`   ✅ JSON is a valid array with ${words.length} words`);
  }
  
  // Test 3: Check word count
  console.log('\n3️⃣  Checking word count...');
  if (words.length < 12000) {
    console.warn(`   ⚠️  Word count (${words.length}) is below 12,000 target`);
    warnings++;
  } else {
    console.log(`   ✅ Word count: ${words.length} (meets 12,000+ requirement)`);
  }
  
  // Test 4: Validate all words are 5 letters and uppercase
  console.log('\n4️⃣  Validating word format...');
  const invalidWords = words.filter(w => {
    return typeof w !== 'string' || w.length !== 5 || w !== w.toUpperCase();
  });
  
  if (invalidWords.length > 0) {
    console.error(`   ❌ Found ${invalidWords.length} invalid words:`);
    console.error('   First 10 invalid words:', invalidWords.slice(0, 10));
    errors++;
  } else {
    console.log('   ✅ All words are 5-letter uppercase strings');
  }
  
  // Test 5: Check for duplicates
  console.log('\n5️⃣  Checking for duplicates...');
  const uniqueWords = new Set(words);
  if (uniqueWords.size !== words.length) {
    const duplicates = words.length - uniqueWords.size;
    console.error(`   ❌ Found ${duplicates} duplicate words`);
    errors++;
  } else {
    console.log('   ✅ No duplicates found');
  }
  
  // Test 6: Test loading in TypeScript context (simulate)
  console.log('\n6️⃣  Testing JSON can be loaded...');
  try {
    // Simulate what seed.ts does
    const loadedWords = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    if (loadedWords.length === words.length) {
      console.log('   ✅ JSON loads correctly');
    } else {
      console.error('   ❌ JSON load mismatch');
      errors++;
    }
  } catch (e) {
    console.error('   ❌ Error loading JSON:', e.message);
    errors++;
  }
  
  // Test 7: Check for common words
  console.log('\n7️⃣  Checking for common words...');
  const commonWords = ['APPLE', 'HOUSE', 'WORLD', 'HELLO', 'MUSIC'];
  const foundCommon = commonWords.filter(w => words.includes(w));
  if (foundCommon.length === commonWords.length) {
    console.log('   ✅ Common words found');
  } else {
    console.warn(`   ⚠️  Some common words missing: ${commonWords.filter(w => !words.includes(w)).join(', ')}`);
    warnings++;
  }
  
  // Test 8: Check answer words don't overlap (if answer words file exists)
  console.log('\n8️⃣  Checking answer words overlap...');
  try {
    const answerWordsPath = path.join(__dirname, '../lib/curated-answer-words.ts');
    if (fs.existsSync(answerWordsPath)) {
      const answerContent = fs.readFileSync(answerWordsPath, 'utf-8');
      const answerMatch = answerContent.match(/export const CURATED_ANSWER_WORDS: string\[\] = \[([\s\S]*?)\];/);
      if (answerMatch) {
        const answerWords = answerMatch[1].match(/"([A-Z]{5})"/g)?.map(w => w.replace(/"/g, '')) || [];
        const overlap = words.filter(w => answerWords.includes(w));
        if (overlap.length > 0) {
          console.log(`   ℹ️  Found ${overlap.length} words that overlap with answer words (this is expected)`);
        } else {
          console.log('   ✅ No overlap with answer words');
        }
      }
    }
  } catch (e) {
    console.warn('   ⚠️  Could not check answer words overlap:', e.message);
    warnings++;
  }
  
} catch (e) {
  console.error('   ❌ Error parsing JSON:', e.message);
  errors++;
}

// Test 9: Check file size
console.log('\n9️⃣  Checking file size...');
try {
  const stats = fs.statSync(jsonPath);
  const sizeKB = (stats.size / 1024).toFixed(2);
  console.log(`   ✅ File size: ${sizeKB} KB`);
  if (stats.size > 500 * 1024) {
    console.warn('   ⚠️  File is quite large (>500KB), but acceptable');
    warnings++;
  }
} catch (e) {
  console.error('   ❌ Error checking file size:', e.message);
  errors++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Test Summary:');
console.log(`   ✅ Passed: ${9 - errors - warnings}`);
if (warnings > 0) {
  console.log(`   ⚠️  Warnings: ${warnings}`);
}
if (errors > 0) {
  console.log(`   ❌ Errors: ${errors}`);
  console.log('\n❌ Tests failed! Please fix errors before committing.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed! Ready to commit.');
  process.exit(0);
}
