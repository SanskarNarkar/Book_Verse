// ========================
// API base URL
// ========================
const API_BASE = 'http://127.0.0.1:8000/api/';
const featuredBooksContainer = document.getElementById('featured-books');


// ========================
// Function: Get Books
// ========================
async function getBooks() {
    const accessToken = localStorage.getItem('access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;

    try {
        const response = await fetch(`${API_BASE}books/`, { method: 'GET', headers });
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching books:', error);
        return [];
    }
}


async function displayFeaturedBooks() {
    const booksContainer = document.getElementById('featured-books');
    const data = await getBooks();

    if (!data || !data.results || data.results.length === 0) {
        booksContainer.innerHTML = '<p class="text-center">No books available at the moment.</p>';
        return;
    }

    const featuredBooks = data.results.slice(0, 6);
    booksContainer.innerHTML = featuredBooks.map(book => `
        <div class="col-md-4 mb-4">
            <div class="card book-card h-100 book-detail" 
                 data-title="${book.title}" 
                 data-author="${book.author}" 
                 data-description="${book.description}" 
                 data-price="${book.price}" 
                 data-image="${book.image || 'https://placehold.co/300x200?text=No+Image'}">
                <img src="${book.image || 'https://placehold.co/300x200?text=No+Image'}" 
                     class="card-img-top book-image" alt="${book.title}">
                <div class="card-body">
                    <h5 class="card-title">${book.title}</h5>
                    <p class="card-text text-muted">by ${book.author}</p>
                    <p class="card-text">${book.description ? book.description.substring(0, 100) : ''}...</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="price">$${book.price}</span>
                        <button class="btn btn-primary add-to-cart" data-book-id="${book.id}">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

    // Add event listeners for Add-to-Cart buttons
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', addToCartHandler);
    });



// ========================
// Function: Add To Cart
// ========================
async function addToCartHandler(e) {
    e.stopPropagation(); // prevent opening modal
    const bookId = e.currentTarget.dataset.bookId;
    const accessToken = localStorage.getItem('access_token');

    if (!accessToken) {
        alert('Please login to add items to your cart.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}cart-items/`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ book: bookId, quantity: 1 })
        });

        if (!response.ok) {
            const errorData = await response.json();
            alert(errorData.detail || 'Failed to add to cart.');
            return;
        }

        alert('Book added to cart!');
    } catch (error) {
        alert('Network error. Please try again later.');
    }
}


// ========================
// Function: Update Login Status
// ========================
function updateLoginStatus() {
    const accessToken = localStorage.getItem('access_token');
    const loginBtn = document.querySelector('.btn-login');
    const signupBtn = document.querySelector('.btn-signup');

    if (accessToken && loginBtn && signupBtn) {
        loginBtn.textContent = 'My Account';
        signupBtn.textContent = 'Logout';
        signupBtn.onclick = () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.reload();
        };
    }
}


// ========================
// Book Modal: Entire Card Click
// ========================
document.addEventListener('click', function (e) {
    const card = e.target.closest('.book-detail');
    if (card) {
        document.getElementById('bookDetailTitle').textContent = card.dataset.title;
        document.getElementById('bookDetailAuthor').textContent = card.dataset.author;
        document.getElementById('bookDetailPrice').textContent = card.dataset.price;
        document.getElementById('bookDetailDescription').textContent = card.dataset.description;
        document.getElementById('bookDetailImage').src = card.dataset.image;

        const modal = new bootstrap.Modal(document.getElementById('bookDetailModal'));
        modal.show();
    }
});


// ========================
// Initialize
// ========================
document.addEventListener('DOMContentLoaded', function() {
    displayFeaturedBooks();
    updateLoginStatus();
});
// ========================
// Filter by Category
// ========================
document.querySelectorAll('.category-card').forEach(card => {
    card.addEventListener('click', () => {
        const category = card.dataset.category;
        filterBooksByCategory(category);
    });
});

async function filterBooksByCategory(category) {
    const books = await getBooks();
    if (!books || books.length === 0) {
        featuredBooksContainer.innerHTML = '<p class="text-center">No books available.</p>';
        return;
    }
    const filteredBooks = books.filter(book => book.category === category);
    if (filteredBooks.length === 0) {
        featuredBooksContainer.innerHTML = '<p class="text-center">No books found in this category.</p>';
        return;
    }

    featuredBooksContainer.innerHTML = filteredBooks.map(book => `
        <div class="col-md-4 mb-4">
            <div class="card book-card h-100 book-detail"
                 data-title="${book.title}"
                 data-author="${book.author}"
                 data-description="${book.description || 'No description available.'}"
                 data-price="${book.price}"
                 data-image="${book.image || 'https://placehold.co/300x200?text=No+Image'}">
                <img src="${book.image || 'https://placehold.co/300x200?text=No+Image'}" 
                     class="card-img-top book-image" alt="${book.title}" style="object-fit: cover; height:200px;">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title">${book.title}</h5>
                    <p class="card-text text-muted">by ${book.author}</p>
                    <p class="card-text">${book.description ? book.description.substring(0, 100) : ''}...</p>
                    <div class="mt-auto d-flex justify-content-between align-items-center">
                        <span class="price">$${book.price}</span>
                        <button class="btn btn-primary add-to-cart" data-book-id="${book.id}">
                            <i class="fas fa-cart-plus"></i> Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');

    // Re-add Add-to-Cart event listeners
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', addToCartHandler);
    });
}
