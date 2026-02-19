# SMAART Minds Backend PRD

## Overview
SMAART Minds is an educational platform. The backend provides APIs for user authentication, registration, and course management.

## Tech Stack
-   **Language:** Node.js
-   **Framework:** Express
-   **Database:** MongoDB with Mongoose ODM

## Features

### 1. User Authentication
Users can register and login using their email. Authentication is secured using JWT and OTP verification.
-   **Signup:** Sending OTP to email, verifying OTP, and creating a registration record.
-   **Login:** verifying credentials, sending OTP, and verifying OTP to receive a token.

### 2. Registration Management
Comprehensive user registration with multiple sections (Personal, Academic, Documents, etc.).
-   **Save Details:** Endpoint to save all 11 sections of the registration form.
-   **Progressive Save:** Endpoint to save individual sections as the user completes them.
-   **Retrieval:** Fetching registration data by email.

## API Endpoints

### Auth
-   `POST /api/auth/send-signup-otp`
-   `POST /api/auth/verify-signup-otp`
-   `POST /api/auth/register`
-   `POST /api/auth/login`
-   `POST /api/auth/verify-login-otp`

### Users
-   `POST /api/users/register-details`
-   `PATCH /api/users/register-section`
-   `GET /api/users/register-details/:email`
