#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys


def main() -> int:
    root_dir = Path(__file__).resolve().parent.parent
    target = root_dir / "skills" / "chek-vibe-cobuild" / "scripts" / "seed_scrape_chek.py"
    cmd = [sys.executable, str(target), *sys.argv[1:]]
    return subprocess.call(cmd)


if __name__ == "__main__":
    raise SystemExit(main())
