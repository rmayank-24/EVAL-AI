# 🧪 Testing Guide - Production Plagiarism Detection

## Choose Your Testing Environment

### Option A: Test in Production (Recommended - See Real Deployment)
### Option B: Test Locally (If you want to debug)

---

## 🌐 OPTION A: Testing in Production

### Step 1: Wait for Deployment (5-10 minutes)

**Check if Backend is Ready:**
```bash
# Open your browser and visit:
https://your-backend-url.onrender.com/

# You should see:
"Service running on port 10000"
```

**Check if Frontend is Ready:**
```bash
# Visit your Vercel URL:
https://your-frontend-url.vercel.app/

# Should show the EVAL-AI landing page
```

---

### Step 2: Login to Your App

1. **Open your Vercel URL** in browser
2. **Click "Login"**
3. **Use existing student account** or create new one
4. Should land on **Dashboard**

---

### Step 3: Navigate to Submit Assignment

1. From Dashboard, click **"Submit Assignment"**
2. Or use the menu to navigate there

You should now see the submission form!

---

### Step 4: Look for NEW Features ✨

**You should see:**

```
Enhanced Features Section:

☑ 🤖 Multi-Agent Evaluation
☑ 🔍 Plagiarism Detection
    ↳ ☐ 🌐 Internet Plagiarism Check [FREE] ← NEW!
☑ 💡 Explainable AI
☐ ⚖️ Strict Mode
```

**The green "FREE" badge confirms it's working!**

---

### Step 5: Test Internet Plagiarism Detection

#### A. Prepare Test Content

**Copy this Wikipedia content** (guaranteed to find matches):

```
Python is a high-level, general-purpose programming language. 
Its design philosophy emphasizes code readability with the use 
of significant indentation. Python is dynamically typed and 
garbage-collected. It supports multiple programming paradigms, 
including structured, object-oriented and functional programming. 
Python was conceived in the late 1980s by Guido van Rossum at 
Centrum Wiskunde & Informatica in the Netherlands as a successor 
to the ABC programming language. Python 2.0 was released in 2000 
and introduced new features such as list comprehensions and a 
garbage collection system. Python 3.0 was released in 2008 and 
was a major revision not completely backward-compatible with 
earlier versions.
```

#### B. Submit the Assignment

1. **Select Subject** (any subject)
2. **Select Assignment** (any assignment)
3. **Paste the Wikipedia text** in the answer field OR upload as file
4. **Check these boxes:**
   - ✅ "🔍 Plagiarism Detection"
   - ✅ "🌐 Internet Plagiarism Check" ← IMPORTANT!
5. **Click "Submit"**

**Wait time:** 45-60 seconds (longer due to internet check)

---

### Step 6: View the Results

Once submission completes:

1. **Go to "History"** or **"My Submissions"**
2. **Find your latest submission**
3. **Click to open details**

**You should see badges:**
```
🤖 Multi-Agent
🔍 Plagiarism
🌐 Internet ← NEW!
💡 Explainable
```

---

### Step 7: Check the Plagiarism Report (6 TABS!)

Click on the **Plagiarism tab** (🔍)

**You should see 6 tabs:**
1. **Overview** - Overall scores
2. **Matches** - Student submissions matched
3. **🌐 Internet** ← NEW TAB! Click this!
4. **Citations** - Quote analysis
5. **Style** - Writing consistency
6. **Timeline** - Who copied from whom

---

### Step 8: Verify Internet Tab ✨

**Click the "Internet" tab**

**If Wikipedia content was detected, you'll see:**

