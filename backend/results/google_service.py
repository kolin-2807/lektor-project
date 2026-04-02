from google.auth.transport.requests import Request

from users.google_oauth import bypass_broken_local_proxy, credentials_from_dict, credentials_to_dict


def get_google_credentials(connection):
    if not connection:
        raise ValueError("Google connection is required.")

    credentials = credentials_from_dict(connection.credentials_json)

    if credentials.expired and credentials.refresh_token:
        with bypass_broken_local_proxy():
            credentials.refresh(Request())
        connection.credentials_json = credentials_to_dict(credentials)
        connection.save(update_fields=["credentials_json", "updated_at"])

    return credentials
