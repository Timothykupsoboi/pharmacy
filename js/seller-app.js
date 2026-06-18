// ============================================================
// Seller Application Controller — Edoc Pharmacy Enterprise
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    await Auth.seedPasswords();
    const session = Auth.requireAuth('seller');
    if (!session) return;

    const db = window.DB;
    const { showAlert, showConfirm, showPrompt, showFormDialog, showToast } = Dialog;

    const App = {
        session,
        currentView: 'dashboard',
        cart: [],
        charts: [],

        init() {
            const theme = localStorage.getItem('phama_theme') || 'light';
            document.body.setAttribute('data-theme', theme);
            this.updateThemeIcon(theme);

            const seller = db.data.sellers.find(s => s.id === session.userId);
            document.getElementById('user-avatar').textContent = session.userName.charAt(0);
            document.getElementById('user-name').textContent = session.userName;
            document.getElementById('user-email').textContent = seller?.email || '';

            this.buildSidebar();
            this.registerEvents();
            db.refreshNotifications();
            this.drawNotifications();
            this.renderView();
        },

        buildSidebar() {
            const links = [
                { id: 'dashboard', name: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
                { id: 'drugs', name: 'Search Medicines', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
                { id: 'pos', name: 'Create Sale (POS)', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z' },
                { id: 'prescriptions', name: 'Prescriptions', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
                { id: 'customers', name: 'Customers', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
                { id: 'my_sales', name: 'My Sales', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }
            ];
            const menu = document.getElementById('sidebar-menu');
            menu.innerHTML = '';
            links.forEach(l => {
                const a = document.createElement('a');
                a.className = `nav-link ${this.currentView === l.id ? 'active' : ''}`;
                a.dataset.target = l.id;
                a.innerHTML = `<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${l.icon}"></path></svg><span>${l.name}</span>`;
                a.addEventListener('click', () => { this.currentView = l.id; this.renderView(); });
                menu.appendChild(a);
            });
        },

        registerEvents() {
            document.getElementById('logout-button').addEventListener('click', () => Auth.logout());
            document.getElementById('theme-toggle').addEventListener('click', () => {
                const t = document.body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
                document.body.setAttribute('data-theme', t);
                localStorage.setItem('phama_theme', t);
                this.updateThemeIcon(t);
            });
            const notifBtn = document.getElementById('notif-btn');
            const notifBox = document.getElementById('notif-dropdown');
            notifBtn.addEventListener('click', e => { e.stopPropagation(); notifBox.classList.toggle('show'); });
            document.addEventListener('click', () => notifBox.classList.remove('show'));
            notifBox.addEventListener('click', e => e.stopPropagation());
            document.getElementById('notif-mark-read').addEventListener('click', () => {
                db.data.notifications = [];
                db.save();
                this.drawNotifications();
                notifBox.classList.remove('show');
            });
            document.getElementById('global-search-input').addEventListener('input', e => {
                if (e.target.value.trim()) {
                    this.currentView = 'drugs';
                    this.renderView();
                    setTimeout(() => {
                        const si = document.getElementById('drug-search-input');
                        if (si) { si.value = e.target.value; si.dispatchEvent(new Event('input')); }
                    }, 50);
                }
            });
        },

        updateThemeIcon(theme) {
            const icon = document.getElementById('theme-icon');
            icon.innerHTML = theme === 'dark'
                ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>'
                : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>';
        },

        drawNotifications() {
            const notifs = db.data.notifications.filter(n => n.type === 'low_stock' || n.type === 'expired' || n.type === 'near_expiry');
            const countEl = document.getElementById('notif-count');
            const list = document.getElementById('notif-items-list');
            list.innerHTML = '';
            if (notifs.length === 0) {
                countEl.style.display = 'none';
                list.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px;">No alerts.</div>';
                return;
            }
            countEl.style.display = 'flex';
            countEl.textContent = notifs.length;
            notifs.forEach(n => {
                const cls = n.type === 'expired' || n.type === 'low_stock' ? 'critical' : 'warning';
                const div = document.createElement('div');
                div.className = 'notif-item';
                div.innerHTML = `<div class="notif-icon ${cls}"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:18px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg></div><div class="notif-content"><div class="notif-msg">${n.message}</div><div class="notif-time">${n.title}</div></div>`;
                list.appendChild(div);
            });
        },

        destroyCharts() { this.charts.forEach(c => c.destroy()); this.charts = []; },

        renderView() {
            this.destroyCharts();
            const c = document.getElementById('main-content');
            c.className = 'content-body animate-fade';
            document.querySelectorAll('.nav-link').forEach(nl => nl.classList.toggle('active', nl.dataset.target === this.currentView));
            switch (this.currentView) {
                case 'dashboard': this.renderDashboard(c); break;
                case 'drugs': this.renderDrugs(c); break;
                case 'pos': this.renderPOS(c); break;
                case 'prescriptions': this.renderPrescriptions(c); break;
                case 'customers': this.renderCustomers(c); break;
                case 'my_sales': this.renderMySales(c); break;
                default: c.innerHTML = '<h2>Page Not Found</h2>';
            }
        },

        kpi(title, value, color, icon) {
            return `<div class="kpi-card"><div class="kpi-details"><h3>${title}</h3><div class="kpi-value">${value}</div></div><div class="kpi-icon ${color}"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${icon}"></path></svg></div></div>`;
        },

        // ============================================================
        // DASHBOARD
        // ============================================================
        renderDashboard(c) {
            const cur = db.data.settings.currency;
            const todayStr = getRelativeDate(0);
            const mySales = db.data.sales.filter(s => s.sellerId === session.userId);
            const mySalesToday = mySales.filter(s => s.date === todayStr);
            const revToday = mySalesToday.reduce((s, x) => s + x.grandTotal, 0);
            const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
            const myMonthly = mySales.filter(s => new Date(s.date) >= thirtyAgo);
            const revMonth = myMonthly.reduce((s, x) => s + x.grandTotal, 0);
            const totalStock = db.data.medicines.reduce((s, m) => s + m.quantity, 0);
            const pendingRx = db.data.prescriptions.filter(p => p.status === 'Pending').length;
            const customerSet = new Set(mySales.map(s => s.customerId).filter(Boolean));

            c.innerHTML = `
                <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h2 style="font-weight: 800; color: var(--text-main); font-size: 28px; margin-bottom: 4px; font-family: var(--font-heading); letter-spacing: -0.5px;">Seller Dashboard</h2>
                        <p style="color: var(--text-muted); font-size: 14px;">Process sales, manage customers, and check stock levels.</p>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button class="btn btn-primary" onclick="App.currentView='pos'; App.renderView();">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:18px; display:inline-block; vertical-align:middle; margin-right:4px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg> New Sale
                        </button>
                    </div>
                </div>
                <div style="width: 100%; height: 220px; border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 24px; position: relative; box-shadow: var(--shadow-md);">
                    <img src="img/banner.png" alt="Pharmacy Banner" style="width: 100%; height: 100%; object-fit: cover;">
                    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.8), transparent); padding: 20px;">
                        <h3 style="color: white; font-family: var(--font-heading); margin: 0; font-size: 22px;">Welcome back, ${session.userName}</h3>
                    </div>
                </div>
                <div class="kpi-grid">
                    ${this.kpi('My Sales Today', cur + revToday.toFixed(2), 'success', 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z')}
                    ${this.kpi('Monthly Sales', cur + revMonth.toFixed(2), 'accent', 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z')}
                    ${this.kpi('Customers Served', customerSet.size, 'purple', 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z')}
                    ${this.kpi('Pending Rx', pendingRx, 'warning', 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z')}
                    ${this.kpi('Available Stock', totalStock + ' units', 'primary', 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4')}
                </div>
                <div class="charts-grid">
                    <div class="chart-card">
                        <div class="chart-header"><h3 class="chart-title">My Recent Transactions</h3></div>
                        <div class="table-responsive"><table class="custom-table"><thead><tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Total</th><th>Action</th></tr></thead>
                        <tbody id="recent-sales-tbody"></tbody></table></div>
                    </div>
                    <div class="chart-card">
                        <div class="chart-header"><h3 class="chart-title">Quick Search</h3></div>
                        <div style="display:flex;flex-direction:column;gap:12px;margin-top:10px;">
                            <input type="text" id="quick-search" placeholder="Type medicine name or barcode..." style="padding:10px;border:1px solid var(--border);border-radius:var(--radius-sm);outline:none;background:var(--bg-card);color:var(--text-main);">
                            <div id="quick-results" style="display:flex;flex-direction:column;gap:8px;max-height:200px;overflow-y:auto;font-size:13px;">
                                <p style="color:var(--text-muted);">Enter at least 2 characters.</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            // Recent sales
            const recentTbody = document.getElementById('recent-sales-tbody');
            const recent = mySales.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
            if (recent.length === 0) {
                recentTbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);">No sales yet.</td></tr>';
            } else {
                recent.forEach(s => {
                    recentTbody.innerHTML += `<tr><td><code>${s.id}</code></td><td>${s.customerName}</td><td>${s.date}</td><td><strong>${cur}${s.grandTotal.toFixed(2)}</strong></td><td><button class="btn btn-secondary btn-xs" onclick="App.showReceipt('${s.id}')">Receipt</button></td></tr>`;
                });
            }

            // Quick search
            document.getElementById('quick-search').addEventListener('input', e => {
                const q = e.target.value.toLowerCase().trim();
                const results = document.getElementById('quick-results');
                if (q.length < 2) { results.innerHTML = '<p style="color:var(--text-muted);">Enter at least 2 characters.</p>'; return; }
                const matches = db.data.medicines.filter(m => m.drugName.toLowerCase().includes(q) || m.genericName.toLowerCase().includes(q) || m.barcode.includes(q)).slice(0, 5);
                if (matches.length === 0) { results.innerHTML = '<p style="color:var(--critical);">No matches.</p>'; return; }
                results.innerHTML = '';
                matches.forEach(m => {
                    const exp = db.getExpiryStatus(m.expiryDate);
                    results.innerHTML += `<div style="padding:8px;border:1px solid var(--border);border-radius:4px;display:flex;justify-content:space-between;align-items:center;background:var(--bg-card);">
                        <div><strong>${m.drugName}</strong> (${m.genericName})<br><span class="${m.quantity <= m.reorderLevel ? 'low-stock-highlight' : ''}" style="font-size:12px;">Stock: ${m.quantity} | ${cur}${m.sellingPrice.toFixed(2)}</span></div>
                        <button class="btn btn-primary btn-xs" onclick="App.quickAddToCart('${m.id}')">Add</button>
                    </div>`;
                });
            });
        },

        quickAddToCart(medId) {
            this.currentView = 'pos';
            this.renderView();
            this.addToCart(medId);
        },

        // ============================================================
        // SEARCH MEDICINES (Read-Only)
        // ============================================================
        renderDrugs(c) {
            c.innerHTML = `
                <div class="page-header"><div class="page-title"><h2>Search Medicines</h2><p>Browse available stock and check medicine details.</p></div></div>
                <div class="filter-bar">
                    <div class="form-group" style="flex:1;"><label>Search</label><input type="text" id="drug-search-input" placeholder="Name, barcode, or generic..."></div>
                    <div class="form-group"><label>Category</label><select id="drug-cat-filter"><option value="">All</option>${db.data.medicine_categories.map(c => `<option>${c}</option>`).join('')}</select></div>
                </div>
                <div class="panel-card"><div class="table-responsive"><table class="custom-table"><thead><tr><th>Medicine</th><th>Category</th><th>Stock</th><th>Price</th><th>Expiry</th><th>Rx</th></tr></thead><tbody id="drugs-tbody"></tbody></table></div></div>
            `;
            this.filterDrugs();
            document.getElementById('drug-search-input').addEventListener('input', () => this.filterDrugs());
            document.getElementById('drug-cat-filter').addEventListener('change', () => this.filterDrugs());
        },

        filterDrugs() {
            const q = (document.getElementById('drug-search-input')?.value || '').toLowerCase().trim();
            const cat = document.getElementById('drug-cat-filter')?.value || '';
            const cur = db.data.settings.currency;
            let list = db.data.medicines.filter(m => {
                if (q && !m.drugName.toLowerCase().includes(q) && !m.genericName.toLowerCase().includes(q) && !m.barcode.includes(q)) return false;
                if (cat && m.category !== cat) return false;
                return true;
            });
            const tbody = document.getElementById('drugs-tbody');
            tbody.innerHTML = list.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No medicines found.</td></tr>' : '';
            list.forEach(m => {
                const exp = db.getExpiryStatus(m.expiryDate);
                const rowCls = exp.level === 0 ? 'critical-row' : exp.level === 1 ? 'warning-row' : '';
                const lowStock = m.quantity <= m.reorderLevel;
                tbody.innerHTML += `<tr class="${rowCls}">
                    <td><strong>${m.drugName}</strong><br><span style="font-size:11px;color:var(--text-muted);">${m.genericName} | ${m.barcode}</span></td>
                    <td><span class="badge badge-primary">${m.category}</span></td>
                    <td>${lowStock ? `<span class="low-stock-highlight">${m.quantity} ⚠</span>` : m.quantity}</td>
                    <td><strong>${cur}${m.sellingPrice.toFixed(2)}</strong></td>
                    <td><span class="badge badge-${exp.cls === 'normal' ? 'success' : exp.cls}">${exp.label}</span></td>
                    <td>${m.prescriptionRequired ? '<span class="badge badge-warning">Rx</span>' : 'OTC'}</td>
                </tr>`;
            });
        },

        // ============================================================
        // POINT OF SALE
        // ============================================================
        renderPOS(c) {
            c.innerHTML = `
                <div class="page-header"><div class="page-title"><h2>Point of Sale</h2><p>Search medicines and process sales.</p></div></div>
                <div class="pos-layout">
                    <div class="pos-products">
                        <div class="pos-search-bar"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style="width:18px;height:18px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg><input type="text" id="pos-search" placeholder="Scan barcode or type medicine name to filter..."></div>
                        <div class="pos-results-list" id="pos-results"></div>
                    </div>
                    <div class="pos-cart">
                        <div class="pos-cart-header"><span class="pos-cart-title">Shopping Cart</span><span class="pos-cart-clear" onclick="App.clearCart()">Clear All</span></div>
                        <div class="pos-cart-items" id="cart-items-list"></div>
                        <div class="cart-summary" id="cart-summary"></div>
                    </div>
                </div>
            `;
            document.getElementById('pos-search').addEventListener('input', e => this.searchPOS(e.target.value));
            this.searchPOS('');
            this.updateCartUI();
        },

        searchPOS(q) {
            q = q.toLowerCase().trim();
            const results = document.getElementById('pos-results');
            const cur = db.data.settings.currency;
            // Show all non-expired medicines, filtered by search query if provided
            const matches = db.data.medicines.filter(m => {
                if (db.getExpiryStatus(m.expiryDate).level === 0) return false;
                if (q.length >= 1 && !m.drugName.toLowerCase().includes(q) && !m.genericName.toLowerCase().includes(q) && !m.barcode.includes(q)) return false;
                return true;
            });
            results.innerHTML = matches.length === 0 ? '<p style="text-align:center;color:var(--text-muted);padding:40px;">No medicines found.</p>' : '';
            matches.forEach(m => {
                results.innerHTML += `<div class="pos-item-row" onclick="App.addToCart('${m.id}')">
                    <div><div class="pos-item-name">${m.drugName}</div><div class="pos-item-generic">${m.genericName} | ${m.barcode}</div><div class="pos-item-stock ${m.quantity <= m.reorderLevel ? 'low-stock-highlight' : ''}">Stock: ${m.quantity}</div></div>
                    <div style="text-align:right;"><div class="pos-item-price">${cur}${m.sellingPrice.toFixed(2)}</div>${m.prescriptionRequired ? '<div style="font-size:11px;color:var(--warning);">Rx Required</div>' : ''}</div>
                </div>`;
            });
        },

        async addToCart(medId) {
            const m = db.data.medicines.find(d => d.id === medId);
            if (!m) return;
            if (db.getExpiryStatus(m.expiryDate).level === 0) { await showAlert('Expired', `"${m.drugName}" has expired and cannot be sold.`, 'error'); return; }
            if (m.quantity <= 0) { await showAlert('Out of Stock', `"${m.drugName}" is out of stock.`, 'error'); return; }
            if (m.prescriptionRequired) {
                const hasRx = db.data.prescriptions.some(p => p.status === 'Verified' && p.medicines.toLowerCase().includes(m.drugName.toLowerCase().split(' ')[0]));
                if (!hasRx) { await showAlert('Prescription Required', `"${m.drugName}" requires a verified prescription before sale. Please ask an admin to verify.`, 'warning'); return; }
            }
            const existing = this.cart.find(ci => ci.medicineId === medId);
            if (existing) {
                if (existing.qty >= m.quantity) { await showAlert('Stock Limit', 'Cannot exceed available stock.', 'warning'); return; }
                existing.qty++;
            } else {
                this.cart.push({ medicineId: medId, drugName: m.drugName, unitPrice: m.sellingPrice, taxRate: m.taxRate, qty: 1 });
            }
            this.updateCartUI();
        },

        updateCartUI() {
            const list = document.getElementById('cart-items-list');
            const summary = document.getElementById('cart-summary');
            if (!list) return;
            const cur = db.data.settings.currency;
            list.innerHTML = this.cart.length === 0 ? '<p style="text-align:center;color:var(--text-muted);padding:40px;">Cart is empty</p>' : '';
            let subtotal = 0, totalTax = 0;
            this.cart.forEach((item, i) => {
                const lt = item.unitPrice * item.qty;
                const tax = lt * (item.taxRate / 100);
                subtotal += lt;
                totalTax += tax;
                list.innerHTML += `<div class="cart-item"><div class="cart-item-info"><div class="cart-item-name">${item.drugName}</div><div class="cart-item-price">${cur}${item.unitPrice.toFixed(2)} × ${item.qty}</div></div><div class="cart-item-actions"><button class="qty-btn" onclick="App.adjustQty(${i},-1)">−</button><span style="font-weight:700;min-width:24px;text-align:center;">${item.qty}</span><button class="qty-btn" onclick="App.adjustQty(${i},1)">+</button><button class="qty-btn" onclick="App.removeFromCart(${i})" style="color:var(--critical);">✕</button></div></div>`;
            });
            const grandTotal = subtotal + totalTax;
            summary.innerHTML = `
                <div class="cart-summary-row"><span>Subtotal</span><span>${cur}${subtotal.toFixed(2)}</span></div>
                <div class="cart-summary-row"><span>Tax</span><span>${cur}${totalTax.toFixed(2)}</span></div>
                <div class="cart-summary-row total"><span>Grand Total</span><span>${cur}${grandTotal.toFixed(2)}</span></div>
                <div style="margin-top:12px;"><label style="font-size:12px;font-weight:600;color:var(--text-muted);">Payment Method</label><select id="pos-payment" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-top:4px;background:var(--bg-card);color:var(--text-main);"><option>Cash</option><option>Card</option><option>M-Pesa</option><option>Bank Transfer</option></select></div>
                <div style="margin-top:8px;"><label style="font-size:12px;font-weight:600;color:var(--text-muted);">Customer</label><select id="pos-customer" style="width:100%;padding:8px;border:1px solid var(--border);border-radius:var(--radius-sm);margin-top:4px;background:var(--bg-card);color:var(--text-main);"><option value="">Walk-in Customer</option>${db.data.customers.map(c => `<option value="${c.id}">${c.fullName}</option>`).join('')}</select></div>
                <div class="cart-checkout"><button class="btn btn-primary" onclick="App.processCheckout()">Complete Sale</button></div>
            `;
        },

        adjustQty(index, delta) {
            const item = this.cart[index]; if (!item) return;
            const med = db.data.medicines.find(m => m.id === item.medicineId);
            const newQty = item.qty + delta;
            if (newQty <= 0) this.cart.splice(index, 1);
            else if (med && newQty > med.quantity) return;
            else item.qty = newQty;
            this.updateCartUI();
        },

        removeFromCart(i) { this.cart.splice(i, 1); this.updateCartUI(); },
        clearCart() { this.cart = []; this.updateCartUI(); },

        async processCheckout() {
            if (this.cart.length === 0) { await showAlert('Empty Cart', 'Add items before checkout.', 'warning'); return; }
            const paymentMethod = document.getElementById('pos-payment')?.value || 'Cash';
            const customerId = document.getElementById('pos-customer')?.value || '';
            const customer = db.data.customers.find(c => c.id === customerId);
            const customerName = customer ? customer.fullName : 'Walk-in Customer';
            let subtotal = 0, totalTax = 0;
            const items = this.cart.map(ci => {
                const lt = ci.unitPrice * ci.qty;
                const tax = lt * (ci.taxRate / 100);
                subtotal += lt; totalTax += tax;
                return { saleId: '', medicineId: ci.medicineId, drugName: ci.drugName, quantity: ci.qty, unitPrice: ci.unitPrice, total: lt };
            });
            const grandTotal = subtotal + totalTax;
            const saleId = 'SAL' + Date.now().toString(36).toUpperCase();
            items.forEach(i => i.saleId = saleId);
            const sale = { id: saleId, date: getRelativeDate(0), sellerId: session.userId, sellerName: session.userName, customerId, customerName, subtotal, tax: totalTax, discount: 0, grandTotal, paymentMethod, status: 'completed' };
            const payment = { id: generateId('PAY'), saleId, amount: grandTotal, method: paymentMethod, date: getRelativeDate(0), reference: '' };

            const s = db.data.settings;
            const cur = s.currency;
            document.getElementById('checkout-receipt-preview').innerHTML = `
                <div class="receipt-header"><h3>${s.pharmacyName}</h3><p>${s.pharmacyAddress}<br>${s.pharmacyPhone}</p></div>
                <div style="font-size:12px;margin-bottom:12px;text-align:left;color:var(--text-main);"><strong>Invoice:</strong> ${sale.id} (Proposed)<br><strong>Date:</strong> ${sale.date}<br><strong>Cashier:</strong> ${sale.sellerName}<br><strong>Customer:</strong> ${sale.customerName}</div>
                <table class="receipt-table" style="width:100%;"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${items.map(i => `<tr><td>${i.drugName}</td><td>${i.quantity}</td><td>${cur}${i.unitPrice.toFixed(2)}</td><td>${cur}${i.total.toFixed(2)}</td></tr>`).join('')}</tbody></table>
                <div class="receipt-totals" style="text-align:left;color:var(--text-main);"><div class="total-row"><span>Subtotal:</span><span>${cur}${sale.subtotal.toFixed(2)}</span></div><div class="total-row"><span>Tax:</span><span>${cur}${sale.tax.toFixed(2)}</span></div><div class="total-row grand"><span>TOTAL:</span><span>${cur}${sale.grandTotal.toFixed(2)}</span></div><div class="total-row"><span>Payment:</span><span>${sale.paymentMethod}</span></div></div>
                <div class="receipt-footer">${s.receiptFooter}</div>
            `;

            const printBtn = document.getElementById('checkout-btn-print-save');
            const saveBtn = document.getElementById('checkout-btn-save-only');

            const newPrintBtn = printBtn.cloneNode(true);
            const newSaveBtn = saveBtn.cloneNode(true);
            printBtn.parentNode.replaceChild(newPrintBtn, printBtn);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

            newPrintBtn.addEventListener('click', () => {
                closeModal('modal-checkout-confirm');
                this.finalizeCheckout(sale, items, payment, true);
            });

            newSaveBtn.addEventListener('click', () => {
                closeModal('modal-checkout-confirm');
                this.finalizeCheckout(sale, items, payment, false);
            });

            openModal('modal-checkout-confirm');
        },

        finalizeCheckout(sale, items, payment, printReceipt) {
            db.data.sales.push(sale);
            db.data.sale_items.push(...items);
            db.data.payments.push(payment);
            items.forEach(i => db.recalcStock(i.medicineId));
            db.save();
            db.logAudit(session.userId, session.userName, 'seller', 'Sale Completed', `Invoice ${sale.id} for ${sale.customerName}. Total: ${db.data.settings.currency}${sale.grandTotal.toFixed(2)}.`);
            this.cart = [];
            db.refreshNotifications(); 
            this.drawNotifications();

            if (printReceipt) {
                const s = db.data.settings;
                const cur = s.currency;
                document.getElementById('print-receipt-content').innerHTML = `
                    <div class="receipt-header"><h3>${s.pharmacyName}</h3><p>${s.pharmacyAddress}<br>${s.pharmacyPhone}</p></div>
                    <div style="font-size:12px;margin-bottom:12px;"><strong>Invoice:</strong> ${sale.id}<br><strong>Date:</strong> ${sale.date}<br><strong>Cashier:</strong> ${sale.sellerName}<br><strong>Customer:</strong> ${sale.customerName}</div>
                    <table class="receipt-table"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${items.map(i => `<tr><td>${i.drugName}</td><td>${i.quantity}</td><td>${cur}${i.unitPrice.toFixed(2)}</td><td>${cur}${i.total.toFixed(2)}</td></tr>`).join('')}</tbody></table>
                    <div class="receipt-totals"><div class="total-row"><span>Subtotal:</span><span>${cur}${sale.subtotal.toFixed(2)}</span></div><div class="total-row"><span>Tax:</span><span>${cur}${sale.tax.toFixed(2)}</span></div><div class="total-row grand"><span>TOTAL:</span><span>${cur}${sale.grandTotal.toFixed(2)}</span></div><div class="total-row"><span>Payment:</span><span>${sale.paymentMethod}</span></div></div>
                    <div class="receipt-footer">${s.receiptFooter}</div>
                `;
                openModal('modal-receipt-print');
                setTimeout(() => { window.print(); }, 500);
            } else {
                showToast('Sale completed and saved successfully!', 'success');
            }
            this.renderView();
        },

        showReceipt(saleId) {
            const sale = db.data.sales.find(s => s.id === saleId);
            if (!sale) return;
            const items = db.data.sale_items.filter(si => si.saleId === saleId);
            const s = db.data.settings;
            const cur = s.currency;
            document.getElementById('print-receipt-content').innerHTML = `
                <div class="receipt-header"><h3>${s.pharmacyName}</h3><p>${s.pharmacyAddress}<br>${s.pharmacyPhone}</p></div>
                <div style="font-size:12px;margin-bottom:12px;"><strong>Invoice:</strong> ${sale.id}<br><strong>Date:</strong> ${sale.date}<br><strong>Cashier:</strong> ${sale.sellerName}<br><strong>Customer:</strong> ${sale.customerName}</div>
                <table class="receipt-table"><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${items.map(i => `<tr><td>${i.drugName}</td><td>${i.quantity}</td><td>${cur}${i.unitPrice.toFixed(2)}</td><td>${cur}${i.total.toFixed(2)}</td></tr>`).join('')}</tbody></table>
                <div class="receipt-totals"><div class="total-row"><span>Subtotal:</span><span>${cur}${sale.subtotal.toFixed(2)}</span></div><div class="total-row"><span>Tax:</span><span>${cur}${sale.tax.toFixed(2)}</span></div><div class="total-row grand"><span>TOTAL:</span><span>${cur}${sale.grandTotal.toFixed(2)}</span></div><div class="total-row"><span>Payment:</span><span>${sale.paymentMethod}</span></div></div>
                <div class="receipt-footer">${s.receiptFooter}</div>
            `;
            openModal('modal-receipt-print');
        },

        // ============================================================
        // PRESCRIPTIONS
        // ============================================================
        renderPrescriptions(c) {
            c.innerHTML = `
                <div class="page-header"><div class="page-title"><h2>Prescriptions</h2><p>Add and view prescriptions. Only admins can verify.</p></div>
                <div class="page-actions"><button class="btn btn-primary" onclick="App.addPrescription()">Add Prescription</button></div></div>
                <div class="panel-card"><div class="table-responsive"><table class="custom-table"><thead><tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Medicines</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>${db.data.prescriptions.map(p => `<tr><td><code>${p.id}</code></td><td>${p.patientName}</td><td>${p.doctorName}</td><td style="max-width:200px;">${p.medicines}</td><td>${p.dateIssued}</td><td><span class="badge badge-${p.status === 'Verified' ? 'success' : 'warning'}">${p.status}</span></td><td><button class="btn btn-secondary btn-xs" onclick="App.viewPrescription('${p.id}')">View</button></td></tr>`).join('')}</tbody></table></div></div>
            `;
        },

        async addPrescription() {
            // Reset form inputs
            document.getElementById('presc-add-patient').value = '';
            document.getElementById('presc-add-doctor').value = '';
            document.getElementById('presc-add-phone').value = '';
            document.getElementById('presc-med-qty').value = '1';
            
            // Populate select dropdown
            const medSelect = document.getElementById('presc-med-select');
            // Show non-expired, available medicines
            const activeMeds = db.data.medicines.filter(m => db.getExpiryStatus(m.expiryDate).level > 0);
            medSelect.innerHTML = activeMeds.map(m => `<option value="${m.id}">${m.drugName} (Stock: ${m.quantity})</option>`).join('');
            
            let prescriptionItems = [];
            const updateItemsUI = () => {
                const tbody = document.getElementById('presc-added-items-tbody');
                tbody.innerHTML = '';
                if (prescriptionItems.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);">No medicines added.</td></tr>';
                    return;
                }
                prescriptionItems.forEach((item, idx) => {
                    tbody.innerHTML += `<tr>
                        <td><strong>${item.drugName}</strong></td>
                        <td>${item.quantity}</td>
                        <td><button type="button" class="btn btn-secondary btn-xs" style="color:var(--critical);" onclick="window.removePrescItem(${idx})">Remove</button></td>
                    </tr>`;
                });
            };
            
            // Expose a temporary global callback for the remove button
            window.removePrescItem = (idx) => {
                prescriptionItems.splice(idx, 1);
                updateItemsUI();
            };
            
            // Set up button listeners
            const addMedBtn = document.getElementById('presc-add-med-btn');
            const saveBtn = document.getElementById('presc-save-btn');
            
            // Clean up old event listeners (by cloning the buttons)
            const newAddMedBtn = addMedBtn.cloneNode(true);
            const newSaveBtn = saveBtn.cloneNode(true);
            addMedBtn.parentNode.replaceChild(newAddMedBtn, addMedBtn);
            saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
            
            newAddMedBtn.addEventListener('click', () => {
                const medId = medSelect.value;
                const qty = parseInt(document.getElementById('presc-med-qty').value) || 0;
                if (!medId || qty <= 0) return;
                const med = db.data.medicines.find(m => m.id === medId);
                if (!med) return;
                
                // Check if already in list
                const existing = prescriptionItems.find(item => item.medicineId === medId);
                if (existing) {
                    existing.quantity += qty;
                } else {
                    prescriptionItems.push({ medicineId: medId, drugName: med.drugName, quantity: qty });
                }
                updateItemsUI();
            });
            
            newSaveBtn.addEventListener('click', async () => {
                const patientName = document.getElementById('presc-add-patient').value.trim();
                const doctorName = document.getElementById('presc-add-doctor').value.trim();
                const doctorPhone = document.getElementById('presc-add-phone').value.trim();
                
                if (!patientName || !doctorName) {
                    await showAlert('Missing Information', 'Please fill in Patient Name and Doctor Name.', 'warning');
                    return;
                }
                if (prescriptionItems.length === 0) {
                    await showAlert('No Medicines', 'Please add at least one medicine to the prescription.', 'warning');
                    return;
                }
                
                const medicinesSummary = prescriptionItems.map(item => `${item.drugName} (qty: ${item.quantity})`).join(', ');
                
                db.data.prescriptions.push({
                    id: generateId('RX'),
                    patientName,
                    doctorName,
                    doctorPhone: doctorPhone || '',
                    dateIssued: getRelativeDate(0),
                    medicines: medicinesSummary,
                    medicineItems: prescriptionItems,
                    status: 'Pending',
                    verifiedBy: null,
                    verifiedAt: null,
                    imagePath: '',
                    notes: ''
                });
                db.save();
                db.logAudit(session.userId, session.userName, 'seller', 'Prescription Added', `For ${patientName} with ${prescriptionItems.length} items.`);
                
                // Clean up global function
                delete window.removePrescItem;
                
                closeModal('modal-prescription-add');
                this.renderView();
                showToast('Prescription created successfully!', 'success');
            });
            
            updateItemsUI();
            openModal('modal-prescription-add');
        },

        viewPrescription(id) {
            const p = db.data.prescriptions.find(rx => rx.id === id);
            if (!p) return;
            document.getElementById('presc-detail-content').innerHTML = `
                <div class="detail-grid"><div class="detail-item"><div class="detail-label">Patient</div><div class="detail-val">${p.patientName}</div></div><div class="detail-item"><div class="detail-label">Doctor</div><div class="detail-val">${p.doctorName}</div></div><div class="detail-item"><div class="detail-label">Date</div><div class="detail-val">${p.dateIssued}</div></div><div class="detail-item"><div class="detail-label">Status</div><div class="detail-val"><span class="badge badge-${p.status === 'Verified' ? 'success' : 'warning'}">${p.status}</span></div></div><div class="detail-item" style="grid-column:span 2;"><div class="detail-label">Medicines</div><div class="detail-val">${p.medicines}</div></div></div>
            `;
            document.getElementById('presc-actions').innerHTML = `<button class="btn btn-secondary" onclick="closeModal('modal-presc-details')">Close</button>`;
            openModal('modal-presc-details');
        },

        // ============================================================
        // CUSTOMERS
        // ============================================================
        renderCustomers(c) {
            c.innerHTML = `
                <div class="page-header"><div class="page-title"><h2>Customers</h2><p>Register and manage customer records.</p></div>
                <div class="page-actions"><button class="btn btn-primary" onclick="App.addCustomer()">Register Customer</button></div></div>
                <div class="panel-card"><div class="table-responsive"><table class="custom-table"><thead><tr><th>ID</th><th>Name</th><th>Phone</th><th>Email</th><th>Registered</th><th>Action</th></tr></thead>
                <tbody>${db.data.customers.map(c => `<tr><td><code>${c.id}</code></td><td><strong>${c.fullName}</strong></td><td>${c.phone}</td><td>${c.email}</td><td>${c.dateRegistered}</td><td><button class="btn btn-secondary btn-xs" onclick="App.viewCustomerHistory('${c.id}')">History</button></td></tr>`).join('')}</tbody></table></div></div>
            `;
        },

        async addCustomer() {
            const result = await showFormDialog('Register Customer', [
                { key: 'fullName', label: 'Full Name', required: true },
                { key: 'phone', label: 'Phone', required: true },
                { key: 'email', label: 'Email' },
                { key: 'address', label: 'Address' }
            ]);
            if (!result) return;
            db.data.customers.push({ id: generateId('CUS'), fullName: result.fullName, phone: result.phone, email: result.email || '', address: result.address || '', dateRegistered: getRelativeDate(0) });
            db.save();
            db.logAudit(session.userId, session.userName, 'seller', 'Customer Added', `Registered ${result.fullName}.`);
            this.renderView();
        },

        async viewCustomerHistory(custId) {
            const cust = db.data.customers.find(c => c.id === custId);
            if (!cust) return;
            const purchases = db.data.sales.filter(s => s.customerId === custId);
            const cur = db.data.settings.currency;
            let html = `<h3 style="margin-bottom:16px;">${cust.fullName} — Purchase History</h3>`;
            if (purchases.length === 0) html += '<p style="color:var(--text-muted);">No purchases found.</p>';
            else html += `<table class="custom-table"><thead><tr><th>Invoice</th><th>Date</th><th>Total</th></tr></thead><tbody>${purchases.map(p => `<tr><td><code>${p.id}</code></td><td>${p.date}</td><td><strong>${cur}${p.grandTotal.toFixed(2)}</strong></td></tr>`).join('')}</tbody></table>`;
            await showAlert(cust.fullName, html, 'info');
        },

        // ============================================================
        // MY SALES (seller's own only)
        // ============================================================
        renderMySales(c) {
            const cur = db.data.settings.currency;
            const mySales = db.data.sales.filter(s => s.sellerId === session.userId).sort((a, b) => new Date(b.date) - new Date(a.date));
            c.innerHTML = `
                <div class="page-header"><div class="page-title"><h2>My Sales History</h2><p>Your completed transactions only.</p></div></div>
                <div class="panel-card"><div class="table-responsive"><table class="custom-table"><thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th>Payment</th><th>Total</th><th>Action</th></tr></thead>
                <tbody>${mySales.length === 0 ? '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);">No sales yet.</td></tr>' : mySales.map(s => `<tr><td><code>${s.id}</code></td><td>${s.date}</td><td>${s.customerName}</td><td><span class="badge badge-primary">${s.paymentMethod}</span></td><td><strong>${cur}${s.grandTotal.toFixed(2)}</strong></td><td><button class="btn btn-secondary btn-xs" onclick="App.showReceipt('${s.id}')">Receipt</button></td></tr>`).join('')}</tbody></table></div></div>
            `;
        }
    };

    window.App = App;
    App.init();
});
