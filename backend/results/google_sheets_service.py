import re

from googleapiclient.discovery import build

from users.google_oauth import bypass_broken_local_proxy

from .google_service import get_google_credentials


def create_results_sheet(title: str):
    with bypass_broken_local_proxy():
        creds = get_google_credentials()
        sheets_service = build("sheets", "v4", credentials=creds)
        spreadsheet_body = {
            "properties": {"title": title},
            "sheets": [{"properties": {"title": "Responses"}}],
        }
        result = sheets_service.spreadsheets().create(body=spreadsheet_body).execute()

    spreadsheet_id = result["spreadsheetId"]
    spreadsheet_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit"
    return {"spreadsheet_id": spreadsheet_id, "spreadsheet_url": spreadsheet_url}


def write_headers_to_sheet(spreadsheet_id: str, headers: list[str]):
    with bypass_broken_local_proxy():
        creds = get_google_credentials()
        sheets_service = build("sheets", "v4", credentials=creds)
        sheets_service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range="Responses!A1",
            valueInputOption="RAW",
            body={"values": [headers]},
        ).execute()


def clear_data_rows(spreadsheet_id: str):
    with bypass_broken_local_proxy():
        creds = get_google_credentials()
        sheets_service = build("sheets", "v4", credentials=creds)
        sheets_service.spreadsheets().values().clear(
            spreadsheetId=spreadsheet_id,
            range="Responses!A2:ZZ",
            body={},
        ).execute()


def write_rows_to_sheet(spreadsheet_id: str, rows: list[list]):
    if not rows:
        return

    with bypass_broken_local_proxy():
        creds = get_google_credentials()
        sheets_service = build("sheets", "v4", credentials=creds)
        sheets_service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range="Responses!A2",
            valueInputOption="RAW",
            body={"values": rows},
        ).execute()


def extract_spreadsheet_id(sheet_url: str) -> str:
    match = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", sheet_url or "")
    return match.group(1) if match else ""


def sync_sheet_data(spreadsheet_id: str, headers: list[str], rows: list[list]):
    write_headers_to_sheet(spreadsheet_id, headers)
    clear_data_rows(spreadsheet_id)
    write_rows_to_sheet(spreadsheet_id, rows)
