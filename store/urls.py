from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import SignupView, LogoutView, LoginView, BookViewSet, CartItemViewSet, OrderViewSet,CurrentUserView

router = DefaultRouter()
router.register('books', BookViewSet, basename='book')
router.register('cart-items', CartItemViewSet, basename='cartitem')
router.register('orders', OrderViewSet, basename='order')

urlpatterns = [
    # Authentication endpoints (these are API endpoints, so they stay here)
    path('auth/signup/', SignupView.as_view(), name='signup'),
    path('auth/login/', LoginView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', LogoutView.as_view(), name='logout'),
    path('auth/user/', CurrentUserView.as_view(), name='current_user'),
    # API routes for viewsets (these are also API endpoints)
    path('', include(router.urls)), # These will be prefixed by 'api/' from bookstore_project/urls.py
]
