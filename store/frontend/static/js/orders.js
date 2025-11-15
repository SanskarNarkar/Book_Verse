const API_BASE = `${window.location.origin}/api/`;

const ordersContainer = document.getElementById('orders-container');

const loginNavLink = document.querySelector('[data-role="nav-login"]');
const signupNavLink = document.querySelector('[data-role="nav-signup"]');
const accountNavLink = document.querySelector('[data-role="nav-account"]');
const logoutNavLink = document.querySelector('[data-role="nav-logout"]');

const STATUS_SEQUENCE = ['pending', 'processing', 'shipped', 'out_for_delivery', 'delivered'];

function formatPrice(value) {
  return (Number(value) || 0).toFixed(2);
}

function requireAuth() {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    alert('Please login to view your orders.');
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

function buildAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  const accessToken = localStorage.getItem('access_token');
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  return headers;
}

async function fetchOrders() {
  if (!ordersContainer || !requireAuth()) return;

  ordersContainer.innerHTML = `
    <div class="text-center py-4">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading orders…</span>
      </div>
    </div>
  `;

  try {
    const response = await fetch(`${API_BASE}orders/`, {
      headers: buildAuthHeaders()
    });

    if (!response.ok) throw new Error('Failed to fetch orders');

    const orders = await response.json();
    renderOrders(orders);
  } catch (error) {
    console.error('Order load failed:', error);
    ordersContainer.innerHTML = `
      <div class="alert alert-danger mb-0" role="alert">
        We could not load your orders right now. Please refresh the page.
      </div>
    `;
  }
}

function renderOrders(orders) {
  if (!ordersContainer) return;

  if (!orders || !orders.length) {
    ordersContainer.innerHTML = `
      <div class="orders-empty text-center">
        <div class="mb-3">
          <i class="fas fa-box-open fa-3x text-primary"></i>
        </div>
        <h5 class="mb-2">No orders yet</h5>
        <p class="text-muted mb-4">Your purchases will appear here as soon as you place your first order.</p>
        <a href="books.html" class="btn btn-primary">
          <i class="fas fa-book me-2"></i>Start shopping
        </a>
      </div>
    `;
    return;
  }

  const cards = orders.map((order) => renderOrderCard(order)).join('');
  ordersContainer.innerHTML = cards;
}

function renderOrderCard(order) {
  const createdAt = new Date(order.created_at);
  const items = (order.items || []).map(
    (item) => `
      <tr>
        <td>
          <strong>${item.book?.title || 'Unknown'}</strong>
          <div class="small text-muted">${item.book?.author || ''}</div>
        </td>
        <td>${item.quantity}</td>
        <td>$${formatPrice(item.price)}</td>
        <td>$${formatPrice(item.price * item.quantity)}</td>
      </tr>
    `
  ).join('');

  const statusBadge = `<span class="badge badge-status ${order.status}">${order.status_display || order.status}</span>`;
  const paymentBadgeClass = order.payment_method === 'COD' ? 'payment-badge cod' : 'payment-badge';
  const paymentBadge = `<span class="${paymentBadgeClass}">${order.payment_method_display || order.payment_method}</span>`;
  const trackingInfo = order.tracking_number
    ? `<div class="small text-muted">Tracking ID: <span class="fw-semibold">${order.tracking_number}</span></div>`
    : `<div class="small text-muted fst-italic">Tracking details will appear when your order ships.</div>`;
  const expectedDelivery = order.expected_delivery
    ? `<div class="small text-muted mt-2"><i class="fas fa-calendar-alt me-2 text-primary"></i>Expected delivery: ${formatDate(order.expected_delivery)}</div>`
    : '';

  return `
    <div class="card order-card">
      <div class="card-header d-flex flex-column flex-xl-row justify-content-between align-items-xl-center gap-3">
        <div>
          <div class="d-flex align-items-center gap-3 mb-1">
            <h5 class="mb-0">Order #${order.id}</h5>
            ${statusBadge}
          </div>
          <small class="text-muted">
            Placed on ${createdAt.toLocaleDateString()} at ${createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </small>
        </div>
        <div class="text-xl-end">
          ${paymentBadge}
          ${trackingInfo}
          ${expectedDelivery}
        </div>
      </div>
      <div class="card-body">
        ${renderProgress(order.status)}
        <div class="row g-4 mt-3">
          <div class="col-lg-7">
            <div class="table-responsive">
              <table class="table align-middle mb-0">
                <thead class="table-light">
                  <tr>
                    <th>Book</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${items}
                </tbody>
              </table>
            </div>
          </div>
          <div class="col-lg-5">
            <div class="orders-address h-100">
              <h6 class="text-uppercase text-muted fw-semibold mb-3">
                <i class="fas fa-map-marker-alt me-2 text-primary"></i>Shipping address
              </h6>
              <p class="mb-1 fw-semibold">${order.shipping_full_name || '-'}</p>
              <p class="mb-1">${order.shipping_address || '-'}</p>
              <p class="mb-1">${order.shipping_city || ''}, ${order.shipping_state || ''} ${order.shipping_postal_code || ''}</p>
              <p class="mb-0"><span class="text-muted">Phone:</span> ${order.shipping_phone || '-'}</p>
            </div>
          </div>
        </div>
      </div>
      <div class="card-footer d-flex flex-column flex-md-row justify-content-between align-items-md-center">
        <small class="text-muted mb-2 mb-md-0">Need help? Contact support with your order ID for quick assistance.</small>
        <h5 class="mb-0">Total paid on delivery: $${formatPrice(order.total_price)}</h5>
      </div>
    </div>
  `;
}

function renderProgress(status) {
  const currentIndex = STATUS_SEQUENCE.indexOf(status);
  const steps = STATUS_SEQUENCE.map((step, index) => {
    const completed = index <= currentIndex;
    const label = stepLabel(step);
    return `
      <div class="order-progress-step ${completed ? 'completed' : ''}">
        <div class="step-indicator">${index + 1}</div>
        <span>${label}</span>
      </div>
    `;
  }).join('');

  return `
    <div class="order-progress">
      ${steps}
    </div>
  `;
}

function stepLabel(step) {
  switch (step) {
    case 'pending':
      return 'Order Placed';
    case 'processing':
      return 'Processing';
    case 'shipped':
      return 'Shipped';
    case 'out_for_delivery':
      return 'Out for Delivery';
    case 'delivered':
      return 'Delivered';
    default:
      return step;
  }
}

function formatDate(dateString) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
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
  fetchOrders();
});
