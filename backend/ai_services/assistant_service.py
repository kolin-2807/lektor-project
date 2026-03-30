from google import genai
from django.conf import settings
import json


def detect_assistant_intent(user_text: str) -> dict:
    text = (user_text or "").lower().strip()

    if any(phrase in text for phrase in [
        "материал", "материалды аш", "материалдарды аш", "дәрісті аш", "дәрістерді аш"
    ]):
        return {
            "action": "open_materials",
            "reply": "Қазір материалдарды ашамын."
        }

    if any(phrase in text for phrase in [
        "тест аш", "тестті аш", "тест бөлімі", "перейди в тест", "open test"
    ]):
        return {
            "action": "open_test",
            "reply": "Жақсы, тест бөлімін ашамын."
        }

    if any(phrase in text for phrase in [
        "нәтиже", "нәтижелер", "нәтижелерді аш", "результат", "results"
    ]):
        return {
            "action": "open_results",
            "reply": "Қазір нәтижелерді көрсетемін."
        }

    if any(phrase in text for phrase in [
        "тест жаса", "тест жасап бер", "тест құрастыр", "создай тест", "generate test"
    ]):
        return {
            "action": "generate_test",
            "reply": "Жақсы, осы материал бойынша тест дайындаймын."
        }

    if any(phrase in text for phrase in [
        "qr", "qr аш", "кодты аш", "qr код"
    ]):
        return {
            "action": "open_qr",
            "reply": "Қазір QR кодты көрсетемін."
        }

    if any(phrase in text for phrase in [
        "тестті баста", "тест баста", "баста", "start test"
    ]):
        return {
            "action": "start_test",
            "reply": "Жақсы, тестті бастаймын."
        }

    if any(phrase in text for phrase in [
        "артқа қайт", "артқа", "қайту", "назад", "go back"
    ]):
        return {
            "action": "go_back",
            "reply": "Жақсы, алдыңғы бетке қайтарамын."
        }

    if not settings.GEMINI_API_KEY:
        return {
            "action": "unknown",
            "reply": "Кешіріңіз, сөзіңізді нақтырақ қайталап жіберіңізші."
        }

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = f"""
Сен оқу жүйесіндегі қазақ тілін түсінетін дауыстық AI көмекшісің.
Пайдаланушының сөзін талда да, тек JSON форматында жауап бер.
Ешқандай артық түсіндірме, markdown, код қоршауы жазба.

Мүмкін action мәндері:
- open_materials
- open_test
- open_results
- generate_test
- open_qr
- start_test
- go_back
- unknown

Reply ережелері:
- reply табиғи болсын
- reply жұмсақ, мәдениетті қазақша болсын
- reply тым ресми болмасын
- reply тым робот сияқты болмасын
- reply қысқа әрі түсінікті болсын

Жауап форматы:
{{
  "action": "open_materials",
  "reply": "Қазір материалдарды ашамын."
}}

Пайдаланушы сөзі:
{user_text}
"""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    cleaned_text = response.text.strip()

    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text.replace("```json", "", 1).strip()

    if cleaned_text.startswith("```"):
        cleaned_text = cleaned_text.replace("```", "", 1).strip()

    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3].strip()

    return json.loads(cleaned_text)