import requests
import uuid

BASE_URL = "http://localhost:5000"
REGISTER_ENDPOINT = "/api/auth/register"


def test_post_api_auth_register_with_full_registration_payload():
    # Generate unique email to avoid conflicts
    unique_email = f"user_{uuid.uuid4().hex[:8]}@example.com"

    # Adjusted full registration payload to include all expected 11 sections
    full_registration_payload = {
        "email": unique_email,
        "personal": {
            "firstName": "Test",
            "lastName": "User",
            "phone": "+1234567890",
            "dateOfBirth": "1990-01-01",
            "address": {
                "street": "123 Test Blvd",
                "city": "Testville",
                "state": "TS",
                "zip": "12345",
                "country": "Testland"
            }
        },
        "education": {
            "highestDegree": "Bachelor's",
            "fieldOfStudy": "Computer Science",
            "graduationYear": 2012
        },
        "employment": {
            "status": "Employed",
            "company": "SMAART Minds",
            "position": "Developer"
        },
        "preferences": {
            "newsletter": True,
            "smsAlerts": False
        },
        "emergencyContact": {
            "name": "Jane Doe",
            "relationship": "Friend",
            "phone": "+0987654321"
        },
        "additionalInfo": {
            "heardAboutUs": "Online Ads",
            "goals": "Improve coding skills"
        },
        "documents": {},
        "paymentInfo": {},
        "courseSelection": {},
        "profileSettings": {},
        "referral": {},
        "signup": {
            "password": "StrongP@ssw0rd!"
        }
    }

    headers = {
        "Content-Type": "application/json"
    }

    created_registration_id = None

    try:
        response = requests.post(
            f"{BASE_URL}{REGISTER_ENDPOINT}",
            json=full_registration_payload,
            headers=headers,
            timeout=30
        )
        assert response.status_code == 201, f"Expected status code 201, got {response.status_code}"
        body = response.json()
        assert "id" in body, "Response JSON missing 'id'"
        assert "summary" in body, "Response JSON missing 'summary'"
        created_registration_id = body["id"]
        assert isinstance(created_registration_id, str) and len(created_registration_id) > 0, "Invalid registration id"
    finally:
        # Cleanup: delete the created registration if id exists
        if created_registration_id:
            try:
                delete_response = requests.delete(
                    f"{BASE_URL}/api/users/register-details/{unique_email}",
                    timeout=30
                )
                assert delete_response.status_code in (200, 204), f"Cleanup deletion returned unexpected status {delete_response.status_code}"
            except Exception:
                pass


test_post_api_auth_register_with_full_registration_payload()
