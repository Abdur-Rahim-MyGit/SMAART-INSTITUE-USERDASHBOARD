import requests

def test_post_api_auth_login_with_unknown_email():
    base_url = "http://localhost:5000"
    url = f"{base_url}/api/auth/login"
    unknown_email = "unknown@example.com"
    payload = {"email": unknown_email}
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
    except requests.RequestException as e:
        assert False, f"Request failed: {e}"

    assert response.status_code in (400, 404), f"Expected status 400 or 404, got {response.status_code}"
    try:
        data = response.json()
    except ValueError:
        assert False, "Response is not valid JSON"

    if response.status_code == 404:
        assert "error" in data, "Expected 'error' field in response"
        assert data["error"].lower() == "user not found", f"Expected error 'User not found', got {data['error']}"
    elif response.status_code == 400:
        assert "error" in data, "Expected 'error' field in response"
        # The error message indicating login cannot proceed; just check non-empty error string
        assert isinstance(data["error"], str) and len(data["error"]) > 0
    else:
        # This should not happen due to earlier status code assertion
        assert False, f"Unexpected status code {response.status_code}"

test_post_api_auth_login_with_unknown_email()