const API_BASE = `${window.location.origin}/api/`;

const featuredBooksContainer = document.getElementById('featured-books');
const booksListContainer = document.getElementById('books-list');
const paginationContainer = document.getElementById('pagination');
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const categoryFilter = document.getElementById('category-filter');
const accountNavLink = document.querySelector('[data-role="nav-account"]');
const signupNavLink = document.querySelector('[data-role="nav-signup"]');
const logoutNavLink = document.querySelector('[data-role="nav-logout"]');
const loginNavLink = document.querySelector('[data-role="nav-login"]');

const urlParams = new URLSearchParams(window.location.search);
let currentPage = Number(urlParams.get('page')) || 1;
let currentSearch = urlParams.get('search') || '';
let currentCategory = urlParams.get('category') || '';
const DEFAULT_PAGE_SIZE = 9;

function escapeAttribute(value) {
    if (value == null) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function buildAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return headers;
}

async function fetchBooks(page = 1, { search = '', category = '' } = {}) {
    const params = new URLSearchParams();
    params.append('page', page);
    if (search) params.append('search', search);
    if (category) params.append('category', category);

    try {
        const response = await fetch(`${API_BASE}books/?${params.toString()}`, {
            headers: buildAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch books (${response.status})`);
        }

        const data = await response.json();
        const results = Array.isArray(data) ? data : (data.results ?? []);
        const total = typeof data.count === 'number' ? data.count : results.length;
        const perPage = results.length || DEFAULT_PAGE_SIZE;

        return {
            results,
            total,
            perPage
        };
    } catch (error) {
        console.error('Error fetching books:', error);
        return {
            results: [],
            total: 0,
            perPage: DEFAULT_PAGE_SIZE,
            error
        };
    }
}

function bookCardTemplate(book) {
    const imageSrc = escapeAttribute(book.image || 'https://placehold.co/300x200?text=No+Image');
    const priceValue = Number.parseFloat(book.price) || 0;
    const fullDescription = book.description || 'No description available.';
    const teaser = fullDescription.length > 120 ? `${fullDescription.substring(0, 120)}…` : fullDescription;
    const title = escapeAttribute(book.title);
    const author = escapeAttribute(book.author);

    return `
        <div class="col-md-4 mb-4">
            <div class="card book-card h-100 book-detail"
                data-title="${title}"
                data-author="${author}"
                data-description="${escapeAttribute(fullDescription)}"
                data-price="${priceValue.toFixed(2)}"
                data-image="${imageSrc}">
                <img src="${imageSrc}" class="card-img-top book-image" alt="${title}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${title}</h5>
                    <p class="card-text text-muted">by ${author}</p>
                    <p class="card-text text-truncate">${escapeAttribute(teaser)}</p>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <span class="price fw-bold">$${priceValue.toFixed(2)}</span>
                        <button class="btn btn-primary add-to-cart" data-book-id="${book.id}">
                            <i class="fas fa-cart-plus me-1"></i>Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function attachAddToCartListeners(root = document) {
    root.querySelectorAll('.add-to-cart').forEach((button) => {
        button.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            const bookId = button.dataset.bookId;
            const accessToken = localStorage.getItem('access_token');

            if (!accessToken) {
                alert('Please login to add items to your cart.');
                window.location.href = 'login.html';
                return;
            }

            try {
                const response = await fetch(`${API_BASE}cart-items/`, {
                    method: 'POST',
                    headers: buildAuthHeaders(),
                    body: JSON.stringify({ book_id: bookId, quantity: 1 })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || 'Failed to add to cart.');
                }

                alert('Book added to cart!');
            } catch (error) {
                console.error('Add to cart failed:', error);
                alert(error.message || 'Network error. Please try again later.');
            }
        });
    });
}

async function displayFeaturedBooks() {
    if (!featuredBooksContainer) return;

    featuredBooksContainer.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading books…</span>
            </div>
        </div>
    `;

    const { results } = await fetchBooks(1);
    if (!results.length) {
        featuredBooksContainer.innerHTML = '<p class="text-center">No books available at the moment.</p>';
        return;
    }

    const featured = results.slice(0, 6);
    featuredBooksContainer.innerHTML = featured.map(bookCardTemplate).join('');
    attachAddToCartListeners(featuredBooksContainer);
}

function renderBooksList({ results, total, perPage }) {
    if (!booksListContainer) return;

    if (!results.length) {
        booksListContainer.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center mb-0">
                    No books found. Try adjusting your filters.
                </div>
            </div>
        `;
        if (paginationContainer) paginationContainer.innerHTML = '';
        return;
    }

    booksListContainer.innerHTML = results.map(bookCardTemplate).join('');
    attachAddToCartListeners(booksListContainer);

    if (paginationContainer) {
        renderPagination(total, perPage);
    }
}

function renderPagination(total, perPage) {
    if (!paginationContainer) return;

    const totalPages = Math.max(1, Math.ceil(total / (perPage || DEFAULT_PAGE_SIZE)));

    if (totalPages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    const createPageItem = (page, label = page, disabled = false, active = false) => `
        <li class="page-item ${disabled ? 'disabled' : ''} ${active ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${page}">${label}</a>
        </li>
    `;

    let html = '';
    html += createPageItem(currentPage - 1, '&laquo;', currentPage === 1);

    for (let page = 1; page <= totalPages; page += 1) {
        html += createPageItem(page, page, false, page === currentPage);
    }

    html += createPageItem(currentPage + 1, '&raquo;', currentPage === totalPages);
    paginationContainer.innerHTML = html;

    paginationContainer.querySelectorAll('a[data-page]').forEach((link) => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const page = Number(link.dataset.page);
            if (!Number.isNaN(page) && page !== currentPage) {
                navigateToPage(page);
            }
        });
    });
}