```
Internet Sources Found (2-5 matches typically)

Moderate Internet Plagiarism
Found 3 potential internet sources.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Match 1:

Sentence from submission:
"Python is a high-level, general-purpose programming language."

Found in 2 source(s):

→ Python (programming language) - Wikipedia
  https://en.wikipedia.org/wiki/Python_(programming_language)
  [CLICKABLE LINK]
  
  Snippet: "Python is a high-level, general-purpose..."
  
  92% match | High confidence

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**TEST THE LINK:**
- **Click the Wikipedia link**
- Should open in new tab
- Confirms it's real plagiarism detection!

---

### Step 9: Test Without Internet Check

**Now test normal plagiarism only:**

1. Submit another assignment
2. ✅ Check "Plagiarism Detection"
3. ❌ **DON'T** check "Internet Plagiarism Check"
4. Submit

**Result:**
- Faster (10-30 seconds)
- Only checks against student submissions
- Internet tab will show: "Internet Check Not Enabled"

---

## 💻 OPTION B: Testing Locally

### Step 1: Start Backend

```bash
cd backend
npm start

# Wait for:
✅ "Service running on port 8000"
✅ "Advanced Plagiarism Detection (Production-Grade)"
```

### Step 2: Start Frontend (New Terminal)

```bash
cd frontend_new
npm run dev

# Wait for:
✅ "Local: http://localhost:5173"
```

### Step 3: Open Browser

Visit: `http://localhost:5173`

### Step 4: Follow Same Testing Steps

Follow Steps 2-9 from Option A above, but use:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000`

---

## 🎯 What to Verify

### ✅ Checklist:

**Frontend UI:**
- [ ] Internet check toggle appears
- [ ] Green "FREE" badge visible
- [ ] Toggle only shows when plagiarism is checked
- [ ] Can check/uncheck it

**Submission Process:**
- [ ] Submission works with internet check enabled
- [ ] Takes 45-60 seconds (longer than before)
- [ ] No errors in submission

**Results Display:**
- [ ] Submission shows internet badge (🌐)
- [ ] Plagiarism report has 6 tabs (not 5)
- [ ] Internet tab is 3rd tab
- [ ] Internet tab content loads

**Internet Tab Content (if matches found):**
- [ ] Shows "Internet Sources Found"
- [ ] Displays matched sentences
- [ ] Shows source titles
- [ ] **Links are clickable** ← IMPORTANT!
- [ ] Opens actual Wikipedia/source pages
- [ ] Shows similarity percentages
- [ ] Shows confidence levels

**Internet Tab (if no matches):**
- [ ] Shows "No Internet Sources Found" with green checkmark
- [ ] Message: "The content does not match any sources..."
- [ ] This is GOOD (means original work or smart filtering)

---

## 🔍 Troubleshooting

### "Internet" Tab Not Showing

**Cause:** Frontend not updated  
**Fix:**
```bash
# Hard refresh browser
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)

