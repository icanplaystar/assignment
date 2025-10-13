import sys
from pathlib import Path


def main() -> None:
    pdf_path = Path(r"c:\Users\gengj\vue3-app\design.pdf")
    out_path = pdf_path.with_suffix(".txt")

    try:
        from pdfminer.high_level import extract_text
    except Exception:
        print("Installing pdfminer.six...", flush=True)
        import subprocess

        subprocess.check_call(
            [
                sys.executable,
                "-m",
                "pip",
                "install",
                "--disable-pip-version-check",
                "pdfminer.six",
            ]
        )
        from pdfminer.high_level import extract_text  # type: ignore

    text = extract_text(str(pdf_path))
    out_path.write_text(text, encoding="utf-8")
    print(f"WROTE: {out_path}")


if __name__ == "__main__":
    main()


