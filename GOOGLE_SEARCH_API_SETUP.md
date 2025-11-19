# Google Custom Search API Setup (FREE)

## Why Google Custom Search?

- ✅ **100 searches/day FREE** (3,000/month)
- ✅ Real Google search results
- ✅ Official API (won't get blocked)
- ✅ Much more reliable than DuckDuckGo scraping

## Step-by-Step Setup (5 minutes)

### Step 1: Get Google API Key

1. Go to: https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Click "Enable APIs and Services"
4. Search for "Custom Search API"
5. Click "Enable"
6. Go to "Credentials" tab
7. Click "Create Credentials" → "API Key"
8. Copy your API key (looks like: `AIzaSyB...`)

### Step 2: Create Search Engine ID

1. Go to: https://programmablesearchengine.google.com/
2. Click "Add" to create new search engine
3. Settings:
   - **Sites to search**: Leave empty (to search entire web)
   - **Name**: "EVAL-AI Plagiarism Checker"
4. Click "Create"
5. Copy your **Search Engine ID** (looks like: `a1b2c3d4e5f6g...`)

### Step 3: Configure in EVAL-AI

**For Local Development** (backend/.env):
```env
GOOGLE_SEARCH_API_KEY=AIzaSyB...
GOOGLE_SEARCH_ENGINE_ID=a1b2c3d4e5f6g...
```

**For Render Deployment**:
1. Go to Render dashboard: https://dashboard.render.com
2. Click your backend service
3. Go to "Environment" tab
4. Add environment variables:
   - `GOOGLE_SEARCH_API_KEY` = `AIzaSyB...`
   - `GOOGLE_SEARCH_ENGINE_ID` = `a1b2c3d4e5f6g...`
5. Click "Save Changes" (service will auto-redeploy)

### Step 4: Test

Submit an answer with copied content and internet check enabled. Render logs should show:
```
🔍 Searching Google Custom Search API...
✅ Found 5 Google results
   1. Wikipedia - Newton's Laws (similarity: 87.5%)
   2. Physics Classroom (similarity: 72.3%)
```

## Quota Management

**Free Tier**: 100 searches/day (resets at midnight Pacific Time)

**How EVAL-AI Uses Quota**:
- Checks **15 sentences per submission** (to preserve quota)
- Each submission = 15 searches used
- You can handle **~6-7 submissions per day** on free tier

**If Quota Exceeded**:
- System automatically falls back to DuckDuckGo + Wikipedia
- Error message: "Google API quota exceeded (100/day limit)"

## Upgrading (If Needed)

If you need more than 100/day:
- **Paid plan**: $5 per 1,000 additional queries
- **For 500 students** submitting weekly: ~$20/month

## Cost Comparison

| Solution | Cost | Accuracy |
|----------|------|----------|
| **DuckDuckGo** (scraping) | $0 | 60-70% (often blocked) |
| **Google Custom Search** (100/day) | $0 | 95%+ (official API) |
| **Google Custom Search** (unlimited) | $5/1000 | 95%+ |
| **SerpAPI** | $50/month | 98% |
| **Turnitin** | $3000/year | 99% |

## Troubleshooting

### "API not configured"
→ Check that both `GOOGLE_SEARCH_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID` are set in environment variables

### "Authentication failed"
→ API key is invalid. Generate a new one from Google Cloud Console

### "Quota exceeded"
→ You've used 100 searches today. Wait until midnight PT or upgrade to paid

### Still no results
→ The content might be genuinely original, or paraphrased beyond 30% similarity threshold

## Alternative: Keep DuckDuckGo Only

If you don't want to set up Google API:
- System will continue using DuckDuckGo + Wikipedia (free, but less reliable)
- No configuration needed
- Works out of the box but may miss some matches

