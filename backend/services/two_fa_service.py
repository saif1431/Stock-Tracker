import base64
import secrets
from io import BytesIO

import pyotp
import qrcode
from qrcode.image.pure import PyPNGImage


class TwoFAService:
    @staticmethod
    def generate_secret() -> str:
        return pyotp.random_base32()

    @staticmethod
    def get_provisioning_uri(secret: str, email: str) -> str:
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=email, issuer_name="StockTrackingDashboard")

    @staticmethod
    def get_qr_code_base64(secret: str, email: str) -> str:
        uri = TwoFAService.get_provisioning_uri(secret, email)
        qr = qrcode.QRCode(version=1, box_size=8, border=2)
        qr.add_data(uri)
        qr.make(fit=True)

        img = qr.make_image(image_factory=PyPNGImage)
        buffer = BytesIO()
        img.save(buffer)
        buffer.seek(0)
        return base64.b64encode(buffer.read()).decode("utf-8")

    @staticmethod
    def verify_token(secret: str, token: str) -> bool:
        totp = pyotp.TOTP(secret)
        # valid_window allows slight clock drift while keeping verification strict.
        return bool(totp.verify(token, valid_window=1))

    @staticmethod
    def generate_backup_codes(count: int = 10) -> list[str]:
        return [secrets.token_hex(4).upper() for _ in range(count)]
