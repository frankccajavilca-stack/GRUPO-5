import requests
from django.conf import settings

BASE = settings.GHL_BASE_URL.rstrip('/')
TOKEN = settings.GHL_PRIVATE_TOKEN
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Version": "2021-04-15"
}

def create_appointment_in_ghl(calendar_id, contact_id, title, start_dt_iso, end_dt_iso, time_zone='America/Lima', notes=None):
    url = f"{BASE}/calendars/events/appointments"
    payload = {
        "calendarId": calendar_id,
        "locationId": settings.GHL_LOCATION_ID,
        "contactId": contact_id,
        "title": title,
        "startTime": start_dt_iso,
        "endTime": end_dt_iso,
        "meetingLocationType": "custom",
        "appointmentStatus": "confirmed",
        "description": notes or ""
    }
    r = requests.post(url, headers=HEADERS, json=payload, timeout=20)
    r.raise_for_status()
    return r.json()

