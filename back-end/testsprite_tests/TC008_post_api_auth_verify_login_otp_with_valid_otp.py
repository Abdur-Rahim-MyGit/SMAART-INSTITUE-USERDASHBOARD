import requests
import uuid

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_post_api_auth_verify_login_otp_with_valid_otp():
    # Generate a unique test email
    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"

    try:
        # Step 1: Register the user with a minimal but valid registration payload (email + required signup fields)
        registration_payload = {
            "email": test_email,
            "password": "Password123!"
        }
        reg_resp = requests.post(f"{BASE_URL}/api/auth/register", json=registration_payload, timeout=TIMEOUT)
        assert reg_resp.status_code == 201, f"User registration failed with status {reg_resp.status_code}, response: {reg_resp.text}"

        # Step 2: Send login OTP
        login_payload = {"email": test_email}
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload, timeout=TIMEOUT)
        assert login_resp.status_code == 200, f"Login OTP send failed with status {login_resp.status_code}, response: {login_resp.text}"
        login_data = login_resp.json()
        assert "message" in login_data and "Login OTP sent" in login_data["message"]

        # For testing verify-login-otp with a valid OTP, we require the OTP.
        # However, the PRD and plan do not offer a way to fetch OTP programmatically.
        # For testing purposes, here we assume OTP "123456" is valid immediately after sending.
        valid_otp = "123456"

        # Step 3: Verify login OTP
        verify_payload = {"email": test_email, "otp": valid_otp}
        verify_resp = requests.post(f"{BASE_URL}/api/auth/verify-login-otp", json=verify_payload, timeout=TIMEOUT)
        assert verify_resp.status_code == 200, f"Verify login OTP failed with status {verify_resp.status_code}, response: {verify_resp.text}"
        verify_data = verify_resp.json()
        assert "token" in verify_data, "JWT token not found in response"
        assert isinstance(verify_data.get("expiresIn"), int), "expiresIn missing or not an integer"

    finally:
        # Cleanup: No explicit delete endpoint in PRD, ignoring resource cleanup
        # Generally, user deletion endpoint would be called here if available
        pass

test_post_api_auth_verify_login_otp_with_valid_otp()
