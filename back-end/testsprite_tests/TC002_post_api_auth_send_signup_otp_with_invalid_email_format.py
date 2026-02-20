import requests

def test_post_api_auth_send_signup_otp_with_invalid_email_format():
    base_url = "http://localhost:5000"
    endpoint = "/api/auth/send-signup-otp"
    url = f"{base_url}{endpoint}"
    headers = {"Content-Type": "application/json"}

    payload = {"email": "invalid-email"}

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code == 400, f"Expected status code 400 but got {response.status_code}"

    try:
        response_json = response.json()
    except ValueError:
        assert False, "Response is not a valid JSON"

    assert "Invalid email format" in str(response_json).lower(), \
        f"Expected validation error about invalid email format but got: {response_json}"

test_post_api_auth_send_signup_otp_with_invalid_email_format()