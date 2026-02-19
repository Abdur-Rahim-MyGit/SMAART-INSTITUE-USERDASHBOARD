import requests
import uuid

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_post_api_auth_verify_login_otp_with_invalid_or_expired_otp():
    # Generate a unique test email
    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    session = requests.Session()

    try:
        # Step 1: Register the user to have a valid user in system
        registration_payload = {
            "email": test_email,
            "fullName": "Test User",
            "firstName": "Test",
            "lastName": "User",
            "password": "TestPass123!",
            "dateOfBirth": "1990-01-01",
            "phoneNumber": "1234567890",
            "address": "123 Test St",
            "city": "Testville",
            "state": "TS",
            "zipCode": "12345",
            "country": "Testland",
            "gender": "other"
        }
        register_resp = session.post(
            f"{BASE_URL}/api/auth/register",
            json=registration_payload,
            timeout=TIMEOUT
        )
        assert register_resp.status_code == 201, f"Registration failed: {register_resp.text}"

        # Step 2: Request a login OTP for the registered email
        login_payload = {"email": test_email}
        login_resp = session.post(
            f"{BASE_URL}/api/auth/login",
            json=login_payload,
            timeout=TIMEOUT
        )
        assert login_resp.status_code == 200, f"Login OTP request failed: {login_resp.text}"

        # Step 3: Attempt to verify login OTP with invalid/expired OTP
        verify_payload = {
            "email": test_email,
            "otp": "expired"
        }
        verify_resp = session.post(
            f"{BASE_URL}/api/auth/verify-login-otp",
            json=verify_payload,
            timeout=TIMEOUT
        )

        # Validate the response: expect 400 with error message about invalid or expired OTP
        assert verify_resp.status_code == 400, f"Expected 400 but got {verify_resp.status_code} with response: {verify_resp.text}"
        error_resp = verify_resp.json()
        assert "error" in error_resp, "Error message not provided in response"
        assert "invalid" in error_resp["error"].lower() or "expired" in error_resp["error"].lower(), \
            f"Unexpected error message: {error_resp['error']}"

    finally:
        # Cleanup: Delete the registered user to maintain test isolation
        # Assuming an endpoint /api/users/register-details/:email supports DELETE for test cleanup (not in PRD)
        # If not available, ignore or implement accordingly.
        try:
            session.delete(f"{BASE_URL}/api/users/register-details/{test_email}", timeout=TIMEOUT)
        except Exception:
            pass

test_post_api_auth_verify_login_otp_with_invalid_or_expired_otp()
