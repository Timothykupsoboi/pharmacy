// ============================================================
// Pharmacy Management System — Enterprise DB Engine (FIXED)
// ============================================================

const DB_KEY = "phama_enterprise_db";

function getRelativeDate(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split("T")[0];
}

function generateId(prefix) {
    return (
        prefix +
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 8)
    );
}

// Default seed data (kept minimal but compatible with app expectations)
const DEFAULT_DB = {
    admins: [
        { id: 'ADM001', username: 'admin', passwordHash: '', fullName: 'System Administrator', email: 'admin@edocpharmacy.com', phone: '', active: true, failedAttempts: 0, lockedUntil: null, lastLogin: null, createdAt: getRelativeDate(-90) }
    ],
    sellers: [
        { id: 'SEL001', username: 'seller1', passwordHash: '', fullName: 'John Kimani', email: 'john.k@edocpharmacy.com', phone: '', active: true, failedAttempts: 0, lockedUntil: null, lastLogin: null, createdAt: getRelativeDate(-60) }
    ],
    medicine_categories: ['Analgesics','Antibiotics','Cardiovascular','Antidiabetic','Respiratory'],
    medicines: [
        { id: 'MED001', barcode: '8901030722396', drugName: 'Amoxicillin 500mg', genericName: 'Amoxicillin Trihydrate', brandName: 'Amoxil', manufacturer: 'GSK', category: 'Antibiotics', country: 'USA', prescriptionRequired: true, batchNumber: 'AMX-2026-01', manufactureDate: getRelativeDate(-90), expiryDate: getRelativeDate(270), quantity: 120, openingStock: 100, reorderLevel: 20, shelfLocation: 'A1-03', costPrice: 12.5, sellingPrice: 18.0, profitMargin: 30.56, taxRate: 5, discountEligibility: true }
    ],
    suppliers: [ { id: 'SUP001', companyName: 'PharmaCorp Inc.', contactPerson: 'John Doe', phone: '', email: 'sales@pharmacorp.com', address: '', outstandingBalance: 250.00, createdAt: getRelativeDate(-120) } ],
    customers: [ { id: 'CUS001', fullName: 'Alice Johnson', phone: '', email: '', address: '', dateRegistered: getRelativeDate(-30) } ],
    inventory: [],
    stock_batches: [ { id: 'SB001', supplierId: 'SUP001', medicineId: 'MED001', batchNumber: 'AMX-2026-01', quantity: 40, costPrice: 12.5, expiryDate: getRelativeDate(270), dateAdded: getRelativeDate(-10), type: 'purchase' } ],
    damaged_stock: [],
    sales: [],
    sale_items: [],
    payments: [],
    prescriptions: [],
    price_history: [],
    audit_logs: [],
    notifications: [],
    settings: { pharmacyName: 'Edoc Pharmacy', currency: '$', defaultTaxRate: 5 }
};

// ============================================================
// DATABASE CLASS
// ============================================================
class PharmacyDB {
    constructor() {
        this.data = null;
        this.init();
    }

    safeArray(arr) {
        return Array.isArray(arr) ? arr : [];
    }

    init() {
        try {
            const raw = localStorage.getItem(DB_KEY);

            if (raw) {
                this.data = JSON.parse(raw);

                const defaults = JSON.parse(JSON.stringify(DEFAULT_DB));

                Object.keys(defaults).forEach((key) => {
                    if (this.data[key] === undefined) {
                        this.data[key] = defaults[key];
                    }
                });

                this.save();
            } else {
                this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
                this.save();
            }
        } catch (e) {
            console.error("DB init error, resetting:", e);
            this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
            this.save();
        }
    }

