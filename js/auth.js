// ============================================================
// Pharmacy Management System — Authentication Engine
// ============================================================

const AUTH_SESSION_KEY = 'phama_session';
const AUTH_REMEMBER_KEY = 'phama_remember';
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 30;
const DEFAULT_PASSWORDS = { admin: 'Admin@123', seller1: 'Seller@123', seller2: 'Seller@123', monitor: 'Monitor@123' };

// SHA-256 hash using Web Crypto API
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_phama_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Seed default password hashes if empty
async function seedPasswords() {
    const db = window.DB;
    if (!db) return;
    for (const admin of db.data.admins) {
        if (!admin.passwordHash) {
            admin.passwordHash = await hashPassword(DEFAULT_PASSWORDS[admin.username] || 'Admin@123');
        }
    }
    for (const seller of db.data.sellers) {
        if (!seller.passwordHash) {
            seller.passwordHash = await hashPassword(DEFAULT_PASSWORDS[seller.username] || 'Seller@123');
        }
    }
    db.save();
}

// ============================================================
// Login Functions
// ============================================================

async function loginAdmin(username, password, remember = false) {
    const db = window.DB;
    const admin = db.data.admins.find(a => a.username === username);
    if (!admin) return { success: false, error: 'Invalid username or password.' };
    if (!admin.active) return { success: false, error: 'This account has been disabled. Contact system administrator.' };

    // Check lockout
    if (admin.lockedUntil) {
        const lockTime = new Date(admin.lockedUntil);
        if (new Date() < lockTime) {
            const mins = Math.ceil((lockTime - new Date()) / 60000);
            return { success: false, error: `Account locked. Try again in ${mins} minutes.` };
        } else {
            admin.lockedUntil = null;
            admin.failedAttempts = 0;
            db.save();
        }
    }

    const hash = await hashPassword(password);
    if (hash !== admin.passwordHash) {
        admin.failedAttempts = (admin.failedAttempts || 0) + 1;
        if (admin.failedAttempts >= MAX_FAILED_ATTEMPTS) {
            admin.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString();
            db.save();
            db.logAudit(admin.id, admin.fullName, 'admin', 'Account Locked', `Locked after ${MAX_FAILED_ATTEMPTS} failed attempts.`);
            return { success: false, error: `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.` };
        }
        db.save();
        return { success: false, error: `Invalid username or password. ${MAX_FAILED_ATTEMPTS - admin.failedAttempts} attempts remaining.` };
    }

    // Success
    admin.failedAttempts = 0;
    admin.lockedUntil = null;
    admin.lastLogin = new Date().toISOString();
    db.save();

    const session = { userId: admin.id, userName: admin.fullName, role: 'admin', token: generateId('TK'), loginTime: new Date().toISOString() };
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    if (remember) localStorage.setItem(AUTH_REMEMBER_KEY, 'admin');

    db.logAudit(admin.id, admin.fullName, 'admin', 'Login', 'Admin login successful.');
    return { success: true, session };
}

async function loginSeller(username, password, remember = false) {
    const db = window.DB;
    const seller = db.data.sellers.find(s => s.username === username);
    if (!seller) return { success: false, error: 'Invalid username or password.' };
    if (!seller.active) return { success: false, error: 'This account has been disabled. Contact your administrator.' };

    if (seller.lockedUntil) {
        const lockTime = new Date(seller.lockedUntil);
        if (new Date() < lockTime) {
            const mins = Math.ceil((lockTime - new Date()) / 60000);
            return { success: false, error: `Account locked. Try again in ${mins} minutes.` };
        } else {
            seller.lockedUntil = null;
            seller.failedAttempts = 0;
            db.save();
        }
    }

    const hash = await hashPassword(password);
    if (hash !== seller.passwordHash) {
        seller.failedAttempts = (seller.failedAttempts || 0) + 1;
        if (seller.failedAttempts >= MAX_FAILED_ATTEMPTS) {
            seller.lockedUntil = new Date(Date.now() + LOCKOUT_MINUTES * 60000).toISOString();
            db.save();
            db.logAudit(seller.id, seller.fullName, 'seller', 'Account Locked', `Locked after ${MAX_FAILED_ATTEMPTS} failed attempts.`);
            return { success: false, error: `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Try again in ${LOCKOUT_MINUTES} minutes.` };
        }
        db.save();
        return { success: false, error: `Invalid username or password. ${MAX_FAILED_ATTEMPTS - seller.failedAttempts} attempts remaining.` };
    }

    seller.failedAttempts = 0;
    seller.lockedUntil = null;
    seller.lastLogin = new Date().toISOString();
    db.save();

    const session = { userId: seller.id, userName: seller.fullName, role: seller.role || 'seller', token: generateId('TK'), loginTime: new Date().toISOString() };
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    if (remember) localStorage.setItem(AUTH_REMEMBER_KEY, seller.role || 'seller');

    db.logAudit(seller.id, seller.fullName, seller.role || 'seller', 'Login', 'Seller/Monitor login successful.');
    return { success: true, session };
}

