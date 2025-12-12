import os
import mimetypes
from urllib.parse import unquote
from django.http import FileResponse, Http404
from django.utils._os import safe_join
from django.conf import settings

def view_document_by_path(request):
    raw_path = request.GET.get("path")
    if not raw_path:
        raise Http404("File path not provided")

    # Decode URL-encoded paths
    decoded_path = unquote(raw_path).strip()

    # Remove leading slashes and /media/ prefix
    cleaned = decoded_path.lstrip("/").replace("media/", "")

    try:
        absolute_path = safe_join(settings.MEDIA_ROOT, cleaned)
    except Exception:
        raise Http404("Invalid file path")

    if not os.path.exists(absolute_path):
        raise Http404("File not found")

    # Detect mime type
    content_type, _ = mimetypes.guess_type(absolute_path)

    return FileResponse(open(absolute_path, "rb"), content_type=content_type or "application/octet-stream")