    save() {
        try {
            localStorage.setItem(DB_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error("DB save failed:", e);
        }
        // if Supabase is enabled, attempt to push changes asynchronously (best-effort)
        if (this.useSupabase && window.Supa) {
            (async () => {
                try {
                    await this.pushToSupabase({ dryRun: false });
                } catch (err) {
                    console.warn('DB: pushToSupabase failed:', err.message || err);
                }
            })();
        }
    }

    reset() {
        this.data = JSON.parse(JSON.stringify(DEFAULT_DB));

        this.data.admins.forEach((a) => (a.passwordHash = ""));
        this.data.sellers.forEach((s) => (s.passwordHash = ""));

        this.save();
    }

    importBackup(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);

            const requiredKeys = ["medicines", "settings", "sales", "customers"];

            const valid = requiredKeys.every((k) => parsed[k]);

            if (!valid) return false;

            this.data = parsed;
            this.save();
            return true;
        } catch (e) {
            console.error("Import failed:", e);
            return false;
        }
    }

    // ============================================================
    // LOGGING
    // ============================================================
    logAudit(userId, userName, role, action, details) {
        this.data.audit_logs = this.safeArray(this.data.audit_logs);

        this.data.audit_logs.unshift({
            id: generateId("LOG"),
            userId,
            userName,
            role,
            action,
            details,
            timestamp: new Date().toISOString(),
            ipAddress: "127.0.0.1",
        });

        if (this.data.audit_logs.length > 2000) {
            this.data.audit_logs.length = 2000;
        }

        this.save();
    }

    logPriceChange(
        medicineId,
        medicineName,
        field,
        oldValue,
        newValue,
        changedBy,
        changedByName,
        reason
    ) {
        this.data.price_history = this.safeArray(this.data.price_history);

        this.data.price_history.unshift({
            id: generateId("PH"),
            medicineId,
            medicineName,
            field,
            oldValue,
            newValue,
            changedBy,
            changedByName,
            reason,
            timestamp: new Date().toISOString(),
        });

        this.save();
    }

    // ============================================================
    // STOCK LOGIC (FIXED SAFETY)
    // ============================================================
    recalcStock(medId) {
        const med = this.data.medicines?.find((m) => m.id === medId);
        if (!med) return;

        const opening = med.openingStock || 0;

        const purchased = this.safeArray(this.data.stock_batches)
            .filter((b) => b.medicineId === medId && b.type === "purchase")
            .reduce((s, b) => s + (b.quantity || 0), 0);

        const sold = this.safeArray(this.data.sale_items)
            .filter((si) => si.medicineId === medId)
            .reduce((s, si) => s + (si.quantity || 0), 0);

        const damaged = this.safeArray(this.data.damaged_stock)
            .filter((d) => d.medicineId === medId)
            .reduce((s, d) => s + (d.quantity || 0), 0);

        const returned = this.safeArray(this.data.stock_batches)
            .filter((b) => b.medicineId === medId && b.type === "return")
            .reduce((s, b) => s + (b.quantity || 0), 0);

        med.quantity = opening + purchased - sold - damaged + returned;

        this.save();
    }

    recalcAllStock() {
        this.safeArray(this.data.medicines).forEach((m) =>
            this.recalcStock(m.id)
        );
    }

    // ============================================================
    // EXPIRY
    // ============================================================
    getExpiryStatus(expiryDateStr) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiry = new Date(expiryDateStr);
        expiry.setHours(0, 0, 0, 0);

        const diffDays = Math.ceil(
            (expiry - today) / (1000 * 60 * 60 * 24)
        );

        if (diffDays <= 0)
            return { label: "Expired", cls: "critical", level: 0, daysLeft: diffDays };

        if (diffDays <= 30)
            return {
                label: `Critical (${diffDays}d)`,
                cls: "critical",
                level: 1,
                daysLeft: diffDays,
            };

        if (diffDays <= 90)
            return {
                label: `Warning (${diffDays}d)`,
                cls: "warning",
                level: 2,
                daysLeft: diffDays,
            };

        return { label: "Normal", cls: "normal", level: 3, daysLeft: diffDays };
    }

    // ============================================================
    // NOTIFICATIONS (FIXED - NO RESET LOSS PROBLEM)
    // ============================================================
    refreshNotifications() {
        const existing = this.safeArray(this.data.notifications);

        const newNotifs = [];

        const medicines = this.safeArray(this.data.medicines);

        medicines.forEach((m) => {
            if (m.quantity <= m.reorderLevel) {
                newNotifs.push({
                    id: generateId("NOT"),
                    type: "low_stock",
                    title: "Low Stock",
                    message: `${m.drugName}: ${m.quantity} units left`,
                    read: false,
                    createdAt: new Date().toISOString(),
                });
            }

            const exp = this.getExpiryStatus(m.expiryDate);

            if (exp.level === 0) {
                newNotifs.push({
                    id: generateId("NOT"),
                    type: "expired",
                    title: "Expired",
                    message: `${m.drugName} expired`,
                    read: false,
                    createdAt: new Date().toISOString(),
                });
            } else if (exp.level === 1) {
                newNotifs.push({
                    id: generateId("NOT"),
                    type: "near_expiry",
                    title: "Near Expiry",
                    message: `${m.drugName} expires in ${exp.daysLeft} days`,
                    read: false,
                    createdAt: new Date().toISOString(),
                });
            }
        });

        this.safeArray(this.data.suppliers).forEach((s) => {
            if (s.outstandingBalance > 0) {
                newNotifs.push({
                    id: generateId("NOT"),
                    type: "payment",
                    title: "Outstanding Payment",
                    message: `${s.companyName}: ${this.data.settings.currency}${s.outstandingBalance}`,
                    read: false,
                    createdAt: new Date().toISOString(),
                });
            }
        });

        // merge instead of overwrite (IMPORTANT FIX)
        this.data.notifications = [...existing, ...newNotifs];

        this.save();
    }
}

