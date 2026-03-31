from google_service import get_google_credentials

creds = get_google_credentials()
print("Google auth OK")
print(creds.valid)