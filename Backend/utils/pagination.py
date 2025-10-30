from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10  # Default number of items per page
    page_size_query_param = 'page_size'  # Allow client to control size (?page_size=20)
    max_page_size = 100  # Cap to avoid performance disaster
    page_query_param = 'page'  # Allows ?page=2, can rename if you like

class FlexiblePagination(PageNumberPagination):
    """
    Flexible pagination class that supports:
    1. Global default page size from settings
    2. Per-view custom page size
    3. Query parameter override (?page_size=20)
    4. Disabling pagination (?page_size=0 or per-view disable)
    5. Maximum page size limit for security
    """
    page_size = 20  # Default fallback
    page_size_query_param = 'page_size'
    max_page_size = 500  # Security limit
    page_query_param = 'page'

    def paginate_queryset(self, queryset, request, view=None):
        """
        Override to check if pagination is disabled at view level
        """
        # Check if view explicitly disables pagination
        if hasattr(view, 'pagination_class') and view.pagination_class is None:
            return None
        
        # Check if view has disable_pagination attribute
        if hasattr(view, 'disable_pagination') and view.disable_pagination:
            return None

        # Get dynamic page size
        page_size = self.get_page_size(request, view)
        
        # Disable pagination if page_size is None, 0, or -1
        if page_size is None or page_size <= 0:
            return None

        # Proceed with normal pagination
        return super().paginate_queryset(queryset, request, view)

    def get_page_size(self, request, view=None):
        """
        Determine page size from view, query params, or defaults
        Priority: Query Param > View Setting > Global Default
        """
        # 1. Check query parameter (?page_size=X)
        query_page_size = request.query_params.get(self.page_size_query_param)
        if query_page_size is not None:
            try:
                query_page_size = int(query_page_size)
                # Special values to disable pagination
                if query_page_size in [0, -1]:
                    return None
                # Respect max_page_size limit
                return min(query_page_size, self.max_page_size)
            except (ValueError, TypeError):
                pass  # Invalid value, fall through to defaults

        # 2. Check view-specific page_size
        if view and hasattr(view, 'page_size'):
            view_page_size = getattr(view, 'page_size')
            if view_page_size is None:
                return None  # View explicitly disables pagination
            if isinstance(view_page_size, int):
                return view_page_size

        # 3. Fall back to class default
        return self.page_size

    def get_paginated_response(self, data):
        """
        Custom response format with additional metadata
        """
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'results': data
        })


class NoPagination(PageNumberPagination):
    """
    Dummy pagination class that returns all results without pagination
    Use this for views that should never paginate
    """
    page_size = None

    def paginate_queryset(self, queryset, request, view=None):
        return None


class LargePagination(PageNumberPagination):
    """
    For views that need larger page sizes (e.g., dropdown lists)
    """
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 500