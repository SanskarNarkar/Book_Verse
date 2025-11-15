// ========================
// API base URL
// ========================
const API_BASE = `${window.location.origin}/api/`;

// ========================
// LOGIN FORM HANDLER
// ========================
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const submitBtn = document.getElementById('login-submit');
        const spinner = submitBtn?.querySelector('.spinner-border');
        const errorAlert = document.getElementById('login-error');

        const email = emailInput?.value.trim();
        const password = passwordInput?.value.trim();

        if (errorAlert) {
            errorAlert.classList.add('d-none');
            errorAlert.textContent = '';
        }

        if (!email || !password) {
            if (errorAlert) {
                errorAlert.textContent = 'Please enter both email and password.';
                errorAlert.classList.remove('d-none');
            }
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        if (spinner) spinner.classList.remove('d-none');

        try {
            const response = await fetch(`${API_BASE}auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (errorAlert) {
                    errorAlert.textContent = data.detail || 'Login failed. Please try again.';
                    errorAlert.classList.remove('d-none');
                }
                return;
            }

            // Save tokens
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            window.location.href = '/';
        } catch (error) {
            if (errorAlert) {
                errorAlert.textContent = 'Network error. Please try again later.';
                errorAlert.classList.remove('d-none');
            }
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (spinner) spinner.classList.add('d-none');
        }
    });
}

// ========================
// SIGNUP FORM HANDLER
// ========================
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const usernameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const phoneInput = document.getElementById('phone');
        const passwordInput = document.getElementById('password');
        const passwordConfirmInput = document.getElementById('password2');
        const termsCheck = document.getElementById('termsCheck');
        const submitBtn = document.getElementById('signup-submit');
        const spinner = submitBtn?.querySelector('.spinner-border');
        const errorAlert = document.getElementById('signup-error');

        const username = usernameInput?.value.trim();
        const email = emailInput?.value.trim();
        const phone = phoneInput?.value.trim();
        const password = passwordInput?.value.trim();
        const password2 = passwordConfirmInput?.value.trim();

        if (errorAlert) {
            errorAlert.classList.add('d-none');
            errorAlert.textContent = '';
        }

        if (!termsCheck?.checked) {
            if (errorAlert) {
                errorAlert.textContent = 'Please accept the terms & conditions to continue.';
                errorAlert.classList.remove('d-none');
            }
            return;
        }

        if (!username || !email || !password || !password2) {
            if (errorAlert) {
                errorAlert.textContent = 'Please complete all required fields.';
                errorAlert.classList.remove('d-none');
            }
            return;
        }

        if (password.length < 8) {
            if (errorAlert) {
                errorAlert.textContent = 'Password must be at least 8 characters long.';
                errorAlert.classList.remove('d-none');
            }
            return;
        }

        if (password !== password2) {
            if (errorAlert) {
                errorAlert.textContent = 'Passwords do not match.';
                errorAlert.classList.remove('d-none');
            }
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        if (spinner) spinner.classList.remove('d-none');

        try {
            const response = await fetch(`${API_BASE}auth/signup/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password, password2, phone }),
            });

            const data = await response.json();

            if (!response.ok) {
                const firstError = Object.values(data)[0];
                if (errorAlert) {
                    errorAlert.textContent = Array.isArray(firstError) ? firstError[0] : firstError || 'Signup failed.';
                    errorAlert.classList.remove('d-none');
                }
                return;
            }

            // Redirect to login page after successful signup
            window.location.href = '/login.html';
        } catch (error) {
            if (errorAlert) {
                errorAlert.textContent = 'Network error. Please try again later.';
                errorAlert.classList.remove('d-none');
            }
        } finally {
            if (submitBtn) submitBtn.disabled = false;
            if (spinner) spinner.classList.add('d-none');
        }
    });
}

// ========================
// PASSWORD VISIBILITY TOGGLE
// ========================
document.querySelectorAll('.password-toggle').forEach((button) => {
    button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const input = document.getElementById(targetId);
        if (!input) return;

        const icon = button.querySelector('i');
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        if (icon?.classList.contains('bi')) {
            icon.classList.toggle('bi-eye');
            icon.classList.toggle('bi-eye-slash');
        }
    });
});

// ========================
// FLIP TRANSITION BETWEEN FORMS
// ========================
document.querySelectorAll('.auth-toggle').forEach((link) => {
    link.addEventListener('click', (event) => {
        const target = link.dataset.target || link.getAttribute('href');
        if (!target) return;
        event.preventDefault();
        const card = document.querySelector('.bookverse-auth-card');
        if (!card) {
            window.location.href = target;
            return;
        }
        card.classList.add('flip-out');
        setTimeout(() => {
            window.location.href = target;
        }, 450);
    });
});

