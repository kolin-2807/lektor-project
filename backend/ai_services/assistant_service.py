from google import genai
from django.conf import settings
import json
import re


def normalize_assistant_text(text: str) -> str:
    text = (text or "").lower().strip()

    # Whisper қателерін сәл жұмсарту
    text = text.replace("күрс", "курс")
    text = text.replace("күрст", "курст")
    text = text.replace("құрс", "курс")
    text = text.replace("құрст", "курст")
    text = text.replace("пәндрін", "пәндерін")
    text = text.replace("пандерин", "пәндерін")
    text = text.replace("материял", "материал")
    text = text.replace("матриял", "материал")

    # Артық бос орындарды қысу
    text = re.sub(r"\s+", " ", text).strip()
    return text


def detect_assistant_intent(user_text: str) -> dict:
    text = normalize_assistant_text(user_text)

    # -----------------------------
    # 1. КУРС АШУ
    # -----------------------------
    kazakh_course_map = {
        "бірінші": 1,
        "екінші": 2,
        "үшінші": 3,
        "төртінші": 4
    }

    for word, number in kazakh_course_map.items():
        if (
            f"{word} курс" in text
            or f"{word} курсты" in text
            or f"{word} курсқа" in text
            or f"{word} курс пән" in text
            or f"{word} курс дисциплин" in text
        ):
            return {
                "action": "open_course",
                "reply": f"{number}-курсты ашамын.",
                "course_number": number
            }

    course_match = re.search(
        r"(\d+)\s*(курс|курсты|курсқа|курс пәндерін|курс пәнін|курс дисциплиналарын|курс дисциплинасын)",
        text
    )
    if course_match:
        course_number = int(course_match.group(1))
        return {
            "action": "open_course",
            "reply": f"{course_number}-курсты ашамын.",
            "course_number": course_number
        }

    # -----------------------------
    # 2. МАТЕРИАЛДАР
    # -----------------------------
    if any(phrase in text for phrase in [
        "материал",
        "материалды аш",
        "материалдарды аш",
        "материалдарды көрсет",
        "материалдарды көрсетші",
        "дәрісті аш",
        "дәрістерді аш",
        "дәрісті көрсет",
        "пән материалдары",
        "лекция",
        "лекцияны аш"
    ]):
        return {
            "action": "open_materials",
            "reply": "Қазір материалдарды ашамын."
        }

    # -----------------------------
    # 3. ТЕСТ БӨЛІМІ
    # -----------------------------
    if any(phrase in text for phrase in [
        "тест аш",
        "тестті аш",
        "тест бөлімі",
        "тестке өт",
        "тестке өтші",
        "перейди в тест",
        "open test"
    ]):
        return {
            "action": "open_test",
            "reply": "Жақсы, тест бөлімін ашамын."
        }

    # -----------------------------
    # 4. НӘТИЖЕЛЕР
    # -----------------------------
    if any(phrase in text for phrase in [
        "нәтиже",
        "нәтижелер",
        "нәтижелерді аш",
        "нәтижені аш",
        "результат",
        "results"
    ]):
        return {
            "action": "open_results",
            "reply": "Қазір нәтижелерді көрсетемін."
        }

    # -----------------------------
    # 5. ТЕСТ ЖАСАУ
    # -----------------------------
    if any(phrase in text for phrase in [
        "тест жаса",
        "тест жасап бер",
        "тест құрастыр",
        "тест дайында",
        "создай тест",
        "generate test"
    ]):
        return {
            "action": "generate_test",
            "reply": "Жақсы, осы материал бойынша тест дайындаймын."
        }

    # -----------------------------
    # 6. QR
    # -----------------------------
    if any(phrase in text for phrase in [
        "qr",
        "qr аш",
        "qr код",
        "кодты аш",
        "qr кодты көрсет"
    ]):
        return {
            "action": "open_qr",
            "reply": "Қазір QR кодты көрсетемін."
        }

    # -----------------------------
    # 7. ТЕСТТІ БАСТАУ
    # -----------------------------
    if any(phrase in text for phrase in [
        "тестті баста",
        "тест баста",
        "баста",
        "тестті іске қос",
        "start test"
    ]):
        return {
            "action": "start_test",
            "reply": "Жақсы, тестті бастаймын."
        }

    # -----------------------------
    # 8. АРТҚА ҚАЙТУ
    # -----------------------------
    if any(phrase in text for phrase in [
        "артқа қайт",
        "артқа",
        "қайту",
        "артқа өт",
        "назад",
        "go back"
    ]):
        return {
            "action": "go_back",
            "reply": "Жақсы, алдыңғы бетке қайтарамын."
        }

    # -----------------------------
    # 9. GEMINI FALLBACK
    # -----------------------------
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
- open_course
- open_materials
- open_test
- open_results
- generate_test
- open_qr
- start_test
- go_back
- unknown

Ереже:
- Егер пайдаланушы курс ашуды сұраса, action=open_course қыл
- Егер курс анық болса, course_number өрісін де қайтар
- Reply табиғи, жұмсақ, мәдениетті қазақша болсын
- Reply қысқа болсын

Жауап форматы:
{{
  "action": "open_course",
  "reply": "3-курсты ашамын.",
  "course_number": 3
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

    parsed = json.loads(cleaned_text)

    if "course_number" in parsed:
        try:
            parsed["course_number"] = int(parsed["course_number"])
        except Exception:
            parsed.pop("course_number", None)

    return parsed