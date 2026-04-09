from __future__ import annotations

import os
from functools import lru_cache

try:
    import whisper
except Exception:  # pragma: no cover - import failure is handled at runtime
    whisper = None


WHISPER_MODEL_NAME = (os.getenv("WHISPER_MODEL_NAME", "small") or "small").strip()
WHISPER_LANGUAGE = (os.getenv("WHISPER_LANGUAGE", "kk") or "kk").strip()
WHISPER_INITIAL_PROMPT = (
    "Бұл қазақ тіліндегі оқу жүйесіне арналған дауыстық көмекші. "
    "Пайдаланушы материалдарды ашу, тест жасау, нәтижелерді көру, "
    "слайд дайындау сияқты қысқа командалар айтуы мүмкін."
)


@lru_cache(maxsize=1)
def _get_whisper_model():
    if whisper is None:
        raise RuntimeError("Whisper dependency is not available.")
    return whisper.load_model(WHISPER_MODEL_NAME)


def transcribe_audio(file_path: str) -> str:
    try:
        model = _get_whisper_model()
    except Exception as exc:
        raise RuntimeError("Speech-to-text service is temporarily unavailable.") from exc

    result = model.transcribe(
        file_path,
        language=WHISPER_LANGUAGE,
        task="transcribe",
        fp16=False,
        temperature=0,
        best_of=5,
        beam_size=5,
        initial_prompt=WHISPER_INITIAL_PROMPT,
    )
    return str(result.get("text") or "").strip()
