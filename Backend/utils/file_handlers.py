from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
import os

def generate_thumbnail(image_file, size=(200, 200)):
    """Generate thumbnail for image"""
    try:
        img = Image.open(image_file)
        img.thumbnail(size, Image.LANCZOS)
        
        thumb_io = BytesIO()
        img.save(thumb_io, format='JPEG', quality=85)
        
        thumbnail = ContentFile(thumb_io.getvalue())
        return thumbnail
    except Exception as e:
        print(f"Thumbnail generation failed: {e}")
        return None

def validate_file_content(file):
    """Validate file is not corrupted"""
    try:
        # For images
        if file.name.lower().endswith(('.jpg', '.jpeg', '.png')):
            img = Image.open(file)
            img.verify()
        
        # For PDFs
        elif file.name.lower().endswith('.pdf'):
            import PyPDF2
            pdf = PyPDF2.PdfFileReader(file)
            pdf.getNumPages()  # Will raise error if corrupted
        
        return True, "File is valid"
    except Exception as e:
        return False, f"File validation failed: {str(e)}"