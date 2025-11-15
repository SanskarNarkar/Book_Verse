const API_BASE = `${window.location.origin}/api/`;

const profileNameEl = document.getElementById('profile-name');
const profileUsernameEl = document.getElementById('profile-username');
const profileEmailEl = document.getElementById('profile-email');
const profilePhoneEl = document.getElementById('profile-phone');
const ordersPreviewContainer = document.getElementById('orders-preview');

const loginNavLink = document.querySelector('[data-role="nav-login"]');
const signupNavLink = document.querySelector('[data-role="nav-signup"]');
const accountNavLink = document.querySelector('[data-role="nav-account"]');
const logoutNavLink = document.querySelector('[data-role="nav-logout"]');

function buildAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

function requireAuth() {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

async function fetchCurrentUser() {
  try {
    const response = await fetch(`${API_BASE}auth/user/`, {
      headers: buildAuthHeaders()
    });
    if (!response.ok) throw new Error('Unable to load user profile.');
    return await response.json();
  } catch (error) {
    console.error('Profile load failed:', error);
    alert('We could not load your profile. Please login again.');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = 'login.html';
    return null;
  }
}

function renderProfile(user) {
  if (!user) return;
  if (profileNameEl) profileNameEl.textContent = user.username || 'Not provided';
  if (profileUsernameEl) profileUsernameEl.textContent = user.username || 'Not provided';
  if (profileEmailEl) profileEmailEl.textContent = user.email || 'Not provided';
  if (profilePhoneEl) profilePhoneEl.textContent = user.phone || 'Not provided';
}

async function fetchRecentOrders(limit = 3) {
  try {
    const response = await fetch(`${API_BASE}orders/`, {
      headers: buildAuthHeaders()
    });
    if (!response.ok) throw new Error('Unable to load orders.');
    const orders = await response.json();
    return orders.slice(0, limit);
  } catch (error) {
    console.error('Orders preview failed:', error);
    return null;
  }
}

function renderOrdersPreview(orders) {
  if (!ordersPreviewContainer) return;

  if (!orders) {
    ordersPreviewContainer.innerHTML = `
      <div class="alert alert-danger mb-0" role="alert">
        We could not load your recent orders.
      </div>
    `;
    return;
  }

  if (!orders.length) {
    ordersPreviewContainer.innerHTML = `
      <div class="text-center py-4 text-muted">
        <p class="mb-1">You have not placed any orders yet.</p>
        <a href="books.html" class="btn btn-primary mt-2">
          <i class="fas fa-book me-2"></i>Browse Books
        </a>
      </div>
    `;
    return;
  }

  const cards = orders.map((order) => {
    const createdAt = new Date(order.created_at);
    const totalItems = (order.items || []).reduce((sum, item) => sum + item.quantity, 0);
    const statusBadge = `<span class="badge badge-status ${order.status}">${order.status_display || order.status}</span>`;
    const paymentLabel = order.payment_method_display || order.payment_method || 'COD';
    const paymentBadgeClass = order.payment_method === 'COD' ? 'payment-badge cod' : 'payment-badge';

    return `
      <div class="border rounded p-3 shadow-sm">
        <div class="d-flex justify-content-between align-items-start gap-3">
          <div>
            <h6 class="mb-1">Order #${order.id}</h6>
            <small class="text-muted d-block">
              ${createdAt.toLocaleDateString()} &middot; ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </small>
            <div class="mt-2 small text-muted">
              <i class="fas fa-map-marker-alt me-2 text-primary"></i>${order.shipping_city || '-'}, ${order.shipping_state || ''}
            </div>
          </div>
          <div class="text-end">
            ${statusBadge}
            <div class="${paymentBadgeClass} mt-2">${paymentLabel}</div>
          </div>
        </div>
        <div class="d-flex justify-content-between align-items-center mt-3">
          <div class="text-muted small">
            ${totalItems} item${totalItems !== 1 ? 's' : ''} · Total $${(Number(order.total_price) || 0).toFixed(2)}
          </div>
          <a href="orders.html" class="btn btn-sm btn-outline-secondary">View details</a>
        </div>
      </div>
    `;
  });

  ordersPreviewContainer.innerHTML = cards.join('');
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

document.addEventListener('DOMContentLoaded', async () => {
  updateAuthNavigation();
  if (!requireAuth()) return;

  const user = await fetchCurrentUser();
  if (user) renderProfile(user);

  const recentOrders = await fetchRecentOrders();
  renderOrdersPreview(recentOrders);
});

