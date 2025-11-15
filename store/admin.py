from django.contrib import admin
from .models import User, Book, Category, CartItem, Order, OrderItem

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('id', 'email', 'username', 'phone', 'is_staff', 'is_active')
    search_fields = ('email', 'username', 'phone')
    list_filter = ('is_staff', 'is_active')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'author', 'price', 'category')
    search_fields = ('title', 'author')
    list_filter = ('category',)

@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'book', 'quantity')
    search_fields = ('user__email', 'book__title')

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    readonly_fields = ('book', 'quantity', 'price')
    can_delete = False
    extra = 0

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total_price', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('user__email',)
    readonly_fields = ('created_at', 'total_price')
    inlines = [OrderItemInline]
