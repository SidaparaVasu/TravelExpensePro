from django.test import TestCase
from django.contrib.auth import get_user_model

class LoginTestCase(TestCase):
    def setUp(self):
        User = get_user_model()

        self.username = "John"
        self.password = "admin@123"
        self.user = User.objects.create_user(username=self.username, password=self.password)
        self.login_url = "/api/auth/login/"

    def test_login_with_valid_credentials(self):
        response = self.client.post(self.login_url, {
            "username": self.username,
            "password": self.password
        })
        self.assertEqual(response.status_code, 200)
        print("✅ Test 1 passed: valid credentials work")

    def test_login_with_invalid_password(self):
        response = self.client.post(self.login_url, {
            "username": self.username,
            "password": "wrongpass"
        })
        self.assertEqual(response.status_code, 400)
        print("✅ Test 2 passed: invalid password rejected")

    def test_login_with_invalid_username(self):
        response = self.client.post(self.login_url, {
            "username": "Jane",
            "password": "admin@123"
        })
        self.assertEqual(response.status_code, 400)
        print("✅ Test 3 passed: invalid username rejected")
