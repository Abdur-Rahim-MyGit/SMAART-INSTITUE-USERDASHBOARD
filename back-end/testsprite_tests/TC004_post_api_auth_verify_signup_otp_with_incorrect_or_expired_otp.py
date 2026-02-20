import requests
import uuid

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_post_api_auth_verify_signup_otp_with_incorrect_or_expired_otp():
    # Create a unique email for testing
    test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    
    # Step 1: Send signup OTP to get system to generate an OTP for this email
    send_otp_url = f"{BASE_URL}/api/auth/send-signup-otp"
    send_otp_payload = {"email": test_email}
    
    response_send_otp = requests.post(send_otp_url, json=send_otp_payload, timeout=TIMEOUT)
    assert response_send_otp.status_code == 200, f"Expected 200 on sending OTP, got {response_send_otp.status_code}"
    assert "OTP sent" in response_send_otp.json().get("message", ""), "Expected 'OTP sent' message"
    
    # Step 2: Attempt to verify signup OTP with incorrect or expired OTP
    verify_otp_url = f"{BASE_URL}/api/auth/verify-signup-otp"
    
    # Use an obviously incorrect OTP value "000000" to simulate invalid/expired case
    invalid_otp_payload = {"email": test_email, "otp": "000000"}
    
    response_verify_otp = requests.post(verify_otp_url, json=invalid_otp_payload, timeout=TIMEOUT)
    assert response_verify_otp.status_code == 400, f"Expected 400 on incorrect/expired OTP, got {response_verify_otp.status_code}"
    error = response_verify_otp.json().get("error", "") or response_verify_otp.json().get("message", "")
    assert "Invalid or expired OTP" in error, f"Expected error message about invalid or expired OTP, got: {error}"

test_post_api_auth_verify_signup_otp_with_incorrect_or_expired_otp()