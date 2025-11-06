from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    # Should return the activities dict
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_remove_participant():
    activity = "Chess Club"
    email = "test_student@example.com"

    # Ensure not present
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Signup
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Signed up {email} for {activity}"
    # Participant should now be present in in-memory store
    assert email in activities[activity]["participants"]

    # Attempt duplicate signup should fail
    resp_dup = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp_dup.status_code == 400

    # Remove participant
    resp_del = client.delete(f"/activities/{activity}/participant?email={email}")
    assert resp_del.status_code == 200
    assert resp_del.json()["message"] == f"Unregistered {email} from {activity}"
    assert email not in activities[activity]["participants"]
