import json

from django.conf import settings
from google import genai


def generate_test_from_text(text: str, language: str = "kaz") -> list:
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY табылмады")

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    is_russian = language == "rus"

    if is_russian:
        prompt = f"""
        Ты генератор тестов для преподавателя.

        По материалу ниже составь ровно 5 тестовых вопросов на русском языке.
        Верни ответ только в JSON формате.
        Не добавляй пояснения, markdown или любой лишний текст.

        Формат должен быть строго таким:
        [
          {{
            "question": "Текст вопроса",
            "options": ["A", "B", "C", "D"],
            "answer": "A"
          }}
        ]

        Требования:
        - Должно быть ровно 5 вопросов
        - В каждом вопросе должно быть 4 варианта ответа
        - Вопросы и варианты должны быть на русском языке
        - Вопросы должны быть тесно связаны с материалом
        - Правильный ответ должен быть одним из вариантов
        - Ответ верни только как JSON-массив

        Материал:
        {text}
        """
    else:
        prompt = f"""
        Сен оқытушыға арналған тест генераторысың.

        Төмендегі материал бойынша нақты 5 тест сұрағын қазақ тілінде құрастыр.
        Жауапты тек JSON форматында қайтар.
        Ешқандай артық түсіндірме, markdown немесе қосымша мәтін жазба.

        Формат дәл мынадай болсын:
        [
          {{
            "question": "Сұрақ мәтіні",
            "options": ["A", "B", "C", "D"],
            "answer": "A"
          }}
        ]

        Талаптар:
        - Барлығы 5 сұрақ болсын
        - Әр сұрақта 4 нұсқа болсын
        - Сұрақтар мен жауап нұсқалары қазақ тілінде болсын
        - Сұрақтар материалға тікелей байланысты болсын
        - Дұрыс жауап нұсқалардың бірі болсын
        - Жауап тек JSON массив болсын

        Материал:
        {text}
        """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
    )

    cleaned_text = (response.text or "").strip()

    if cleaned_text.startswith("```json"):
        cleaned_text = cleaned_text.replace("```json", "", 1).strip()

    if cleaned_text.startswith("```"):
        cleaned_text = cleaned_text.replace("```", "", 1).strip()

    if cleaned_text.endswith("```"):
        cleaned_text = cleaned_text[:-3].strip()

    return json.loads(cleaned_text)
