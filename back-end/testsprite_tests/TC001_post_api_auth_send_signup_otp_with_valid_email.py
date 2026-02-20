import requests
import uuid

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_post_api_auth_send_signup_otp_with_valid_email():
    url = f"{BASE_URL}/api/auth/send-signup-otp"
    # Generate a random valid email for testing
    email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
    payload = {"email": email}
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=TIMEOUT)
        # Assert status code 200 for success
        assert response.status_code == 200, f"Expected status 200, got {response.status_code}"
        json_resp = response.json()
        # Assert message says OTP sent
        assert "message" in json_resp, "Response JSON missing 'message' key"
        assert json_resp["message"].lower() == "otp sent", f"Unexpected message: {json_resp['message']}"
        # Assert delivery metadata is present
        assert "delivery" in json_resp or "deliveryMeta" in json_resp or "metadata" in json_resp, \
            "Response missing expected delivery metadata key"
    except requests.RequestException as e:
        assert False, f"RequestException occurred: {e}"
    except ValueError as e:
        assert False, f"Response is not valid JSON or missing fields: {e}"

test_post_api_auth_send_signup_otp_with_valid_email()