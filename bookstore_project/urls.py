"""
URL configuration for bookstore_project project.
...
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
# Import your frontend views
from store.frontend_views import (
    index_page,
    books_page,
    cart_page,
    orders_page,
    login_page,
    signup_page,
    account_page,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Frontend HTML pages
    path('', index_page, name='index'),
    path('books.html', books_page, name='books'),
    path('cart.html', cart_page, name='cart'),
    path('orders.html', orders_page, name='orders'),
    path('login.html', login_page, name='login'),
    path('signup.html', signup_page, name='signup_page'),
    path('account.html', account_page, name='account'),

    # API routes (all under /api/)
    path('api/', include('store.urls')), # This includes your store/urls.py for API endpoints
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Serve static files during development
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

