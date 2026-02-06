# Resources Page Fix

**Date**: December 4, 2025 - 7:50 PM IST  
**Objective**: Fix the issue where recommendations were not appearing on the Resources page.  
**Status**: ✅ FIXED

---

## 🔍 Root Cause Analysis
1.  **JSON Parsing Fragility**: The AI backend (`aiAgent.js`) was using a strict JSON parser that could fail if the AI included any text outside the JSON block (e.g., "Here is your plan: ...").
2.  **Frontend Empty State**: If the parsing failed, it threw an error, or if it returned null, the frontend showed a generic "No Resources" message without a way to retry.

## 🛠️ The Fix

### 1. **Robust Backend Parsing** (`aiAgent.js`)
- **Regex Extraction**: Updated `parseJSON` to use Regex (`/\{[\s\S]*\}/`) to find and extract the JSON object from *any* surrounding text.
- **Safe Fallback**: If parsing still fails, it now returns a safe empty structure (`{ courses: [], ... }`) instead of crashing the server or throwing a 500 error.

### 2. **Frontend UX Improvement** (`Resources.js`)
- **Retry Mechanism**: Added a **"Try Again"** button to the "No Resources" screen.
- **Better Guidance**: Updated the message to suggest retrying or updating the profile.

## 🚀 How to Verify
1.  **Go to `/resources`**.
2.  If you see resources, great! The parsing worked.
3.  If you see "No Resources Available Yet", click **"Try Again"**. This re-triggers the AI generation.
4.  If it persists, go to `/profile` and ensure you have **Target Roles** and **Skills** listed, as the AI needs these to generate content.
