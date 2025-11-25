from apps.authentication.models import User

class TestUserMiddleware:
    """
    Allows test suite to authenticate using header `X-Test-User`.
    Only enabled in DEBUG.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        test_uid = request.headers.get("X-Test-User")

        if test_uid:
            try:
                user = User.objects.get(id=test_uid)
                # Critical: override both Django + DRF auth
                request.user = user
                request._cached_user = user   # <<< REQUIRED
                request._force_auth_user = user
            except User.DoesNotExist:
                pass

        print(">>>> TestUserMiddleware EXECUTED, user header:", request.headers.get("X-Test-User"))
        return self.get_response(request)
