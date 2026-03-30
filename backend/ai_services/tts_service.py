from pathlib import Path
import subprocess


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "piper_models" / "kk_KZ-raya-x_low.onnx"
CONFIG_PATH = BASE_DIR / "piper_models" / "kk_KZ-raya-x_low.onnx.json"
OUTPUT_PATH = BASE_DIR / "piper_models" / "assistant_reply.wav"


def synthesize_kazakh_speech(text: str) -> str:
    clean_text = (text or "").strip()
    if not clean_text:
        raise ValueError("Дыбыстауға мәтін берілмеді")

    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Piper model табылмады: {MODEL_PATH}")

    if not CONFIG_PATH.exists():
        raise FileNotFoundError(f"Piper config табылмады: {CONFIG_PATH}")

    command = [
        "piper",
        "--model", str(MODEL_PATH),
        "--config", str(CONFIG_PATH),
        "--output_file", str(OUTPUT_PATH),
    ]

    try:
        result = subprocess.run(
            command,
            input=clean_text.encode("utf-8"),
            check=True,
            capture_output=True
    )
    except subprocess.CalledProcessError as e:
        print("PIPER STDERR:", e.stderr.decode("utf-8", errors="ignore"))
        print("PIPER STDOUT:", e.stdout.decode("utf-8", errors="ignore"))
        raise

    return str(OUTPUT_PATH)