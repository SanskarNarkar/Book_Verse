from rest_framework import serializers
from .models import User, Book, Category, CartItem, Order, OrderItem
from django.contrib.auth.password_validation import validate_password

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'phone']

class UserSignupSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['email', 'username', 'phone', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create(
            email=validated_data['email'],
            username=validated_data['username'],
            phone=validated_data.get('phone', '')
        )
        user.set_password(validated_data['password'])
        user.save()
        return user

class BookSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = ['id', 'title', 'author', 'price', 'ISBN', 'image', 'description', 'category', 'category_display']

    def get_image(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        image_url = obj.image.url
        return request.build_absolute_uri(image_url) if request else image_url

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class CartItemSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)
    book_id = serializers.PrimaryKeyRelatedField(queryset=Book.objects.all(), source='book', write_only=True)

    class Meta:
        model = CartItem
        fields = ['id', 'book', 'book_id', 'quantity']

class OrderItemSerializer(serializers.ModelSerializer):
    book = BookSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = ['id', 'book', 'quantity', 'price']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total_price = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'user',
            'created_at',
            'status',
            'status_display',
            'total_price',
            'items',
            'shipping_full_name',
            'shipping_phone',
            'shipping_address',
            'shipping_city',
            'shipping_state',
            'shipping_postal_code',
            'payment_method',
            'payment_method_display',
            'tracking_number',
            'expected_delivery',
        ]
        read_only_fields = ['user', 'created_at', 'total_price', 'tracking_number', 'expected_delivery']

    def get_total_price(self, obj):
        return sum(item.price * item.quantity for item in obj.items.all())
