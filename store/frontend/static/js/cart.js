const API_BASE = `${window.location.origin}/api/`;

const cartContainer = document.getElementById('cart-container');
const cartTotalEl = document.getElementById('cart-total');
const checkoutForm = document.getElementById('checkout-form');
const placeOrderBtn = document.getElementById('place-order-btn');
const checkoutTotalEl = document.getElementById('checkout-total');
const checkoutError = document.getElementById('checkout-error');

const loginNavLink = document.querySelector('[data-role="nav-login"]');
const signupNavLink = document.querySelector('[data-role="nav-signup"]');
const accountNavLink = document.querySelector('[data-role="nav-account"]');
const logoutNavLink = document.querySelector('[data-role="nav-logout"]');

let cartItems = [];

function buildAuthHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

function requireAuth() {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    alert('Please login to view your cart.');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function formatPrice(value) {
  const number = Number(value) || 0;
  return number.toFixed(2);
}

async function fetchCartItems() {
  if (!cartContainer || !requireAuth()) return;

  cartContainer.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading cart…</span>
      </div>
    </div>
  `;

  try {
    const response = await fetch(`${API_BASE}cart-items/`, {
      headers: buildAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch cart items');

    cartItems = await response.json();
    renderCart();
  } catch (error) {
    console.error('Cart load failed:', error);
    cartContainer.innerHTML = `
      <div class="alert alert-danger mb-0" role="alert">
        We could not load your cart right now. Please refresh the page.
      </div>
    `;
    if (placeOrderBtn) placeOrderBtn.disabled = true;
  }
}

function renderCart() {
  if (!cartContainer) return;
  const hasItems = cartItems.length > 0;

  if (!hasItems) {
    cartContainer.innerHTML = `
      <div class="text-center py-5">
        <h5>Your cart is empty.</h5>
        <p class="text-muted mb-4">Add some books to begin checkout.</p>
        <a href="books.html" class="btn btn-outline-primary">
          <i class="fas fa-book me-2"></i>Browse Books
        </a>
      </div>
    `;
    if (cartTotalEl) cartTotalEl.textContent = '0.00';
    if (checkoutTotalEl) checkoutTotalEl.textContent = '0.00';
    if (placeOrderBtn) placeOrderBtn.disabled = true;
    toggleCheckoutForm(false);
    return;
  }

  let total = 0;
  const rows = cartItems.map((item) => {
    const bookTitle = item.book?.title || 'Unknown';
    const price = Number(item.book?.price) || 0;
    const subtotal = price * item.quantity;
    total += subtotal;

    return `
      <tr data-id="${item.id}">
        <td>
          <strong>${bookTitle}</strong>
          <div class="small text-muted">${item.book?.author || ''}</div>
        </td>
        <td>$${formatPrice(price)}</td>
        <td style="width: 120px;">
          <input type="number" min="1" class="form-control quantity-input" value="${item.quantity}">
        </td>
        <td>$${formatPrice(subtotal)}</td>
        <td class="text-center">
          <button class="btn btn-outline-danger btn-sm remove-btn" title="Remove item">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  });

  cartContainer.innerHTML = `
    <div class="table-responsive">
      <table class="table align-middle">
        <thead class="table-light">
          <tr>
            <th scope="col">Book</th>
            <th scope="col">Price</th>
            <th scope="col">Quantity</th>
            <th scope="col">Subtotal</th>
            <th scope="col">Remove</th>
          </tr>
        </thead>
        <tbody>
          ${rows.join('')}
        </tbody>
      </table>
    </div>
  `;

  if (cartTotalEl) cartTotalEl.textContent = formatPrice(total);
  if (checkoutTotalEl) checkoutTotalEl.textContent = formatPrice(total);
  if (placeOrderBtn) placeOrderBtn.disabled = false;
  toggleCheckoutForm(true);

  cartContainer.querySelectorAll('.quantity-input').forEach((input) => {
    input.addEventListener('change', onQuantityChange);
  });

  cartContainer.querySelectorAll('.remove-btn').forEach((button) => {
    button.addEventListener('click', onRemoveItem);
  });
}

async function onQuantityChange(event) {
  const input = event.target;
  const newQuantity = Number.parseInt(input.value, 10);

  if (Number.isNaN(newQuantity) || newQuantity < 1) {
    alert('Quantity must be at least 1');
    input.value = '1';
    return;
  }

  const row = input.closest('tr');
  const cartItemId = row?.dataset.id;
  if (!cartItemId) return;

  try {
    const response = await fetch(`${API_BASE}cart-items/${cartItemId}/`, {
      method: 'PATCH',
      headers: buildAuthHeaders(),
      body: JSON.stringify({ quantity: newQuantity })
    });

    if (!response.ok) throw new Error('Failed to update quantity');

    const updatedItem = await response.json();
    const index = cartItems.findIndex((item) => item.id === updatedItem.id);
    if (index !== -1) {
      cartItems[index] = { ...cartItems[index], quantity: updatedItem.quantity };
      renderCart();
    }
  } catch (error) {
    console.error('Quantity update failed:', error);
    alert('Failed to update quantity. Please try again.');
  }
}

