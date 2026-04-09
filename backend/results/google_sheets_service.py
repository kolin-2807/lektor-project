import re

from googleapiclient.discovery import build

from users.google_oauth import bypass_broken_local_proxy

from .google_service import get_google_credentials


def create_results_sheet(connection, title: str):
    with bypass_broken_local_proxy():
        creds = get_google_credentials(connection)
        sheets_service = build("sheets", "v4", credentials=creds)
        spreadsheet_body = {
            "properties": {"title": title},
            "sheets": [{"properties": {"title": "Responses"}}],
        }
        result = sheets_service.spreadsheets().create(body=spreadsheet_body).execute()

    spreadsheet_id = result["spreadsheetId"]
    spreadsheet_url = f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/edit"
    return {"spreadsheet_id": spreadsheet_id, "spreadsheet_url": spreadsheet_url}


def write_headers_to_sheet(connection, spreadsheet_id: str, headers: list[str]):
    with bypass_broken_local_proxy():
        creds = get_google_credentials(connection)
        sheets_service = build("sheets", "v4", credentials=creds)
        sheets_service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range="Responses!A1",
            valueInputOption="RAW",
            body={"values": [headers]},
        ).execute()


def clear_data_rows(connection, spreadsheet_id: str):
    with bypass_broken_local_proxy():
        creds = get_google_credentials(connection)
        sheets_service = build("sheets", "v4", credentials=creds)
        sheets_service.spreadsheets().values().clear(
            spreadsheetId=spreadsheet_id,
            range="Responses!A2:ZZ",
            body={},
        ).execute()


def write_rows_to_sheet(connection, spreadsheet_id: str, rows: list[list]):
    if not rows:
        return

    with bypass_broken_local_proxy():
        creds = get_google_credentials(connection)
        sheets_service = build("sheets", "v4", credentials=creds)
        sheets_service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range="Responses!A2",
            valueInputOption="RAW",
            body={"values": rows},
        ).execute()


def format_results_sheet(connection, spreadsheet_id: str, column_count: int):
    if not spreadsheet_id or column_count <= 0:
        return

    with bypass_broken_local_proxy():
        creds = get_google_credentials(connection)
        sheets_service = build("sheets", "v4", credentials=creds)
        spreadsheet = sheets_service.spreadsheets().get(spreadsheetId=spreadsheet_id).execute()
        sheets = spreadsheet.get("sheets") or []
        first_sheet = sheets[0] if sheets else {}
        sheet_id = first_sheet.get("properties", {}).get("sheetId", 0)

        requests = [
            {
                "updateSheetProperties": {
                    "properties": {
                        "sheetId": sheet_id,
                        "gridProperties": {
                            "frozenRowCount": 1,
                        },
                    },
                    "fields": "gridProperties.frozenRowCount",
                }
            },
            {
                "repeatCell": {
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": 0,
                        "endRowIndex": 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": column_count,
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "backgroundColor": {
                                "red": 0.09,
                                "green": 0.19,
                                "blue": 0.42,
                            },
                            "horizontalAlignment": "CENTER",
                            "textFormat": {
                                "foregroundColor": {
                                    "red": 1,
                                    "green": 1,
                                    "blue": 1,
                                },
                                "bold": True,
                            },
                            "wrapStrategy": "WRAP",
                        }
                    },
                    "fields": "userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,wrapStrategy)",
                }
            },
            {
                "setBasicFilter": {
                    "filter": {
                        "range": {
                            "sheetId": sheet_id,
                            "startRowIndex": 0,
                            "startColumnIndex": 0,
                            "endColumnIndex": column_count,
                        }
                    }
                }
            },
            {
                "autoResizeDimensions": {
                    "dimensions": {
                        "sheetId": sheet_id,
                        "dimension": "COLUMNS",
                        "startIndex": 0,
                        "endIndex": column_count,
                    }
                }
            },
        ]

        sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body={"requests": requests},
        ).execute()


def extract_spreadsheet_id(sheet_url: str) -> str:
    match = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", sheet_url or "")
    return match.group(1) if match else ""


def sync_sheet_data(connection, spreadsheet_id: str, headers: list[str], rows: list[list]):
    write_headers_to_sheet(connection, spreadsheet_id, headers)
    clear_data_rows(connection, spreadsheet_id)
    write_rows_to_sheet(connection, spreadsheet_id, rows)
    format_results_sheet(connection, spreadsheet_id, len(headers))
