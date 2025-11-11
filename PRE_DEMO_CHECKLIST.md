# ✅ EVAL-AI Pre-Demo Checklist
## Before Your BTech Project Presentation

---

## 🔧 **TECHNICAL SETUP** (Day Before Demo)

### **Backend**
- [ ] Navigate to `backend/` folder
- [ ] Run `npm install --legacy-peer-deps` (if not done)
- [ ] Verify `.env` file has:
  ```
  GOOGLE_API_KEY=your_actual_key
  FIREBASE_SERVICE_ACCOUNT_PATH=path_to_json
  PORT=5000
  ```
- [ ] Test backend: `npm start`
- [ ] Verify console shows:
  ```
  ✨ Custom Gen AI modules initialized successfully.
     - Multi-Agent Evaluation System
     - Plagiarism Detection
     - Explainable AI
     - RAG-Enhanced Grading
  ```
- [ ] Keep backend running

### **Frontend**
- [ ] Navigate to `frontend_new/` folder
- [ ] Run `npm install` (if not done)
- [ ] Verify `src/services/firebase.ts` has correct Firebase config
- [ ] Test frontend: `npm run dev`
- [ ] Open browser to `http://localhost:5173`
- [ ] Verify no console errors
- [ ] Keep frontend running

### **Database**
- [ ] Firebase Console: Check Firestore has data
- [ ] Verify at least 1 test subject exists
- [ ] Verify at least 1 test assignment exists
- [ ] Verify test accounts exist (student + teacher)

---

## 📝 **CONTENT PREPARATION** (Day Before Demo)

### **Test Files**
- [ ] Prepare 2-3 sample homework files:
  - [ ] One clean submission (low plagiarism)
  - [ ] One with some similar content (medium plagiarism)
  - [ ] One well-written (high score expected)
- [ ] Name them clearly: `sample_homework_1.pdf`, etc.
- [ ] Keep on Desktop for easy access

### **Test Accounts**
- [ ] Create/verify student account:
  ```
  Email: student@test.com
  Password: [write it down]
  ```
- [ ] Create/verify teacher account:
  ```
  Email: teacher@test.com
  Password: [write it down]
  ```
- [ ] Test login for both accounts

### **Pre-Submit Test Submission** (Optional but Recommended)
- [ ] Log in as student
- [ ] Submit one test assignment with ALL features enabled
- [ ] Wait for processing (30-45 seconds)
- [ ] Verify all tabs appear:
  - [ ] Evaluation tab
  - [ ] Multi-Agent tab
  - [ ] Plagiarism tab
  - [ ] Explainability tab
  - [ ] Comments tab
- [ ] Log in as teacher
- [ ] Verify submission appears with badges
- [ ] Open modal and check all tabs work

---

## 💻 **DEMO DAY SETUP** (1 Hour Before)

### **Computer Setup**
- [ ] Charge laptop to 100%
- [ ] Bring charger as backup
- [ ] Close ALL unnecessary apps/tabs
- [ ] Disable notifications (DND mode)
- [ ] Set screen brightness to 80-100%
- [ ] Test projector/screen mirroring (if applicable)

### **Browser Setup**
- [ ] Use Chrome/Firefox (tested browsers)
- [ ] Clear cache and cookies
- [ ] Open in Incognito/Private mode (clean slate)
- [ ] Bookmark: `http://localhost:5173`
- [ ] Pre-open 2 browser windows:
  - Window 1: Student account (logged in)
  - Window 2: Teacher account (logged in)
- [ ] Close ALL other tabs

### **Terminal Windows**
- [ ] Terminal 1: Backend running (`npm start`)
- [ ] Terminal 2: Frontend running (`npm run dev`)
- [ ] (Optional) Terminal 3: Backend logs visible
- [ ] Arrange terminals for easy monitoring

### **Documentation Ready**
- [ ] Open `DEMO_SCRIPT.md` on phone/tablet
- [ ] Have architecture diagram ready (printed or separate screen)
- [ ] Open GitHub repo in browser tab
- [ ] Have `FINAL_PROJECT_SHOWCASE.md` accessible

---

## 🎬 **DEMO FLOW TEST** (30 Minutes Before)

### **Quick Walkthrough**
- [ ] **Slide 1**: Landing page - show UI
- [ ] **Slide 2**: Login as student
- [ ] **Slide 3**: Navigate to Submit Assignment
- [ ] **Slide 4**: Show Enhanced Features toggles
- [ ] **Slide 5**: Upload file + submit
- [ ] **Slide 6**: While processing, explain architecture
- [ ] **Slide 7**: View History page with badges
- [ ] **Slide 8**: Open submission modal
- [ ] **Slide 9**: Tab through all features:
  - Evaluation
  - Multi-Agent ⭐
  - Plagiarism ⭐
  - Explainability ⭐
- [ ] **Slide 10**: [Optional] Switch to teacher view
- [ ] **Slide 11**: Show table with badges
- [ ] **Slide 12**: Q&A

### **Timing Check**
- [ ] Practice full demo: Should be ~4-5 minutes
- [ ] Leave 1-2 minutes for questions
- [ ] Identify sections you can skip if running short on time

---

## 📊 **BACKUP PLAN**

### **If Backend Crashes**
- [ ] Have screenshots ready of:
  - [ ] Multi-agent breakdown
  - [ ] Plagiarism report
  - [ ] Explainability chain-of-thought
  - [ ] Enhanced badges
- [ ] Have recorded video demo (optional)

