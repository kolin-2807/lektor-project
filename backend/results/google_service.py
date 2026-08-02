from users.google_oauth import credentials_from_dict, credentials_to_dict, refresh_google_credentials


def get_google_credentials(connection):
    if not connection:
        raise ValueError("Google connection is required.")

    credentials = credentials_from_dict(connection.credentials_json)

    if getattr(credentials, "expired", False) and getattr(credentials, "refresh_token", None):
        refresh_google_credentials(credentials)
        connection.credentials_json = credentials_to_dict(credentials)
        connection.save(update_fields=["credentials_json", "updated_at"])

    return credentials
