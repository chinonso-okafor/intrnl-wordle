# Testing Guide - Validation Words JSON Implementation

This guide helps you test the validation words JSON implementation before committing.

## Quick Test

Run the automated test script:

```bash
npm run test:words
```

This will verify:
- ✅ JSON file exists and is valid
- ✅ Word count meets 12,000+ requirement
- ✅ All words are 5-letter uppercase strings
- ✅ No duplicates
- ✅ JSON loads correctly
- ✅ Common words are present
- ✅ File size is reasonable

## Manual Testing Steps

### 1. Test JSON File Structure

```bash
# Check file exists
ls -lh lib/curated-validation-words.json

# Verify it's valid JSON
node -e "console.log(JSON.parse(require('fs').readFileSync('lib/curated-validation-words.json', 'utf-8')).length)"
```

Expected output: Should show the word count (should be ~11,848).

### 2. Test Seed Scripts

#### Test Main Seed Script

```bash
# Make sure you have a test database or use a local dev database
npm run db:seed
```

Expected output:
- Should seed answer words (~3,314)
- Should seed validation words (~11,848, minus overlaps)
- Should create admin and test users
- Should set today's word

#### Test Smart Seed Script

```bash
npx tsx scripts/smart-seed.ts
```

Expected output:
- Should clear existing words
- Should seed all words successfully
- Should show progress for each chunk

### 3. Test Word Validation

Create a test file `test-word-validation.js`:

```javascript
const { isValidWordSync } = require('./lib/words');

// Test valid words
const validWords = ['APPLE', 'HOUSE', 'WORLD', 'HELLO', 'MUSIC'];
validWords.forEach(word => {
  if (!isValidWordSync(word)) {
    console.error(`❌ ${word} should be valid but isn't`);
  } else {
    console.log(`✅ ${word} is valid`);
  }
});

// Test invalid words
const invalidWords = ['ABCDE', 'XXXXX', '12345', 'APPLEE'];
invalidWords.forEach(word => {
  if (isValidWordSync(word)) {
    console.error(`❌ ${word} should be invalid but is valid`);
  } else {
    console.log(`✅ ${word} is correctly invalid`);
  }
});
```

Run it:
```bash
node test-word-validation.js
```

### 4. Test Database Integration

#### Check Database After Seeding

```bash
# Open Prisma Studio
npm run db:studio
```

Navigate to:
- `ValidationWord` table - should have ~11,848+ words
- `AnswerWord` table - should have ~3,314 words
- Verify no duplicates

#### Test API Endpoints

Start the dev server:
```bash
npm run dev
```

Test word validation via API:
```bash
# Test valid word
curl -X POST http://localhost:3000/api/game/submit \
  -H "Content-Type: application/json" \
  -d '{"guess": "APPLE"}' \
  -b "your-session-cookie"

# Test invalid word
curl -X POST http://localhost:3000/api/game/submit \
  -H "Content-Type: application/json" \
  -d '{"guess": "XXXXX"}' \
  -b "your-session-cookie"
```

### 5. Test TypeScript Compilation

```bash
# Build the project
npm run build
```

This will catch any TypeScript errors in:
- `prisma/seed.ts`
- `scripts/smart-seed.ts`
- `lib/words.ts`

### 6. Test Runtime Loading

Test that the JSON loads correctly at runtime:

```bash
# Start dev server
npm run dev

# In another terminal, test the game page
# Try entering various words and verify validation works
```

## Pre-Commit Checklist

Before committing, verify:

- [ ] `npm run test:words` passes
- [ ] `npm run build` succeeds (no TypeScript errors)
- [ ] `npm run db:seed` runs successfully
- [ ] JSON file has 12,000+ words
- [ ] All words are 5-letter uppercase
- [ ] No duplicates in JSON
- [ ] Database seeding works correctly
- [ ] Word validation works in the game

## Troubleshooting

### JSON file not found
- Check that `lib/curated-validation-words.json` exists
- Verify the path in `lib/words.ts` is correct

### TypeScript errors
- Make sure `fs` and `path` are imported correctly
- Check that JSON parsing is wrapped in try-catch if needed

### Database seeding fails
- Check database connection
- Verify Prisma schema is up to date: `npx prisma generate`
- Check for unique constraint violations (duplicates)

### Word validation not working
- Verify JSON file is being loaded correctly
- Check that `isValidWordSync` function works
- Test with known valid/invalid words

## Cleanup After Testing

If you created test files, remove them:

```bash
rm -f test-word-validation.js
```
