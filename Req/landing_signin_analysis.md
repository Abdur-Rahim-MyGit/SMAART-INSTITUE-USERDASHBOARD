# Requirements vs Implementation Analysis

Based on the Master Business Requirements Document (BRD) and Functional Screen Specification (FSS) provided, I've conducted an analysis of the Landing page, Sign-in page, and College section page. 

Here are the discrepancies and potential issues found between the implementation and the documented requirements:

## 1. Landing Page (`/front-end/src/pages/LandingPage.jsx`)
* **Institution Modal Auto-Trigger:**
  * **Requirement (FSS STU-001):** The Institution Selection Modal is supposed to "auto-trigger on page load" for first-time visitors or when clicking "Get Started".
  * **Current Code:** The modal only auto-opens if the URL contains a query parameter `?modal=true`. Otherwise, it relies solely on user clicks (`onLoginClick` or `onSignupClick`).
* **Routing After Institution Selection:**
  * **Requirement (FSS STU-001):** After selecting an institution and clicking "Confirm", the system should store the institution code/name in `sessionStorage` and redirect the user to the generic `/login` route (STU-002).
  * **Current Code:** The code navigates the user to a dynamic route `/institution/:id` (e.g., `/institution/CollegeName`) instead of `/login`.

## 2. Sign-in Page & College Section (`/front-end/src/pages/Institution.jsx`)
* **Missing `/login` Route:**
  * **Requirement (FSS STU-002):** There should be a dedicated `/login` route that reads the selected institution from `sessionStorage` and displays the login form alongside the institution name.
  * **Current Code:** There is no `/login` route in your `AnimatedRoutes.jsx`. Instead, the application relies entirely on the `/institution/:id` route to serve as the login portal for the selected college. 
* **College Section Display:**
  * **Current Code:** The `Institution.jsx` page acts as both the "College Section" (displaying the college's chairman video and welcome message) and the "Sign-in Page" (rendering the `<LoginCard />`). 
  * **Implication:** While this creates a highly customized experience per college (which is great!), it deviates from the strictly defined flow in the FSS. If the FSS is the canonical source of truth, this flow modification needs to be formally approved or the code needs to be refactored to use a centralized `/login` route.

## 3. Login Flow & State Handling
* **"Remember Me" Checkbox:**
  * **Requirement:** FSS notes a known bug (TASK-16) where "Remember Me" currently stores in `sessionStorage` instead of `localStorage`. 
  * **Current Code:** While we haven't inspected the exact `LoginCard.jsx` implementation, the `Institution.jsx` page redirects logged-in users directly to `/dashboard` based on `sessionStorage.getItem("user")`. You may want to verify that `LoginCard.jsx` properly handles `localStorage` for the "Remember Me" functionality.
* **OTP Verification Route:**
  * **Requirement (FSS STU-003):** After entering credentials, the system should navigate to `/otp-verify`.
  * **Current Code:** `AnimatedRoutes.jsx` *does* have a `/verify-otp` route, so this aligns well, but the route naming is slightly different (`/verify-otp` vs `/otp-verify`).

## Summary of Actionable Items
1. **Decide on the Login Architecture:** Either update the BRD/FSS to reflect the new dynamic `/institution/:id` login flow, or refactor the frontend to use a centralized `/login` route that reads the college from session storage.
2. **Landing Page Modal:** Update `LandingPage.jsx` to automatically open the Institution Selection Modal on the first visit if the user hasn't selected a college yet, aligning with the FSS.
3. **Route Name Alignment:** Ensure all route names (like `/verify-otp`) exactly match the specifications in the FSS to prevent confusion during QA testing.