// ============================================================
// Session Helpers
// ============================================================

function getSession() {
    let raw = sessionStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}

function requireAuth(expectedRole) {
    const session = getSession();
    const isAuthorized = session && (
        Array.isArray(expectedRole) 
            ? expectedRole.includes(session.role) 
            : session.role === expectedRole
    );
    if (!isAuthorized) {
        const target = (expectedRole === 'admin' || (Array.isArray(expectedRole) && expectedRole.includes('admin') && !expectedRole.includes('seller'))) ? 'admin-login.html' : 'seller-login.html';
        window.location.href = target;
        return null;
    }
    return session;
}

function logout() {
    const session = getSession();
    if (session && window.DB) {
        window.DB.logAudit(session.userId, session.userName, session.role, 'Logout', 'User logged out.');
    }
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_REMEMBER_KEY);
    const role = session ? session.role : 'admin';
    window.location.href = role === 'seller' ? 'seller-login.html' : 'admin-login.html';
}

async function changePassword(userId, role, newPassword) {
    const db = window.DB;
    const hash = await hashPassword(newPassword);
    const table = role === 'admin' ? db.data.admins : db.data.sellers;
    const user = table.find(u => u.id === userId);
    if (user) {
        user.passwordHash = hash;
        db.save();
        return true;
    }
    return false;
}

async function resetSellerPassword(sellerId) {
    const db = window.DB;
    const seller = db.data.sellers.find(s => s.id === sellerId);
    if (!seller) return false;
    seller.passwordHash = await hashPassword('Seller@123');
    seller.failedAttempts = 0;
    seller.lockedUntil = null;
    db.save();
    return true;
}

// ============================================================
// Custom Dialog System (replaces alert/confirm/prompt)
// ============================================================

const ICON_SVG = {
    success: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    error: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    warning: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
    info: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
    input: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>'
};

function showAlert(title, message, type = 'info') {
    return new Promise(resolve => {
        const overlay = document.getElementById('modal-alert-dialog');
        if (!overlay) { resolve(); return; }
        const iconWrap = document.getElementById('cdialog-alert-icon-wrap');
        iconWrap.className = `cdialog-icon-wrapper cdialog-icon-${type}`;
        iconWrap.innerHTML = ICON_SVG[type] || ICON_SVG.info;
        document.getElementById('cdialog-alert-title').textContent = title;
        document.getElementById('cdialog-alert-message').innerHTML = message;
        const okBtn = document.getElementById('cdialog-alert-ok');
        const handler = () => { okBtn.removeEventListener('click', handler); overlay.classList.remove('show'); resolve(); };
        okBtn.addEventListener('click', handler);
        overlay.classList.add('show');
    });
}

function showConfirm(title, message, confirmText = 'Confirm', type = 'warning') {
    return new Promise(resolve => {
        const overlay = document.getElementById('modal-confirm-dialog');
        if (!overlay) { resolve(false); return; }
        const iconWrap = document.getElementById('cdialog-confirm-icon-wrap');
        iconWrap.className = `cdialog-icon-wrapper cdialog-icon-${type}`;
        iconWrap.innerHTML = ICON_SVG[type] || ICON_SVG.warning;
        document.getElementById('cdialog-confirm-title').textContent = title;
        document.getElementById('cdialog-confirm-message').innerHTML = message;
        const okBtn = document.getElementById('cdialog-confirm-ok');
        const cancelBtn = document.getElementById('cdialog-confirm-cancel');
        okBtn.textContent = confirmText;
        const cleanup = (result) => {
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            overlay.classList.remove('show');
            resolve(result);
        };
        const onOk = () => cleanup(true);
        const onCancel = () => cleanup(false);
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        overlay.classList.add('show');
    });
}

