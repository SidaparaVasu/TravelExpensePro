from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.exceptions import APIException
from rest_framework import status
from django.core.exceptions import ValidationError, PermissionDenied, ObjectDoesNotExist
from django.http import Http404
from Main import settings
from utils.response_formatter import error_response
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler for DRF views
    Returns standardized error responses
    """
    # Call DRF's default exception handler first
    response = drf_exception_handler(exc, context)
    
    # Get the view and request from context
    view = context.get('view', None)
    request = context.get('request', None)
    
    # Log the exception
    if request:
        logger.error(
            f"Exception in {view.__class__.__name__ if view else 'Unknown'}: "
            f"{exc.__class__.__name__} - {str(exc)}\n"
            f"Path: {request.path}\n"
            f"Method: {request.method}\n"
            f"User: {request.user if request.user.is_authenticated else 'Anonymous'}"
        )
    
    # Handle DRF exceptions
    if response is not None:
        error_data = response.data
        
        # Extract error message
        if isinstance(error_data, dict):
            if 'detail' in error_data:
                message = error_data['detail']
                errors = error_data
            else:
                message = "Validation failed"
                errors = error_data
        elif isinstance(error_data, list):
            message = error_data[0] if error_data else "An error occurred"
            errors = {'detail': error_data}
        else:
            message = str(error_data)
            errors = {'detail': message}
        
        return error_response(
            message=message,
            errors=errors,
            status_code=response.status_code
        )
    
    # Handle Django exceptions
    if isinstance(exc, Http404) or isinstance(exc, ObjectDoesNotExist):
        return error_response(
            message="Resource not found",
            errors={'detail': str(exc)},
            status_code=status.HTTP_404_NOT_FOUND
        )
    
    if isinstance(exc, PermissionDenied):
        return error_response(
            message="Permission denied",
            errors={'detail': str(exc)},
            status_code=status.HTTP_403_FORBIDDEN
        )
    
    if isinstance(exc, ValidationError):
        return error_response(
            message="Validation error",
            errors={'detail': exc.message_dict if hasattr(exc, 'message_dict') else str(exc)},
            status_code=status.HTTP_400_BAD_REQUEST
        )
    
    # Handle unexpected exceptions
    logger.exception(f"Unhandled exception: {exc}")
    
    return error_response(
        message="An unexpected error occurred",
        errors={'detail': str(exc) if settings.DEBUG else 'Internal server error'},
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
    )