async function loadBooksPage() {
    if (!booksListContainer) return;

    booksListContainer.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading books…</span>
            </div>
        </div>
    `;

    const result = await fetchBooks(currentPage, {
        search: currentSearch,
        category: currentCategory
    });

    renderBooksList(result);
}

function navigateToPage(page) {
    currentPage = page;
    const url = new URL(window.location.href);
    url.searchParams.set('page', page);

    if (currentSearch) {
        url.searchParams.set('search', currentSearch);
    } else {
        url.searchParams.delete('search');
    }

    if (currentCategory) {
        url.searchParams.set('category', currentCategory);
    } else {
        url.searchParams.delete('category');
    }

    window.history.replaceState({}, '', url.toString());
    loadBooksPage();
}

function handleSearchSubmit() {
    currentSearch = searchInput?.value.trim() || '';
    currentPage = 1;
    updateUrlAndReload();
}

function handleCategoryChange() {
    currentCategory = categoryFilter?.value || '';
    currentPage = 1;
    updateUrlAndReload();
}

function updateUrlAndReload() {
    const url = new URL(window.location.href);

    if (currentSearch) {
        url.searchParams.set('search', currentSearch);
    } else {
        url.searchParams.delete('search');
    }

    if (currentCategory) {
        url.searchParams.set('category', currentCategory);
    } else {
        url.searchParams.delete('category');
    }

    url.searchParams.set('page', currentPage);
    window.history.replaceState({}, '', url.toString());
    loadBooksPage();
}

function applyInitialFilters() {
    if (searchInput) searchInput.value = currentSearch;
    if (categoryFilter) categoryFilter.value = currentCategory;
}

function setupSearchControls() {
    if (searchBtn) {
        searchBtn.addEventListener('click', (event) => {
            event.preventDefault();
            handleSearchSubmit();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleSearchSubmit();
            }
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', handleCategoryChange);
    }
}

function setupCategoryShortcuts() {
    document.querySelectorAll('.category-card').forEach((card) => {
        card.addEventListener('click', () => {
            const category = card.dataset.category || '';
            const url = new URL(window.location.origin + '/books.html');
            if (category) url.searchParams.set('category', category);
            window.location.href = url.toString();
        });
    });
}

function setupHeroSearchShortcut() {
    if (!featuredBooksContainer || !searchInput) return;

    const heroSearchInput = document.getElementById('search-input');
    const heroSearchBtn = document.getElementById('search-btn');

    if (heroSearchInput && heroSearchBtn) {
        const goToBooksPage = () => {
            const query = heroSearchInput.value.trim();
            const url = new URL(window.location.origin + '/books.html');
            if (query) url.searchParams.set('search', query);
            window.location.href = url.toString();
        };

        heroSearchBtn.addEventListener('click', (event) => {
            event.preventDefault();
            goToBooksPage();
        });

        heroSearchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                goToBooksPage();
            }
        });
    }
}

function setupBookDetailModal() {
    const modalElement = document.getElementById('bookDetailModal');
    if (!modalElement) return;

    document.addEventListener('click', (event) => {
        const card = event.target.closest('.book-detail');
        if (!card) return;

        document.getElementById('bookDetailTitle').textContent = card.dataset.title;
        document.getElementById('bookDetailAuthor').textContent = card.dataset.author;
        document.getElementById('bookDetailPrice').textContent = card.dataset.price;
        document.getElementById('bookDetailDescription').textContent = card.dataset.description;
        document.getElementById('bookDetailImage').src = card.dataset.image;

        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    });
}

function updateAuthNavigation() {
    const accessToken = localStorage.getItem('access_token');

    if (accessToken) {
        if (accountNavLink) {
            accountNavLink.classList.remove('d-none');
        }
        if (signupNavLink) {
            signupNavLink.classList.add('d-none');
        }
        if (loginNavLink) {
            loginNavLink.classList.add('d-none');
        }
        if (logoutNavLink) {
            logoutNavLink.classList.remove('d-none');
            logoutNavLink.addEventListener('click', (event) => {
                event.preventDefault();
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.reload();
            });
        }
    } else {
        if (accountNavLink) {
            accountNavLink.classList.add('d-none');
        }
        if (signupNavLink) {
            signupNavLink.classList.remove('d-none');
        }
        if (loginNavLink) {
            loginNavLink.classList.remove('d-none');
        }
        if (logoutNavLink) {
            logoutNavLink.classList.add('d-none');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    updateAuthNavigation();
    setupCategoryShortcuts();
    setupBookDetailModal();

    if (featuredBooksContainer) {
        setupHeroSearchShortcut();
        displayFeaturedBooks();
    }

    if (booksListContainer) {
        applyInitialFilters();
        setupSearchControls();
        loadBooksPage();
    }
});

