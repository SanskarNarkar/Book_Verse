from django.shortcuts import render

def index_page(request):
    return render(request, 'index.html')

def books_page(request):
    return render(request, 'books.html')

def cart_page(request):
    return render(request, 'cart.html')

def orders_page(request):
    return render(request, 'orders.html')

def login_page(request):
    return render(request, 'login.html')

def signup_page(request):
    return render(request, 'signup.html')

def account_page(request):
    return render(request, 'account.html')