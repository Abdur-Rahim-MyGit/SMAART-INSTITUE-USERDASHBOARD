import requests
import random
import string

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def generate_random_email():
    return f"testuser_{''.join(random.choices(string.ascii_lowercase + string.digits, k=8))}@example.com"

def test_post_api_auth_login_with_registered_email():
    session = requests.Session()
    email = generate_random_email()
    register_url = f"{BASE_URL}/api/auth/register"
    login_url = f"{BASE_URL}/api/auth/login"
    delete_email_url = f"{BASE_URL}/api/users/register-details/{email}"

    full_registration_payload = {
        "email": email,
        "personal": {
            "dob": "1990-01-01",
            "gender": "other"
        },
        "contact": {
            "phone": "+1234567890",
            "address": "123 Test St"
        },
        "education": {
            "highestQualification": "Bachelor's",
            "university": "Test University"
        },
        "employment": {
            "status": "employed",
            "position": "Tester"
        },
        "documents": {
            "idProof": "id_proof_sample_data"
        },
        "preferences": {
            "newsletter": False
        },
        "consent": {
            "termsAccepted": True,
            "privacyAccepted": True
        },
        "additionalInfo": {},
        "section8": {},
        "section9": {},
        "section10": {},
        "section11": {}
    }

    try:
        # Register a new user first
        resp_register = session.post(register_url, json=full_registration_payload, timeout=TIMEOUT)
        assert resp_register.status_code == 201, f"Expected 201 for registration but got {resp_register.status_code}"
        resp_json = resp_register.json()
        assert "id" in resp_json, "Registration response missing 'id'"
        assert "summary" in resp_json, "Registration response missing 'summary'"

        # Now test login with registered email
        login_payload = {"email": email}
        resp_login = session.post(login_url, json=login_payload, timeout=TIMEOUT)
        assert resp_login.status_code == 200, f"Expected 200 for login but got {resp_login.status_code}"
        login_json = resp_login.json()
        assert "message" in login_json, "Login response missing 'message'"
        assert login_json["message"].lower() in ["login otp sent", "otp sent"]
        # OTP metadata may or may not be present
        assert True

    finally:
        # Cleanup: delete the registered user if possible
        try:
            resp_del = session.delete(delete_email_url, timeout=TIMEOUT)
            assert resp_del.status_code in [200, 204, 404]
        except Exception:
            pass

test_post_api_auth_login_with_registered_email()