// ============================================================
// INIT
// ============================================================
const db = new PharmacyDB();
db.recalcAllStock();

window.DB = db;
window.generateId = generateId;
window.getRelativeDate = getRelativeDate;

// ============================================================
// Supabase helpers on PharmacyDB
// ============================================================
PharmacyDB.prototype.enableSupabase = async function(url, anonKey) {
    if (!window.Supa) throw new Error('Supa wrapper not found. Ensure js/supabase.js is loaded');
    await window.Supa.init(url, anonKey);
    this.supabase = window.Supa.client;
    this.useSupabase = true;
    return this.supabase;
};

PharmacyDB.prototype.pullFromSupabase = async function(tables) {
    if (!this.useSupabase) throw new Error('Supabase not enabled. Call enableSupabase() first');
    const result = {};
    const keys = Array.isArray(tables) ? tables : Object.keys(this.data);
    for (const k of keys) {
        try {
            const rows = await window.Supa.fetchAll(k);
            if (Array.isArray(rows)) {
                this.data[k] = rows;
                result[k] = { ok: true, count: rows.length };
            } else {
                result[k] = { ok: false, error: 'No rows returned' };
            }
        } catch (e) {
            result[k] = { ok: false, error: e.message };
        }
    }
    this.save();
    return result;
};

PharmacyDB.prototype.pushToSupabase = async function(options = { dryRun: true, tables: null }) {
    if (!this.useSupabase) throw new Error('Supabase not enabled. Call enableSupabase() first');
    // Delegate to Supa.syncLocalDBToSupabase if present
    if (window.Supa && typeof window.Supa.syncLocalDBToSupabase === 'function') {
        return await window.Supa.syncLocalDBToSupabase(options);
    }
    // fallback: manual upsert
    const keys = options.tables && Array.isArray(options.tables) ? options.tables : Object.keys(this.data);
    const results = {};
    for (const k of keys) {
        try {
            const rows = Array.isArray(this.data[k]) ? this.data[k] : [];
            if (options.dryRun) {
                results[k] = { ok: true, count: rows.length, action: 'dry-run' };
            } else {
                const res = await window.Supa.upsert(k, rows);
                results[k] = { ok: true, count: Array.isArray(res) ? res.length : (res ? 1 : 0) };
            }
        } catch (e) {
            results[k] = { ok: false, error: e.message };
        }
    }
    return results;
};

// Auto-init Supabase client if config provided (does not push/pull data)
;(async function autoInitSupa(){
    try{
        const cfg = window.SUPABASE_CONFIG || (window.SUPABASE_URL && window.SUPABASE_ANON_KEY ? { url: window.SUPABASE_URL, anonKey: window.SUPABASE_ANON_KEY } : null);
        if (cfg && window.Supa) {
            await db.enableSupabase(cfg.url, cfg.anonKey);
            console.info('PharmacyDB: Supabase client initialized');
            // Pull data from Supabase to use as primary persistence (overrides local cache)
            try {
                const keys = Object.keys(db.data || {});
                const res = await db.pullFromSupabase(keys);
                console.info('PharmacyDB: pulled data from Supabase', res);
            } catch (pullErr) {
                console.warn('PharmacyDB: pullFromSupabase failed:', pullErr.message || pullErr);
            }
        }
    }catch(e){
        console.warn('PharmacyDB: Supabase auto-init failed:', e.message);
    }
})();