### **If Internet Down**
- [ ] Firebase works offline for reads (mostly)
- [ ] Explain: "Would normally process here..."
- [ ] Show pre-submitted example

### **If Projector Issues**
- [ ] Have backup laptop
- [ ] Can demo on own screen with judges nearby
- [ ] Have printed screenshots as last resort

---

## 🎤 **PRESENTATION MATERIALS**

### **Physical Items**
- [ ] Laptop (charged)
- [ ] Charger
- [ ] Mouse (optional, for smoother navigation)
- [ ] Phone with demo script
- [ ] Water bottle
- [ ] Notepad + pen (for questions)

### **Digital Items**
- [ ] `DEMO_SCRIPT.md` open on phone
- [ ] Architecture diagram accessible
- [ ] GitHub repo link ready
- [ ] Contact info slide (if needed)

---

## 🗣️ **REHEARSAL CHECKLIST**

### **Practice These Lines**
- [ ] Opening: "EVAL-AI is an advanced AI-powered homework evaluation platform..."
- [ ] Problem: "Teachers spend hours grading, existing tools are black boxes..."
- [ ] Solution: "We built 4 proprietary Gen AI features..."
- [ ] Differentiator: "This is NOT an API wrapper - we implemented custom algorithms..."
- [ ] Technical: "Multi-agent orchestration via Langchain, 5-algorithm plagiarism, ChromaDB vector database..."
- [ ] Closing: "Thank you! Happy to answer questions."

### **Prepare Answers For**
- [ ] "Why not just use ChatGPT?"
- [ ] "How accurate is plagiarism detection?"
- [ ] "What's the cost per evaluation?"
- [ ] "Can teachers override AI scores?"
- [ ] "Is this scalable?"
- [ ] "How is this different from Turnitin?"

---

## 🎯 **CONFIDENCE BUILDERS**

### **Remember**
✅ You built **4 major Gen AI features** from scratch
✅ This is **not an API wrapper** - you wrote custom algorithms
✅ You have **production-quality code** with zero linter errors
✅ Your **documentation is research-grade**
✅ The **UI is polished and professional**
✅ You understand **every line of code**

### **You Can Explain**
- How multi-agent consensus works
- Each of the 5 plagiarism algorithms
- The explainability chain-of-thought process
- RAG integration with ChromaDB
- Full-stack architecture
- Technology choices and trade-offs

---

## 📸 **SCREENSHOTS TO TAKE** (Optional)

For backup or portfolio:
- [ ] Landing page
- [ ] Enhanced features toggle panel
- [ ] Multi-agent breakdown
- [ ] Plagiarism report with heatmap
- [ ] Explainability chain-of-thought
- [ ] History page with badges
- [ ] Teacher table view with badges
- [ ] Tabbed modal showing all tabs

---

## 🚨 **RED FLAGS TO AVOID**

### **Don't Say**
- ❌ "This is just a wrapper around ChatGPT"
- ❌ "I'm not sure how this part works"
- ❌ "We didn't have time to implement X"
- ❌ "There might be some bugs"
- ❌ "This was mostly copied from tutorials"

### **Do Say**
- ✅ "We implemented custom algorithms using Langchain"
- ✅ "Our 5-algorithm system provides multi-perspective plagiarism detection"
- ✅ "We built this from scratch with production-quality code"
- ✅ "All our custom modules are thoroughly documented"
- ✅ "We have research-grade technical documentation"

---

## ⏰ **TIMELINE**

### **T-1 Day** (Night Before)
- [ ] Complete technical setup
- [ ] Test full demo flow
- [ ] Prepare backup files
- [ ] Get good sleep! 😴

### **T-2 Hours** (Morning of Demo)
- [ ] Review demo script
- [ ] Practice talking points
- [ ] Eat a good meal
- [ ] Arrive early to venue

### **T-1 Hour**
- [ ] Set up computer
- [ ] Test projector
- [ ] Start backend + frontend
- [ ] Login to both accounts
- [ ] Do one quick walkthrough

### **T-10 Minutes**
- [ ] Close unnecessary apps
- [ ] Silence phone
- [ ] Take deep breaths
- [ ] Review opening line
- [ ] You've got this! 💪

---

## 🎊 **POST-DEMO**

### **After Presenting**
- [ ] Thank judges/audience
- [ ] Collect feedback
- [ ] Take photos with team
- [ ] Celebrate! 🎉

### **For Portfolio**
- [ ] Add to resume
- [ ] Create GitHub README
- [ ] Write LinkedIn post
- [ ] Record demo video for portfolio
- [ ] Get recommendation letters

---

<div align="center">

# 🌟 YOU'RE READY! 🌟

## **This is your moment to shine.**

### All the hard work has been done.
### The code is solid.
### The UI is beautiful.
### The features are impressive.

## **Trust yourself. You've got this! 🚀**

</div>

---

## 📞 **Emergency Contacts** (Write These Down)

- **Project Partner**: [Phone Number]
- **Mentor/Guide**: [Phone Number]
- **IT Support**: [If available]
- **Backup Person**: [Who can help if needed]

---

## ✅ **FINAL CHECK** (5 Minutes Before)

1. [ ] Backend running? (`http://localhost:5000`)
2. [ ] Frontend running? (`http://localhost:5173`)
3. [ ] Student account logged in?
4. [ ] Teacher account logged in?
5. [ ] Sample files on Desktop?
6. [ ] Demo script accessible?
7. [ ] Notifications disabled?
8. [ ] Deep breath taken? 😊

---

**STATUS**: ⏳ Ready to impress!

**NEXT STEP**: Knock their socks off! 🎤🔥

