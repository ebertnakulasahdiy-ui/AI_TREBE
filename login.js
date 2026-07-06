document.addEventListener('DOMContentLoaded', () => {
    const session = localStorage.getItem('aitrebe_session');
    if (session) { window.location.href = 'index.html'; return; }

    const form = document.getElementById('loginForm');
    const nameInput = document.getElementById('loginName');
    const emailInput = document.getElementById('loginEmail');
    const passwordInput = document.getElementById('loginPassword');
    const togglePassword = document.getElementById('togglePassword');
    const loginBtn = document.getElementById('loginBtn');

    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        togglePassword.querySelector('i').className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    });

    nameInput.addEventListener('input', () => validateField('name'));
    emailInput.addEventListener('input', () => validateField('email'));
    passwordInput.addEventListener('input', () => validateField('password'));

    function validateField(field) {
        if (field === 'name') {
            const err = document.getElementById('nameError'), grp = document.getElementById('nameGroup');
            if (nameInput.value.trim().length < 2 && nameInput.value.length > 0) {
                err.textContent = 'Nama minimal 2 karakter'; grp.classList.add('error'); grp.classList.remove('valid'); return false;
            } else if (nameInput.value.trim().length >= 2) {
                err.textContent = ''; grp.classList.remove('error'); grp.classList.add('valid'); return true;
            }
            err.textContent = ''; grp.classList.remove('error', 'valid'); return false;
        }
        if (field === 'email') {
            const err = document.getElementById('emailError'), grp = document.getElementById('emailGroup');
            const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!re.test(emailInput.value) && emailInput.value.length > 0) {
                err.textContent = 'Format email tidak valid'; grp.classList.add('error'); grp.classList.remove('valid'); return false;
            } else if (re.test(emailInput.value)) {
                err.textContent = ''; grp.classList.remove('error'); grp.classList.add('valid'); return true;
            }
            err.textContent = ''; grp.classList.remove('error', 'valid'); return false;
        }
        if (field === 'password') {
            const err = document.getElementById('passwordError'), grp = document.getElementById('passwordGroup');
            if (passwordInput.value.length < 6 && passwordInput.value.length > 0) {
                err.textContent = 'Password minimal 6 karakter'; grp.classList.add('error'); grp.classList.remove('valid'); return false;
            } else if (passwordInput.value.length >= 6) {
                err.textContent = ''; grp.classList.remove('error'); grp.classList.add('valid'); return true;
            }
            err.textContent = ''; grp.classList.remove('error', 'valid'); return false;
        }
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const v1 = validateField('name'), v2 = validateField('email'), v3 = validateField('password');
        if (!v1 || !v2 || !v3) { form.classList.add('shake'); setTimeout(() => form.classList.remove('shake'), 500); return; }

        const btnText = loginBtn.querySelector('.btn-text'), btnLoader = loginBtn.querySelector('.btn-loader');
        btnText.style.display = 'none'; btnLoader.style.display = 'inline-flex'; loginBtn.disabled = true;

        setTimeout(() => {
            const userData = {
                name: nameInput.value.trim(),
                email: emailInput.value.trim(),
                loginTime: new Date().toISOString(),
                avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(nameInput.value.trim()) + '&background=6366f1&color=fff&size=150&bold=true'
            };
            localStorage.setItem('aitrebe_session', JSON.stringify(userData));
            localStorage.setItem('aitrebe_username', nameInput.value.trim());
            loginBtn.classList.add('success');
            loginBtn.innerHTML = '<i class="fa-solid fa-check"></i> Berhasil!';
            setTimeout(() => { window.location.href = 'index.html'; }, 800);
        }, 1500);
    });

    function quickLogin(name) {
        const ud = { name, email: name.toLowerCase().replace(/\s/g,'.') + '@demo.com', loginTime: new Date().toISOString(), avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(name) + '&background=6366f1&color=fff&size=150&bold=true' };
        localStorage.setItem('aitrebe_session', JSON.stringify(ud));
        localStorage.setItem('aitrebe_username', name);
        window.location.href = 'index.html';
    }

    document.getElementById('googleLoginBtn').addEventListener('click', () => quickLogin('Pengguna Google'));
    document.getElementById('githubLoginBtn').addEventListener('click', () => quickLogin('Developer GitHub'));
    document.getElementById('forgotPasswordLink').addEventListener('click', (e) => { e.preventDefault(); alert('Fitur reset password akan segera hadir.'); });
    document.getElementById('signupLink').addEventListener('click', (e) => { e.preventDefault(); alert('Masukkan data Anda di form login untuk membuat akun.'); });

    document.querySelectorAll('.input-field input').forEach(input => {
        input.addEventListener('focus', () => input.closest('.input-field').classList.add('focused'));
        input.addEventListener('blur', () => input.closest('.input-field').classList.remove('focused'));
    });
});
