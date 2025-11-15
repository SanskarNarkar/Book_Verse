from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from rest_framework import generics, status, permissions, viewsets, filters
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSignupSerializer
from .models import Book, CartItem, Order, OrderItem

from .serializers import (
    UserSignupSerializer, BookSerializer,
    CartItemSerializer, OrderSerializer
)
from .filters import BookFilter


class SignupView(generics.CreateAPIView):
    serializer_class = UserSignupSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]


class LogoutView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = BookFilter
    search_fields = ['title', 'author']

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]


class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(user=self.request.user).select_related('book')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            Order.objects.filter(user=self.request.user)
            .prefetch_related('items__book')
            .order_by('-created_at')
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'])
    def place_order(self, request):
        user = request.user
        cart_items = CartItem.objects.filter(user=user)
        if not cart_items.exists():
            return Response({"detail": "Cart is empty."}, status=status.HTTP_400_BAD_REQUEST)

        shipping_full_name = request.data.get('shipping_full_name', '').strip()
        shipping_phone = request.data.get('shipping_phone', '').strip()
        shipping_address = request.data.get('shipping_address', '').strip()
        shipping_city = request.data.get('shipping_city', '').strip()
        shipping_state = request.data.get('shipping_state', '').strip()
        shipping_postal_code = request.data.get('shipping_postal_code', '').strip()
        payment_method = request.data.get('payment_method', 'COD').upper()

        required = {
            'shipping_full_name': shipping_full_name,
            'shipping_phone': shipping_phone,
            'shipping_address': shipping_address,
            'shipping_city': shipping_city,
            'shipping_state': shipping_state,
            'shipping_postal_code': shipping_postal_code,
        }
        missing = [field for field, value in required.items() if not value]
        if missing:
            return Response(
                {"detail": "Please fill in all required shipping details.", "missing": missing},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment_method != 'COD':
            return Response(
                {"detail": "Currently only Cash on Delivery is available. Please choose COD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            order = Order.objects.create(
                user=user,
                status='processing',
                shipping_full_name=shipping_full_name,
                shipping_phone=shipping_phone,
                shipping_address=shipping_address,
                shipping_city=shipping_city,
                shipping_state=shipping_state,
                shipping_postal_code=shipping_postal_code,
                payment_method=payment_method,
                expected_delivery=timezone.now().date() + timedelta(days=5),
            )

            total = 0
            for item in cart_items.select_related('book'):
                line_total = item.quantity * item.book.price
                total += line_total
                OrderItem.objects.create(
                    order=order,
                    book=item.book,
                    quantity=item.quantity,
                    price=item.book.price
                )

            order.total_price = total
            order.save(update_fields=['total_price'])

            cart_items.delete()

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

#showing user after login
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSignupSerializer(request.user)
        return Response(serializer.data)
