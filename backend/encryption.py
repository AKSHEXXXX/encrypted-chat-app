from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
import os, base64, json

class EncryptionManager:
    def __init__(self, master_secret: str):
        self.master = master_secret.encode()

    def derive_key(self, salt: bytes = None):
        if salt is None:
            salt = os.urandom(16)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = kdf.derive(self.master)
        return key, salt

    def encrypt(self, plaintext: str, salt: bytes = None) -> str:
        key, salt = self.derive_key(salt)
        aesgcm = AESGCM(key)
        nonce = os.urandom(12)
        ct = aesgcm.encrypt(nonce, plaintext.encode(), None)
        payload = {
            "nonce": base64.b64encode(nonce).decode(),
            "ct": base64.b64encode(ct).decode(),
            "salt": base64.b64encode(salt).decode()
        }
        return base64.b64encode(json.dumps(payload).encode()).decode()

    def decrypt(self, token: str) -> str:
        try:
            data = json.loads(base64.b64decode(token).decode())
            nonce = base64.b64decode(data["nonce"])
            ct = base64.b64decode(data["ct"])
            salt = base64.b64decode(data["salt"])
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = kdf.derive(self.master)
            aesgcm = AESGCM(key)
            pt = aesgcm.decrypt(nonce, ct, None)
            return pt.decode()
        except Exception as e:
            raise ValueError("Decryption failed")

def get_manager():
    secret = os.getenv("SECRET_KEY", "change-me")
    return EncryptionManager(secret)