# Or clear cache and reload
```

### Internet Check Toggle Not Visible

**Cause:** JavaScript not loaded  
**Fix:**
```bash
# Check browser console (F12)
# Look for errors
# Refresh page
```

### "Internet Check Not Enabled" Message

**Cause:** You didn't check the toggle when submitting  
**Fix:**
```bash
Submit again with internet check enabled!
```

### No Internet Matches Found (But Used Wikipedia Content)

**Possible Reasons:**

1. **DuckDuckGo rate limiting** (wait 5 minutes, try again)
2. **Text too short** (use 100+ words)
3. **Network issues** (check internet connection)
4. **Smart filtering** (content not unique enough)

**This is NORMAL** - the system is smart and filters false positives!

**Try with:**
- Longer text (200+ words)
- More specific content
- Multiple paragraphs from Wikipedia

---

## 🎮 Advanced Testing

### Test 1: Exact Wikipedia Copy

**Content:** Direct copy from Wikipedia Python article (provided above)  
**Expected:** High matches, clickable Wikipedia links  
**Result:** Should find 2-5 sources

### Test 2: Paraphrased Content

**Content:** "Python, a programming language at a high level, focuses on making code easy to read through its use of indentation."  
**Expected:** Moderate matches (semantic similarity)  
**Result:** May find 1-2 sources

### Test 3: Original Content

**Content:** "In this essay, I will discuss my personal experience learning to code. When I first started, I found it challenging but rewarding."  
**Expected:** No matches  
**Result:** "No Internet Sources Found" (green checkmark)

### Test 4: Mixed Content

**Content:** Mix original writing with Wikipedia sentences  
**Expected:** Partial matches, shows which sentences are plagiarized  
**Result:** Some sentences match, others don't

---

## 📊 Understanding Results

### High Internet Plagiarism (Red)
```
Score: 70%+
Verdict: "High Internet Plagiarism Risk"
Action: Review required
Means: Significant content from internet sources
```

### Moderate (Orange)
```
Score: 30-69%
Verdict: "Moderate Internet Plagiarism"
Action: Review recommended
Means: Some internet sources, may be acceptable with citations
```

### Low (Yellow/Green)
```
Score: 0-29%
Verdict: "No/Low Internet Match"
Action: No action needed
Means: Original work or common knowledge
```

---

## 🎓 Demo Testing Script

### Quick 5-Minute Test:

**Minute 1:** Open app, login  
**Minute 2:** Navigate to submit, check internet toggle  
**Minute 3:** Paste Wikipedia text, submit  
**Minute 4:** Wait for processing  
**Minute 5:** Open results, click Internet tab, click source link  

**Say:** "In 5 minutes, we detected Wikipedia plagiarism with clickable proof!"

---

## 📱 Mobile Testing

If testing on mobile:
1. Open your Vercel URL on phone
2. Same steps apply
3. Links should open in mobile browser
4. Interface is responsive

---

## 🎯 Success Criteria

**Your system is working if:**

✅ Internet check toggle appears with FREE badge  
✅ Submission completes in 45-60 seconds  
✅ Plagiarism report has 6 tabs (not 5)  
✅ Internet tab shows results OR "not enabled" message  
✅ Links are clickable and open actual sources  
✅ Wikipedia content finds matches  
✅ Original content shows no matches  

---

## 📞 Quick Commands

### Check Backend Status:
```bash
# In browser:
https://your-backend.onrender.com/

# Or curl:
curl https://your-backend.onrender.com/
```

### Check Frontend:
```bash
# Just open:
https://your-frontend.vercel.app/
```

### Check Logs (if deployed):
```bash
# Render:
https://dashboard.render.com/ → Your Service → Logs

# Vercel:
https://vercel.com/dashboard → Your Project → Deployment → Logs
```

---

## ⏰ When to Test

### Best Time:
- **5-10 minutes after** you pushed to GitHub
- Gives time for deployments to complete
- Both Render and Vercel will be ready

### Check Deployment Status:
```bash
Render: https://dashboard.render.com/
Vercel: https://vercel.com/dashboard

Look for green "Live" status
```

---

## 🎉 Expected Experience

**Good User Experience:**
```
1. See toggle with FREE badge ✨
2. Enable internet check
3. Submit assignment
4. Wait ~60 seconds (with loading indicator)
5. See results with 6 tabs
6. Click Internet tab
7. See actual sources with clickable links
8. Click link → Opens Wikipedia/source
9. Verify it's the actual source
10. Impressed! 🎉
```

---

## 💡 Pro Tips

1. **Use Wikipedia content** for guaranteed matches
2. **Try different topics** (Python, Machine Learning, etc.)
3. **Test with 100+ words** for best results
4. **Click the source links** to verify they're real
5. **Show this to others** - the clickable links are impressive!
6. **Compare with/without internet check** to see the difference
7. **Time the processing** - should be under 60 seconds

---

## 🚀 Quick Start (TL;DR)

```bash
1. Wait 10 minutes after push
2. Open your Vercel URL
3. Login → Submit Assignment
4. Check "Plagiarism Detection"
5. Check "Internet Plagiarism Check" (NEW!)
6. Paste Wikipedia Python text
7. Submit and wait 60 seconds
8. View results → Internet tab
9. Click Wikipedia link
10. Success! 🎉
```

---

**Ready to test? Open your app now!** 🚀

*If deployments are still in progress, wait 5-10 more minutes and try again.*

