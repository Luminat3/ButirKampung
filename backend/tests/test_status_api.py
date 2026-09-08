import os
import uuid

import requests


BASE_URL = os.environ["EXPO_PUBLIC_BACKEND_URL"].rstrip("/")


def test_status_create_and_shape():
    client_name = f"TEST_telorku_{uuid.uuid4().hex[:8]}"
    response = requests.post(f"{BASE_URL}/api/status", json={"client_name": client_name}, timeout=15)
    assert response.status_code == 200
    body = response.json()
    assert body["client_name"] == client_name
    assert isinstance(body["id"], str)


def test_status_list_returns_records():
    response = requests.get(f"{BASE_URL}/api/status", timeout=15)
    assert response.status_code == 200
    assert isinstance(response.json(), list)