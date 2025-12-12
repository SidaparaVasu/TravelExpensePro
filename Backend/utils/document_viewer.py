import os
import mimetypes
from urllib.parse import unquote, urlparse
from django.http import FileResponse, Http404
from django.utils._os import safe_join
from django.conf import settings


def view_document_by_path(request):
    raw_path = request.GET.get("path")
    if not raw_path:
        raise Http404("File path not provided")

    # Decode encoded URL
    decoded_path = unquote(raw_path).strip()

    # -----------------------------------------
    # CASE 1: If full URL provided → extract path
    # -----------------------------------------
    # Example: http://localhost:8000/media/booking_files/file.pdf
    parsed = urlparse(decoded_path)
    if parsed.scheme and parsed.netloc:
        decoded_path = parsed.path  # Remove domain, keep only /media/...

    # -----------------------------------------
    # Clean: remove leading / and 'media/' prefix
    # -----------------------------------------
    cleaned = decoded_path.lstrip("/")

    if cleaned.startswith("media/"):
        cleaned = cleaned.replace("media/", "", 1)

    # -----------------------------------------
    # Final absolute path inside MEDIA_ROOT
    # -----------------------------------------
    try:
        absolute_path = safe_join(settings.MEDIA_ROOT, cleaned)
    except Exception:
        raise Http404("Invalid file path")

    if not os.path.exists(absolute_path):
        raise Http404("File not found")

    # Detect mime type
    content_type, _ = mimetypes.guess_type(absolute_path)

    return FileResponse(
        open(absolute_path, "rb"),
        content_type=content_type or "application/octet-stream"
    )
