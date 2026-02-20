
# TestSprite AI Testing Report(MCP)

---

## 1️⃣ Document Metadata
- **Project Name:** SMAART-INSTITUE-USERDASHBOARD
- **Date:** 2026-02-19
- **Prepared by:** TestSprite AI Team

---

## 2️⃣ Requirement Validation Summary

#### Test TC001 post api auth send signup otp with valid email
- **Test Code:** [TC001_post_api_auth_send_signup_otp_with_valid_email.py](./TC001_post_api_auth_send_signup_otp_with_valid_email.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 30, in <module>
  File "<string>", line 17, in test_post_api_auth_send_signup_otp_with_valid_email
AssertionError: Expected status 200, got 400

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/75fd56f8-70f7-4872-90cb-67bff06e8f37/19a06ad4-eb6a-4292-a440-6695392aa3be
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC002 post api auth send signup otp with invalid email format
- **Test Code:** [TC002_post_api_auth_send_signup_otp_with_invalid_email_format.py](./TC002_post_api_auth_send_signup_otp_with_invalid_email_format.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 26, in <module>
  File "<string>", line 23, in test_post_api_auth_send_signup_otp_with_invalid_email_format
AssertionError: Expected validation error about invalid email format but got: {'error': 'Email and full name are required'}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/75fd56f8-70f7-4872-90cb-67bff06e8f37/5e33a9a4-748e-4dec-b36d-3e24d40f631e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC003 post api auth verify signup otp with correct otp
- **Test Code:** [TC003_post_api_auth_verify_signup_otp_with_correct_otp.py](./TC003_post_api_auth_verify_signup_otp_with_correct_otp.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 41, in <module>
  File "<string>", line 17, in test_post_api_auth_verify_signup_otp_with_correct_otp
AssertionError: Expected 200 on send-signup-otp but got 400

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/75fd56f8-70f7-4872-90cb-67bff06e8f37/e642180f-ac0b-48a3-a5cd-548b98375304
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC004 post api auth verify signup otp with incorrect or expired otp
- **Test Code:** [TC004_post_api_auth_verify_signup_otp_with_incorrect_or_expired_otp.py](./TC004_post_api_auth_verify_signup_otp_with_incorrect_or_expired_otp.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 30, in <module>
  File "<string>", line 16, in test_post_api_auth_verify_signup_otp_with_incorrect_or_expired_otp
AssertionError: Expected 200 on sending OTP, got 429

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/75fd56f8-70f7-4872-90cb-67bff06e8f37/07be4fcb-40d9-40ae-b8c5-dc406efe41d7
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC005 post api auth register with full registration payload
- **Test Code:** [TC005_post_api_auth_register_with_full_registration_payload.py](./TC005_post_api_auth_register_with_full_registration_payload.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 93, in <module>
  File "<string>", line 74, in test_post_api_auth_register_with_full_registration_payload
AssertionError: Expected status code 201, got 400

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/75fd56f8-70f7-4872-90cb-67bff06e8f37/32f04874-db2a-4756-9fe3-55f95327e312
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC006 post api auth login with registered email
- **Test Code:** [TC006_post_api_auth_login_with_registered_email.py](./TC006_post_api_auth_login_with_registered_email.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 79, in <module>
  File "<string>", line 56, in test_post_api_auth_login_with_registered_email
AssertionError: Expected 201 for registration but got 400

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/75fd56f8-70f7-4872-90cb-67bff06e8f37/ebd10d18-5e25-49fd-9886-f39f8740445e
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC007 post api auth login with unknown email
- **Test Code:** [TC007_post_api_auth_login_with_unknown_email.py](./TC007_post_api_auth_login_with_unknown_email.py)
- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/75fd56f8-70f7-4872-90cb-67bff06e8f37/f5c9dc81-3c64-4972-84dc-8ccce0257b55
- **Status:** ✅ Passed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC008 post api auth verify login otp with valid otp
- **Test Code:** [TC008_post_api_auth_verify_login_otp_with_valid_otp.py](./TC008_post_api_auth_verify_login_otp_with_valid_otp.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 45, in <module>
  File "<string>", line 18, in test_post_api_auth_verify_login_otp_with_valid_otp
AssertionError: User registration failed with status 400, response: {"error":"Full name is required"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/75fd56f8-70f7-4872-90cb-67bff06e8f37/b431c709-562d-417d-abe8-8cfc5e18226a
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC009 post api auth verify login otp with invalid or expired otp
- **Test Code:** [TC009_post_api_auth_verify_login_otp_with_invalid_or_expired_otp.py](./TC009_post_api_auth_verify_login_otp_with_invalid_or_expired_otp.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 72, in <module>
  File "<string>", line 43, in test_post_api_auth_verify_login_otp_with_invalid_or_expired_otp
AssertionError: Login OTP request failed: {"error":"Password is required"}

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/75fd56f8-70f7-4872-90cb-67bff06e8f37/1d6bc03d-8beb-4db0-81a6-b8e2ee2150d1
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---

#### Test TC010 post api users register details with full payload
- **Test Code:** [TC010_post_api_users_register_details_with_full_payload.py](./TC010_post_api_users_register_details_with_full_payload.py)
- **Test Error:** Traceback (most recent call last):
  File "/var/task/handler.py", line 258, in run_with_retry
    exec(code, exec_env)
  File "<string>", line 105, in <module>
  File "<string>", line 84, in test_post_api_users_register_details_with_full_payload
AssertionError: Expected 201, got 400

- **Test Visualization and Result:** https://www.testsprite.com/dashboard/mcp/tests/75fd56f8-70f7-4872-90cb-67bff06e8f37/f3200547-1bf9-447d-9e5e-053ba3abb8d7
- **Status:** ❌ Failed
- **Analysis / Findings:** {{TODO:AI_ANALYSIS}}.
---


## 3️⃣ Coverage & Matching Metrics

- **10.00** of tests passed

| Requirement        | Total Tests | ✅ Passed | ❌ Failed  |
|--------------------|-------------|-----------|------------|
| ...                | ...         | ...       | ...        |
---


## 4️⃣ Key Gaps / Risks
{AI_GNERATED_KET_GAPS_AND_RISKS}
---