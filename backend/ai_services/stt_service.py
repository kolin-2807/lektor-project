import whisper

model = whisper.load_model("small")


def transcribe_audio(file_path: str) -> str:
    result = model.transcribe(
        file_path,
        language="kk",
        task="transcribe",
        fp16=False,
        temperature=0,
        best_of=5,
        beam_size=5,
        initial_prompt="Бұл қазақ тіліндегі оқу жүйесіне арналған дауыстық көмекші. Пайдаланушы материалдарды аш, тест аш, нәтижелерді аш, тест жаса сияқты командалар айтады."
    )
    return result["text"].strip()