from apps.travel.models.audit import AuditLog
from django.contrib.contenttypes.models import ContentType

def log_action(user, action, obj, changes=None, request=None):
    """
    Log an audit action
    
    Args:
        user: User who performed action
        action: Action type ('create', 'update', etc.)
        obj: Object being acted upon
        changes: Dict of changes made
        request: HttpRequest object for IP/user agent
    """
    content_type = ContentType.objects.get_for_model(obj)
    
    audit_data = {
        'user': user,
        'action': action,
        'content_type': content_type,
        'object_id': obj.id,
        'changes': changes or {}
    }
    
    if request:
        audit_data['ip_address'] = get_client_ip(request)
        audit_data['user_agent'] = request.META.get('HTTP_USER_AGENT', '')[:500]
    
    AuditLog.objects.create(**audit_data)

def get_client_ip(request):
    """Extract client IP from request"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

def get_object_changes(old_obj, new_obj, fields):
    """Compare two objects and return changes"""
    changes = {}
    for field in fields:
        old_value = getattr(old_obj, field, None)
        new_value = getattr(new_obj, field, None)
        if old_value != new_value:
            changes[field] = {
                'old': str(old_value),
                'new': str(new_value)
            }
    return changes