function showPrompt(title, label = 'Value', placeholder = '', defaultVal = '', type = 'text') {
    return new Promise(resolve => {
        const overlay = document.getElementById('modal-prompt-dialog');
        if (!overlay) { resolve(null); return; }
        document.getElementById('cdialog-prompt-title').textContent = title;
        const lbl = document.getElementById('cdialog-prompt-label');
        lbl.textContent = label;
        const input = document.getElementById('cdialog-prompt-input');
        input.type = type;
        input.placeholder = placeholder;
        input.value = defaultVal;
        const okBtn = document.getElementById('cdialog-prompt-ok');
        const cancelBtn = document.getElementById('cdialog-prompt-cancel');
        const cleanup = (val) => {
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            input.removeEventListener('keydown', onKey);
            overlay.classList.remove('show');
            resolve(val);
        };
        const onOk = () => cleanup(input.value);
        const onCancel = () => cleanup(null);
        const onKey = (e) => { if (e.key === 'Enter') onOk(); if (e.key === 'Escape') onCancel(); };
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        input.addEventListener('keydown', onKey);
        overlay.classList.add('show');
        setTimeout(() => input.focus(), 100);
    });
}

function showFormDialog(title, fields, message = '') {
    return new Promise(resolve => {
        const overlay = document.getElementById('modal-form-dialog');
        if (!overlay) { resolve(null); return; }
        document.getElementById('cdialog-form-title').textContent = title;
        const msgEl = document.getElementById('cdialog-form-message');
        if (message) { msgEl.textContent = message; msgEl.style.display = 'block'; }
        else { msgEl.style.display = 'none'; }
        const container = document.getElementById('cdialog-form-fields');
        container.innerHTML = '';
        fields.forEach(f => {
            const div = document.createElement('div');
            div.className = 'form-group' + (f.fullWidth ? ' full-width' : '');
            const isSelect = f.type === 'select';
            const isTextarea = f.type === 'textarea';
            let inputHtml;
            if (isSelect) {
                inputHtml = `<select id="cdf-${f.key}">${f.options.map(o => `<option value="${o.value || o}" ${o.value === f.default ? 'selected' : ''}>${o.label || o}</option>`).join('')}</select>`;
            } else if (isTextarea) {
                inputHtml = `<textarea id="cdf-${f.key}" placeholder="${f.placeholder || ''}" style="min-height:60px;">${f.default || ''}</textarea>`;
            } else {
                inputHtml = `<input type="${f.type || 'text'}" id="cdf-${f.key}" placeholder="${f.placeholder || ''}" value="${f.default || ''}" ${f.required ? 'required' : ''} ${f.min !== undefined ? `min="${f.min}"` : ''} ${f.step ? `step="${f.step}"` : ''}>`;
            }
            div.innerHTML = `<label for="cdf-${f.key}">${f.label}${f.required ? ' *' : ''}</label>${inputHtml}`;
            container.appendChild(div);
        });
        const okBtn = document.getElementById('cdialog-form-ok');
        const cancelBtn = document.getElementById('cdialog-form-cancel');
        const closeBtn = document.getElementById('cdialog-form-close');
        const cleanup = (val) => {
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
            closeBtn.removeEventListener('click', onCancel);
            overlay.classList.remove('show');
            resolve(val);
        };
        const onOk = () => {
            const result = {};
            let valid = true;
            fields.forEach(f => {
                const el = document.getElementById('cdf-' + f.key);
                if (el) {
                    result[f.key] = f.type === 'number' ? parseFloat(el.value) || 0 : el.value;
                    if (f.required && !el.value.trim()) valid = false;
                }
            });
            if (!valid) { showAlert('Missing Fields', 'Please fill in all required fields.', 'warning'); return; }
            cleanup(result);
        };
        const onCancel = () => cleanup(null);
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
        closeBtn.addEventListener('click', onCancel);
        overlay.classList.add('show');
    });
}

// Global modal helpers
window.openModal = (id) => document.getElementById(id)?.classList.add('show');
window.closeModal = (id) => document.getElementById(id)?.classList.remove('show');

function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<div class="toast-icon">${ICON_SVG[type] || ICON_SVG.info}</div><div class="toast-message">${message}</div>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Export auth functions
window.Auth = { hashPassword, seedPasswords, loginAdmin, loginSeller, getSession, requireAuth, logout, changePassword, resetSellerPassword };
window.Dialog = { showAlert, showConfirm, showPrompt, showFormDialog, showToast };
