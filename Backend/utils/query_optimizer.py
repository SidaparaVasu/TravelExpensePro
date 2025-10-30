from django.db import connection
from functools import wraps
import time

def log_queries(func):
    """Decorator to log SQL queries"""
    @wraps(func)
    def wrapper(*args, **kwargs):
        from django.conf import settings
        if not settings.DEBUG:
            return func(*args, **kwargs)
        
        initial_queries = len(connection.queries)
        start_time = time.time()
        
        result = func(*args, **kwargs)
        
        end_time = time.time()
        final_queries = len(connection.queries)
        
        print(f"\n{'='*60}")
        print(f"Function: {func.__name__}")
        print(f"Queries: {final_queries - initial_queries}")
        print(f"Time: {end_time - start_time:.4f}s")
        print(f"{'='*60}\n")
        
        return result
    return wrapper


def optimize_queryset(queryset, select_related=None, prefetch_related=None):
    """Helper to optimize queryset"""
    if select_related:
        queryset = queryset.select_related(*select_related)
    
    if prefetch_related:
        queryset = queryset.prefetch_related(*prefetch_related)
    
    return queryset