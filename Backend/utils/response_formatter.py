from rest_framework.response import Response
from rest_framework import status

def success_response(data=None, message="Success", status_code=status.HTTP_200_OK, meta=None):
    """
    Standard success response format
    
    Args:
        data: Response payload
        message: Success message
        status_code: HTTP status code
        meta: Additional metadata (pagination, counts, etc.)
    
    Returns:
        Response object with standard format
    """
    response_data = {
        'success': True,
        'message': message,
        'data': data,
        'errors': None
    }
    
    if meta:
        response_data['meta'] = meta
    
    return Response(response_data, status=status_code)


def error_response(message="Error", errors=None, status_code=status.HTTP_400_BAD_REQUEST, data=None):
    """
    Standard error response format
    
    Args:
        message: Error message
        errors: Detailed error information (dict or list)
        status_code: HTTP status code
        data: Optional partial data (for partial success scenarios)
    
    Returns:
        Response object with standard format
    """
    response_data = {
        'success': False,
        'message': message,
        'data': data,
        'errors': errors if errors else {'detail': message}
    }
    
    return Response(response_data, status=status_code)


def paginated_response(serializer_data, paginator, message="Success"):
    """
    Standard paginated response format
    
    Args:
        serializer_data: Serialized data
        paginator: DRF paginator instance
        message: Success message
    
    Returns:
        Response with pagination metadata
    """
    return success_response(
        data=serializer_data,
        message=message,
        meta={
            'pagination': {
                'count': paginator.page.paginator.count,
                'next': paginator.get_next_link(),
                'previous': paginator.get_previous_link(),
                'total_pages': paginator.page.paginator.num_pages,
                'current_page': paginator.page.number,
                'page_size': paginator.get_page_size(paginator.request)
            }
        }
    )


def validation_error_response(serializer_errors):
    """
    Format DRF serializer validation errors
    
    Args:
        serializer_errors: Serializer.errors
    
    Returns:
        Formatted error response
    """
    formatted_errors = {}
    
    for field, errors in serializer_errors.items():
        if isinstance(errors, list):
            formatted_errors[field] = errors[0] if len(errors) == 1 else errors
        else:
            formatted_errors[field] = str(errors)

    return error_response(
        message="Validation failed",
        errors=formatted_errors,
        status_code=status.HTTP_400_BAD_REQUEST
    )