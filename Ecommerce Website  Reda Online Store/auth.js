document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. ميزة إظهار/إخفاء كلمة المرور ---
    setupPasswordToggle();

    // --- 2. التحقق من نموذج تسجيل الدخول ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // --- 3. التحقق من نموذج إنشاء حساب ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    // --- 4. التحقق من نموذج استعادة كلمة المرور ---
    const resetForm = document.getElementById('reset-form');
    if (resetForm) {
        resetForm.addEventListener('submit', handleResetPassword);
    }
});

/**
 * معالجة تسجيل الدخول
 */
function handleLogin(event) {
    event.preventDefault(); // منع إعادة تحميل الصفحة
    clearErrors();

    const email = document.getElementById('login-email');
    const pass = document.getElementById('login-pass');
    let isValid = true;

    if (!validateEmail(email.value)) {
        showError(email, 'يرجى إدخال بريد إلكتروني صحيح');
        isValid = false;
    }

    if (pass.value.trim() === '') {
        showError(pass, 'يرجى إدخال كلمة المرور');
        isValid = false;
    }

    if (isValid) {
        // هنا يتم إرسال البيانات للسيرفر عبر (Fetch API / Axios) في التطبيقات الحقيقية
        alert('تم تسجيل الدخول بنجاح!');
        // loginForm.submit();
    }
}

/**
 * معالجة إنشاء حساب جديد
 */
function handleRegister(event) {
    event.preventDefault();
    clearErrors();

    const name = document.getElementById('reg-name');
    const email = document.getElementById('reg-email');
    const pass = document.getElementById('reg-pass');
    const confirmPass = document.getElementById('reg-confirm-pass');
    let isValid = true;

    if (name.value.trim().length < 3) {
        showError(name, 'الاسم يجب أن يكون 3 حروف على الأقل');
        isValid = false;
    }

    if (!validateEmail(email.value)) {
        showError(email, 'يرجى إدخال بريد إلكتروني صحيح');
        isValid = false;
    }

    if (pass.value.length < 8) {
        showError(pass, 'كلمة المرور يجب أن لا تقل عن 8 خانات');
        isValid = false;
    }

    if (pass.value !== confirmPass.value) {
        showError(confirmPass, 'كلمتا المرور غير متطابقتين');
        isValid = false;
    }

    if (isValid) {
        alert('تم إنشاء الحساب بنجاح!');
    }
}

/**
 * معالجة استعادة كلمة المرور
 */
function handleResetPassword(event) {
    event.preventDefault();
    clearErrors();

    const email = document.getElementById('reset-email');
    const code = document.getElementById('reset-code');
    let isValid = true;

    if (!validateEmail(email.value)) {
        showError(email, 'يرجى إدخال البريد الإلكتروني');
        isValid = false;
    }

    if (code.value.trim() === '') {
        showError(code, 'يرجى إدخال رمز التحقق');
        isValid = false;
    }

    if (isValid) {
        alert('تم إرسال الرمز بنجاح!');
    }
}

// --- أدوات مساعدة (Helper Functions) ---

// إظهار رسالة خطأ تحت الحقل المخصص
function showError(inputElement, message) {
    const formGroup = inputElement.parentElement;
    inputElement.classList.add('input-error');
    
    const errorDisplay = document.createElement('small');
    errorDisplay.className = 'error-message';
    errorDisplay.innerText = message;
    
    formGroup.appendChild(errorDisplay);
}

// مسح جميع أخطاء الصفحة قبل إعادة التحقق
function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

// التثبت من صحة البريد الإلكتروني عبر RegEx
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}

// تفعيل زر إظهار/إخفاء كلمة المرور
function setupPasswordToggle() {
    const toggleButtons = document.querySelectorAll('.toggle-password');
    toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
            const input = button.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                button.innerText = 'إخفاء';
            } else {
                input.type = 'password';
                button.innerText = 'إظهار';
            }
        });
    });
}