import requests
import uuid

BASE_URL = "http://localhost:5000"
TIMEOUT = 30

def test_post_api_users_register_details_with_full_payload():
    url = f"{BASE_URL}/api/users/register-details"

    # Generate a unique email to avoid conflicts
    unique_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"

    # Full 11-section registration payload example (mocked data)
    payload = {
        "email": unique_email,
        "personal": {
            "firstName": "John",
            "lastName": "Doe",
            "dateOfBirth": "1990-01-01",
            "gender": "male",
            "phone": "+1234567890"
        },
        "address": {
            "street": "123 Main St",
            "city": "Anytown",
            "state": "Anystate",
            "postalCode": "12345",
            "country": "USA"
        },
        "education": {
            "highestDegree": "Bachelor's",
            "university": "Example University",
            "graduationYear": 2012,
            "fieldOfStudy": "Computer Science"
        },
        "employment": {
            "currentEmployer": "Tech Corp",
            "position": "Software Engineer",
            "yearsExperience": 8,
            "industry": "Technology"
        },
        "documents": {
            "idProofType": "passport",
            "idProofNumber": "X1234567",
            "idProofExpiry": "2030-12-31"
        },
        "coursePreferences": {
            "interestedCourses": ["Module1", "Module2", "Module3"],
            "preferredStartDate": "2026-03-01"
        },
        "learningGoals": {
            "goalDescription": "Become a senior developer",
            "timeCommitmentPerWeek": 10
        },
        "emergencyContact": {
            "name": "Jane Doe",
            "relationship": "Sister",
            "phone": "+1234567899"
        },
        "paymentInfo": {
            "cardType": "Visa",
            "cardNumber": "4111111111111111",
            "expirationDate": "2026-08-31",
            "billingAddress": {
                "street": "123 Main St",
                "city": "Anytown",
                "state": "Anystate",
                "postalCode": "12345",
                "country": "USA"
            }
        },
        "preferences": {
            "newsletterOptIn": True,
            "smsAlertsOptIn": False
        },
        "additionalInfo": {
            "howDidYouHearAboutUs": "Online Ad",
            "comments": "Excited to start!"
        }
    }

    try:
        response = requests.post(url, json=payload, timeout=TIMEOUT)
        assert response.status_code == 201, f"Expected 201, got {response.status_code}"
        data = response.json()
        assert "id" in data, "Response missing 'id'"
        assert "summary" in data, "Response missing 'summary'"
        # Validate summary is dict and contains email
        assert isinstance(data["summary"], dict), "'summary' should be a dict"
        assert data["summary"].get("email") == unique_email, "Summary email mismatch"
    finally:
        # Cleanup: delete created registration if possible
        # No DELETE endpoint specified in PRD, so attempt to delete via PATCH with empty data just in case
        get_url = f"{BASE_URL}/api/users/register-details/{unique_email}"
        try:
            get_resp = requests.get(get_url, timeout=TIMEOUT)
            if get_resp.status_code == 200:
                # If deletion endpoint existed, we would delete here.
                # As no delete provided, we skip actual deletion.
                pass
        except Exception:
            pass


test_post_api_users_register_details_with_full_payload()
