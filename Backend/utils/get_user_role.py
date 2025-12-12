from apps.authentication.models.roles import UserRole

def user_is_admin(user):
    return UserRole.objects.filter(
        user=user,
        role__role_type__iexact="Admin",
        is_active=True
    ).exists()