async function onRemoveItem(event) {
  if (!confirm('Remove this item from your cart?')) return;

  const row = event.currentTarget.closest('tr');
  const cartItemId = row?.dataset.id;
  if (!cartItemId) return;

  try {
    const response = await fetch(`${API_BASE}cart-items/${cartItemId}/`, {
      method: 'DELETE',
      headers: buildAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to remove item');

    cartItems = cartItems.filter((item) => String(item.id) !== String(cartItemId));
    renderCart();
  } catch (error) {
    console.error('Remove item failed:', error);
    alert('Failed to remove item. Please try again.');
  }
}

function toggleCheckoutForm(enabled) {
  if (!checkoutForm) return;
  checkoutForm.querySelectorAll('input, textarea, button').forEach((element) => {
    const insideDisabledPayment = element.closest('.payment-option.disabled');
    if (element === placeOrderBtn) {
      element.disabled = !enabled;
    } else if (insideDisabledPayment) {
      element.disabled = true;
    } else {
      element.disabled = !enabled;
    }
  });
  if (!enabled && checkoutError) {
    checkoutError.classList.add('d-none');
    checkoutError.textContent = '';
  }
}

async function placeOrder(event) {
  event.preventDefault();
  if (!placeOrderBtn || placeOrderBtn.disabled) return;
  if (!requireAuth()) return;

  const formData = {
    shipping_full_name: document.getElementById('shipping_full_name')?.value.trim(),
    shipping_phone: document.getElementById('shipping_phone')?.value.trim(),
    shipping_address: document.getElementById('shipping_address')?.value.trim(),
    shipping_city: document.getElementById('shipping_city')?.value.trim(),
    shipping_state: document.getElementById('shipping_state')?.value.trim(),
    shipping_postal_code: document.getElementById('shipping_postal_code')?.value.trim(),
    payment_method: document.querySelector('input[name="payment_method"]:checked')?.value,
  };

  const missing = Object.entries(formData)
    .filter(([key, value]) => key !== 'payment_method' && !value)
    .map(([key]) => key);

  if (missing.length) {
    showCheckoutError('Please complete all required delivery fields before placing your order.');
    return;
  }

  if (formData.payment_method !== 'COD') {
    showCheckoutError('Currently only Cash on Delivery is available. Please select COD.');
    return;
  }

  const spinner = placeOrderBtn.querySelector('.spinner-border');
  placeOrderBtn.disabled = true;
  if (spinner) spinner.classList.remove('d-none');
  showCheckoutError('');

  try {
    const response = await fetch(`${API_BASE}orders/place_order/`, {
      method: 'POST',
      headers: buildAuthHeaders(),
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (!response.ok) {
      const errorMessage = data.detail || 'Failed to place order. Please try again.';
      if (Array.isArray(data.missing) && data.missing.length) {
        showCheckoutError(`${errorMessage} Missing: ${data.missing.join(', ')}`);
      } else {
        showCheckoutError(errorMessage);
      }
      return;
    }

    alert('Your order has been placed successfully! Track it from the Orders page.');
    cartItems = [];
    renderCart();
    window.location.href = 'orders.html';
  } catch (error) {
    console.error('Order placement failed:', error);
    showCheckoutError(error.message || 'Failed to place order. Please try again later.');
  } finally {
    if (spinner) spinner.classList.add('d-none');
    placeOrderBtn.disabled = false;
  }
}

function showCheckoutError(message) {
  if (!checkoutError) return;
  if (!message) {
    checkoutError.classList.add('d-none');
    checkoutError.textContent = '';
    return;
  }
  checkoutError.textContent = message;
  checkoutError.classList.remove('d-none');
}

function updateAuthNavigation() {
  const accessToken = localStorage.getItem('access_token');

  if (accessToken) {
    accountNavLink?.classList.remove('d-none');
    loginNavLink?.classList.add('d-none');
    signupNavLink?.classList.add('d-none');
    if (logoutNavLink) {
      logoutNavLink.classList.remove('d-none');
      logoutNavLink.addEventListener('click', (event) => {
        event.preventDefault();
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = 'login.html';
      }, { once: true });
    }
  } else {
    accountNavLink?.classList.add('d-none');
    loginNavLink?.classList.remove('d-none');
    signupNavLink?.classList.remove('d-none');
    logoutNavLink?.classList.add('d-none');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  updateAuthNavigation();
  fetchCartItems();
  checkoutForm?.addEventListener('submit', placeOrder);
});

