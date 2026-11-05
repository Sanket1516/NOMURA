import base64
import os
import subprocess
import sys


def test_backup_round_trip_and_tamper_detection(tmp_path):
    env = {**os.environ, "VAAKYA_BACKUP_KEY_B64": base64.b64encode(os.urandom(32)).decode()}
    plain = b"PGDMP fake dump " * 1000
    enc = subprocess.run([sys.executable, "-m", "vaakya.backup", "encrypt"], input=plain, capture_output=True, env=env, check=True).stdout
    assert enc.startswith(b"VKV1") and b"PGDMP" not in enc
    dec = subprocess.run([sys.executable, "-m", "vaakya.backup", "decrypt"], input=enc, capture_output=True, env=env, check=True).stdout
    assert dec == plain
    bad = subprocess.run([sys.executable, "-m", "vaakya.backup", "decrypt"], input=enc[:-1] + b"x", capture_output=True, env=env)
    assert bad.returncode != 0
    nokey = subprocess.run([sys.executable, "-m", "vaakya.backup", "encrypt"], input=b"x", capture_output=True,
                           env={k: v for k, v in env.items() if k != "VAAKYA_BACKUP_KEY_B64"})
    assert nokey.returncode != 0


def test_metrics_render():
    from vaakya.core import metrics
    metrics.SENTINEL_CHECKS.labels("high").inc()
    body, ctype = metrics.render()
    assert b"vaakya_sentinel_checks_total" in body and "text/plain" in ctype
