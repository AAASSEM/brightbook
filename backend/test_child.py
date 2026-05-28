import requests

def test_create_child():
    url = "http://localhost:8000/api/children/"
    # I need a token. I'll try to login first.
    login_url = "http://localhost:8000/api/auth/login"
    login_data = {"email": "test@example.com", "password": "password"} # Assuming this user exists from previous turns
    
    # Let's try to register a new user first to be sure
    reg_url = "http://localhost:8000/api/auth/register"
    reg_data = {
        "name": "Test Parent",
        "email": "test_new@example.com",
        "password": "password",
        "language": "en"
    }
    
    try:
        r = requests.post(reg_url, json=reg_data)
        if r.status_code != 201:
            print(f"Registration failed: {r.status_code} {r.text}")
            # Try login if registration fails (user might exist)
            r = requests.post(login_url, json=login_data)
            if r.status_code != 200:
                print(f"Login failed: {r.status_code} {r.text}")
                return
        
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        child_data = {
            "name": "Test Child",
            "age": 7,
            "native_language": "English"
        }
        
        r = requests.post(url, json=child_data, headers=headers)
        print(f"Create Child result: {r.status_code} {r.text}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_create_child()
