# SMAART Toolkit - Quick Testing Guide

## How to Test Each Tool

### 1. AI Career Chat
**URL:** `/dashboard/ai-career-coach/chat`

**Test Steps:**
1. Click "AI Career Chat" card from toolkit
2. Verify welcome message appears
3. Click a suggested question OR type your own
4. Press Enter or click Send
5. Verify AI response appears
6. Check loading indicator shows while waiting
7. Test back button → should return to toolkit

**Expected Behavior:**
- ✅ Chat interface loads
- ✅ Messages appear in conversation
- ✅ Timestamps show correctly
- ✅ Loading spinner during AI response
- ✅ Error handling if API fails

---

### 2. Profile Analysis
**URL:** `/dashboard/profile-analysis`

**Test Steps:**
1. Click "Profile Analysis" card
2. Fill in profile fields (name, email, skills, etc.)
3. Click "Save Profile"
4. Click "Analyze Profile" button
5. Wait for AI analysis
6. Try "Get Career Paths" button
7. Try "Skill Gap Analysis" with a target role
8. Try "Generate Learning Plan"

**Expected Behavior:**
- ✅ Form fields save correctly
- ✅ AI analysis generates insights
- ✅ Career paths display
- ✅ Skill gaps identified
- ✅ Learning plan created

---

### 3. Resume Builder
**URL:** `/dashboard/resume-builder`

**Test Steps:**
1. Click "SMAART AI Resume Builder" card
2. Enter a target role (e.g., "Software Engineer")
3. Click "Generate Resume"
4. Wait for AI to generate content
5. Click "Copy to Clipboard"
6. Paste in a text editor to verify

**Expected Behavior:**
- ✅ Resume generates based on profile
- ✅ Content is professional and ATS-optimized
- ✅ Copy to clipboard works
- ✅ Loading state shows during generation

---

### 4. Mind Care Sessions
**URL:** `/dashboard/mindcare-sessions`

**Test Steps:**
1. Click "Mind Care Sessions" card
2. Browse available sessions
3. View session details
4. Check if booking works (if implemented)

**Expected Behavior:**
- ✅ Sessions list displays
- ✅ Details are readable
- ✅ UI is calming and professional

---

### 5. Library
**URL:** `/dashboard/library`

**Test Steps:**
1. Click "Library" card
2. Browse resources
3. Use search if available
4. Filter by category if available
5. Click on a resource

**Expected Behavior:**
- ✅ Resources display correctly
- ✅ Search works
- ✅ Filters work
- ✅ Resource details accessible

---

### 6. General Dictionary
**URL:** `/dashboard/dictionary`

**Test Steps:**
1. Click "General Dictionary" card
2. Search for a term
3. View definition
4. Try multiple searches

**Expected Behavior:**
- ✅ Search works
- ✅ Definitions display
- ✅ Navigation is smooth

---

## Common Issues & Solutions

### Issue: "Failed to send message"
**Cause:** AI API not configured or out of credits  
**Solution:** Check backend .env for OPENROUTER_API_KEY

### Issue: "Session expired"
**Cause:** JWT token expired  
**Solution:** Log out and log back in

### Issue: Blank page
**Cause:** JavaScript error  
**Solution:** Check browser console (F12)

### Issue: Slow loading
**Cause:** Large AI response or slow network  
**Solution:** Normal - AI responses can take 5-10 seconds

---

## Browser Console Commands

### Check if user is authenticated
```javascript
console.log(sessionStorage.getItem('token'));
console.log(sessionStorage.getItem('user'));
```

### Clear session (force logout)
```javascript
sessionStorage.clear();
localStorage.clear();
window.location.href = '/';
```

### Check API base URL
```javascript
console.log(import.meta.env.VITE_API_URL);
```

---

## Quick Verification Checklist

### Visual Check
- [ ] All 6 cards display on toolkit page
- [ ] Icons show correctly
- [ ] Gradients render properly
- [ ] Hover effects work
- [ ] Text is readable
- [ ] Dark mode works

### Functional Check
- [ ] All cards are clickable
- [ ] Navigation works
- [ ] Back buttons work
- [ ] Forms submit
- [ ] AI responses generate
- [ ] Loading states show
- [ ] Errors display properly

### Responsive Check
- [ ] Mobile view (< 768px): 1 column
- [ ] Tablet view (768-1024px): 2 columns
- [ ] Desktop view (> 1024px): 3 columns
- [ ] All buttons accessible on mobile
- [ ] Text readable on all sizes

---

## Performance Benchmarks

### Expected Load Times
- **Toolkit Page:** < 1 second
- **Individual Tools:** < 2 seconds
- **AI Response:** 5-15 seconds (normal)

### If Slower
1. Check network tab in DevTools
2. Look for failed requests
3. Check bundle sizes
4. Verify backend is running

---

## Testing on Different Devices

### Desktop (1920x1080)
- 3-column grid
- Full hover effects
- All features visible

### Tablet (768x1024)
- 2-column grid
- Touch-friendly buttons
- Responsive layout

### Mobile (375x667)
- 1-column grid
- Larger touch targets
- Simplified navigation

---

## Automated Testing (Optional)

### Using Browser DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Click a toolkit card
4. Verify:
   - Status 200 for API calls
   - No 404 errors
   - No console errors

### Using Lighthouse
1. Open DevTools
2. Go to Lighthouse tab
3. Run audit
4. Check scores:
   - Performance: > 90
   - Accessibility: > 90
   - Best Practices: > 90

---

## Success Criteria

### All Tests Pass ✅
- Navigation works
- AI features functional
- No console errors
- Responsive on all devices
- Dark mode works
- Loading states show
- Error handling works

### Ready for Production!

---

*Quick testing guide for SMAART Toolkit*  
*Last updated: February 10, 2026*
