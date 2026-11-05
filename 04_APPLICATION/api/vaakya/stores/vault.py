"""Encrypted document vault on S3-compatible storage (SeaweedFS, D-024).

Envelope encryption (SECURITY_ARCHITECTURE §5): each object gets a random 256-bit data key (DEK); the object is
encrypted with AES-256-GCM under the DEK, and the DEK is encrypted (wrapped) with the master key (KEK) from secrets.
The object key is bound as associated data, so a ciphertext cannot be moved to another user's path and still decrypt.

Blob layout: b"VKV1" | wrap_nonce(12) | wrapped_dek(48) | data_nonce(12) | ciphertext+tag
"""
from __future__ import annotations

import base64
import os

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from cryptography.exceptions import InvalidTag
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

MAGIC = b"VKV1"
BUCKET = "vaakya-user-docs"


class VaultIntegrityError(Exception):
    pass


class EnvelopeCipher:
    def __init__(self, kek: bytes):
        if len(kek) != 32:
            raise ValueError("The vault master key must be exactly 32 bytes")
        self._kek = AESGCM(kek)

    @classmethod
    def from_b64(cls, value: str) -> EnvelopeCipher:
        return cls(base64.b64decode(value))

    def encrypt(self, plaintext: bytes, aad: bytes) -> bytes:
        dek = AESGCM.generate_key(bit_length=256)
        wn, dn = os.urandom(12), os.urandom(12)
        wrapped = self._kek.encrypt(wn, dek, aad)
        return MAGIC + wn + wrapped + dn + AESGCM(dek).encrypt(dn, plaintext, aad)

    def decrypt(self, blob: bytes, aad: bytes) -> bytes:
        if not blob.startswith(MAGIC) or len(blob) < 4 + 12 + 48 + 12 + 16:
            raise VaultIntegrityError("Not a VAAKYA vault object")
        wn, wrapped, dn, ct = blob[4:16], blob[16:64], blob[64:76], blob[76:]
        try:
            dek = self._kek.decrypt(wn, wrapped, aad)
            return AESGCM(dek).decrypt(dn, ct, aad)
        except InvalidTag as e:
            raise VaultIntegrityError("Object failed authentication: wrong key, path or tampered data") from e


class S3Vault:
    """DocumentVault implementation. Browsers never get direct or presigned URLs (DATABASE_ARCHITECTURE §5)."""

    def __init__(self, endpoint: str, access_key: str, secret_key: str, cipher: EnvelopeCipher, bucket: str = BUCKET):
        self.s3 = boto3.client("s3", endpoint_url=endpoint, aws_access_key_id=access_key, aws_secret_access_key=secret_key,
                               region_name="us-east-1", config=Config(retries={"max_attempts": 3, "mode": "standard"}, connect_timeout=5, read_timeout=30))
        self.cipher, self.bucket = cipher, bucket

    def ensure_bucket(self) -> None:
        try:
            self.s3.head_bucket(Bucket=self.bucket)
        except ClientError:
            self.s3.create_bucket(Bucket=self.bucket)

    def put(self, key: str, data: bytes, mime: str) -> None:
        self.s3.put_object(Bucket=self.bucket, Key=key, Body=self.cipher.encrypt(data, key.encode()),
                           ContentType="application/octet-stream", Metadata={"vaakya-mime": mime, "vaakya-enc": "VKV1"})

    def get(self, key: str) -> bytes:
        return self.cipher.decrypt(self.s3.get_object(Bucket=self.bucket, Key=key)["Body"].read(), key.encode())

    def get_raw(self, key: str) -> bytes:
        return self.s3.get_object(Bucket=self.bucket, Key=key)["Body"].read()

    def delete(self, key: str) -> None:
        self.s3.delete_object(Bucket=self.bucket, Key=key)

    def keys(self, prefix: str) -> list[str]:
        out, token = [], None
        while True:
            kw = {"Bucket": self.bucket, "Prefix": prefix, **({"ContinuationToken": token} if token else {})}
            r = self.s3.list_objects_v2(**kw)
            out += [o["Key"] for o in r.get("Contents", [])]
            if not r.get("IsTruncated"):
                return out
            token = r["NextContinuationToken"]

    def delete_prefix(self, prefix: str) -> int:
        if not prefix.endswith("/") or len(prefix) < 10:
            raise ValueError("Refusing to delete a broad prefix")
        keys = self.keys(prefix)
        for k in keys:
            self.delete(k)
        return len(keys)
