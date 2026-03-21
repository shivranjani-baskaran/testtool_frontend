import logging
from typing import Optional
from config.settings import (
    AZURE_EMAIL_CONNECTION_STRING,
    AZURE_EMAIL_SENDER,
    FRONTEND_URL,
)

logger = logging.getLogger(__name__)


def send_test_link_email(
    recipient_email: str,
    candidate_name: Optional[str],
    test_link: str,
    temp_password: str,
    session_id: str,
) -> bool:
    """
    Send test link email via Azure Communication Services.
    Returns True on success, False on failure.
    """
    if not AZURE_EMAIL_CONNECTION_STRING:
        logger.warning("Azure Email connection string not configured. Email not sent.")
        return False

    try:
        from azure.communication.email import EmailClient

        client = EmailClient.from_connection_string(AZURE_EMAIL_CONNECTION_STRING)

        display_name = candidate_name or recipient_email.split("@")[0]
        html_body = _build_email_html(display_name, test_link, temp_password)
        plain_body = _build_email_plain(display_name, test_link, temp_password)

        message = {
            "senderAddress": AZURE_EMAIL_SENDER,
            "recipients": {
                "to": [{"address": recipient_email, "displayName": display_name}]
            },
            "content": {
                "subject": "Your AI Assessment Test Link",
                "plainText": plain_body,
                "html": html_body,
            },
        }

        poller = client.begin_send(message)
        result = poller.result()
        logger.info("Email sent successfully: %s", result.get("id", "unknown"))
        return True

    except ImportError:
        logger.warning(
            "azure-communication-email package not installed. Email not sent."
        )
        return False
    except Exception as exc:
        logger.error("Failed to send email: %s", exc)
        return False


def _build_email_html(name: str, test_link: str, password: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background:#f4f4f4; margin:0; padding:0;">
  <div style="max-width:600px; margin:40px auto; background:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.1);">
    <div style="background:#1e3a8a; color:#ffffff; padding:24px 32px;">
      <h1 style="margin:0; font-size:22px;">AI Interview Assessment</h1>
    </div>
    <div style="padding:32px;">
      <p style="font-size:16px; color:#333;">Hello {name},</p>
      <p style="color:#555;">You have been invited to take an AI-powered technical assessment. Please use the credentials below to access your test.</p>
      <div style="background:#f8f9fa; border:1px solid #e9ecef; border-radius:6px; padding:20px; margin:24px 0;">
        <p style="margin:0 0 8px; font-size:13px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">Your Test Link</p>
        <a href="{test_link}" style="color:#2563eb; word-break:break-all; font-size:14px;">{test_link}</a>
        <p style="margin:16px 0 8px; font-size:13px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">Temporary Password</p>
        <code style="font-size:18px; font-weight:bold; color:#1e3a8a; letter-spacing:0.1em;">{password}</code>
      </div>
      <p style="color:#555; font-size:14px;">Please complete the test in one sitting. Each question has a time limit. Good luck!</p>
      <a href="{test_link}" style="display:inline-block; background:#2563eb; color:#ffffff; text-decoration:none; padding:12px 28px; border-radius:6px; font-weight:bold; margin-top:8px;">Start Assessment</a>
    </div>
    <div style="background:#f8f9fa; padding:16px 32px; font-size:12px; color:#9ca3af; text-align:center;">
      This is an automated message. Please do not reply.
    </div>
  </div>
</body>
</html>
"""


def _build_email_plain(name: str, test_link: str, password: str) -> str:
    return f"""Hello {name},

You have been invited to take an AI-powered technical assessment.

Test Link: {test_link}
Temporary Password: {password}

Please complete the test in one sitting. Each question has a time limit.

Good luck!

---
This is an automated message. Please do not reply.
"""
