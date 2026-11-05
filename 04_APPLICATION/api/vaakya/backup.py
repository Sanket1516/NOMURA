"""Encrypt and decrypt backups (DATABASE_ARCHITECTURE §6, NFR-AVAIL-03). AES-256-GCM with a 32-byte key from secrets.

  python -m vaakya.backup encrypt  < plain  > plain.enc
  python -m vaakya.backup decrypt  < plain.enc > plain
Key: VAAKYA_BACKUP_KEY_B64 (separate from the document vault key, so either can be rotated alone).
Whole file in memory: fine for this scale; stream in chunks before databases reach several GB.
"""
from __future__ import annotations

import base64
import os
import sys

from .stores.vault import EnvelopeCipher

AAD = b"vaakya-backup-v1"


def cipher() -> EnvelopeCipher:
    key = os.environ.get("VAAKYA_BACKUP_KEY_B64")
    if not key:
        sys.exit("VAAKYA_BACKUP_KEY_B64 is not set")
    return EnvelopeCipher(base64.b64decode(key))


def main(argv: list[str]) -> None:
    if len(argv) != 2 or argv[1] not in ("encrypt", "decrypt"):
        sys.exit("usage: python -m vaakya.backup encrypt|decrypt < in > out")
    data = sys.stdin.buffer.read()
    out = cipher().encrypt(data, AAD) if argv[1] == "encrypt" else cipher().decrypt(data, AAD)
    sys.stdout.buffer.write(out)


if __name__ == "__main__":
    main(sys.argv)
