from django.http import FileResponse, Http404
from django.conf import settings
import os

def view_document_by_path(request):
    file_path = request.GET.get("path")

    if not file_path:
        raise Http404("File path not provided")

    # Clean up and prevent path traversal attack
    sanitized_path = file_path.lstrip("/")

    # Build absolute path
    absolute_path = os.path.join(settings.MEDIA_ROOT, sanitized_path.replace("media/", ""))

    if not os.path.exists(absolute_path):
        raise Http404("File not found")

    return FileResponse(open(absolute_path, "rb"))
