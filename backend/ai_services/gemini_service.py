import json
from google import genai
from django.conf import settings


def generate_test_from_text(text: str) -> str:
    if not settings.GEMINI_API_KEY:
        raise ValueError("GEMINI_API_KEY табылмады")

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = f"""
    Сен оқытушыға арналған тест генераторысың.

    Төмендегі материал бойынша нақты 5 тест сұрағын құрастыр.
    Жауапты тек JSON форматында қайтар.
    Ешқандай артық түсіндірме жазба.

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
    - Сұрақтар материалға жақын болсын
    - Жауап тек JSON болсын

    Материал:
    {text}
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