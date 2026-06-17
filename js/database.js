// ============================================================
// Pharmacy Management System — Enterprise Database Engine
// ============================================================

const DB_KEY = 'phama_enterprise_db';

function getRelativeDate(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
}

function generateId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Default seed data
const DEFAULT_DB = {
    admins: [
        {
            id: 'ADM001',
            username: 'admin',
            passwordHash: '', // Will be set on first init via auth.js
            fullName: 'System Administrator',
            email: 'admin@edocpharmacy.com',
            phone: '+1 (555) 100-0001',
            active: true,
            failedAttempts: 0,
            lockedUntil: null,
            lastLogin: null,
            createdAt: getRelativeDate(-90)
        }
    ],
    sellers: [
        {
            id: 'SEL001',
            username: 'seller1',
            passwordHash: '',
            fullName: 'John Kimani',
            email: 'john.k@edocpharmacy.com',
            phone: '+1 (555) 200-0001',
            active: true,
            failedAttempts: 0,
            lockedUntil: null,
            lastLogin: null,
            createdAt: getRelativeDate(-60)
        },
        {
            id: 'SEL002',
            username: 'seller2',
            passwordHash: '',
            fullName: 'Mary Wanjiku',
            email: 'mary.w@edocpharmacy.com',
            phone: '+1 (555) 200-0002',
            active: true,
            failedAttempts: 0,
            lockedUntil: null,
            lastLogin: null,
            createdAt: getRelativeDate(-45)
        }
    ],
    medicine_categories: [
        'Analgesics', 'Antibiotics', 'Antivirals', 'Cardiovascular', 'Antidiabetic',
        'Respiratory', 'Dermatological', 'Vitamins & Supplements', 'Gastrointestinal',
        'Antifungal', 'Hormones', 'Vaccines'
    ],
    medicines: [
        {
            id: 'MED001', barcode: '8901030722396', qrCode: 'MED001-QR',
            drugName: 'Amoxicillin 500mg', genericName: 'Amoxicillin Trihydrate',
            brandName: 'Amoxil', manufacturer: 'GlaxoSmithKline', category: 'Antibiotics',
            country: 'USA', drugImage: '',
            activeIngredient: 'Amoxicillin', strength: '500mg', dosageForm: 'Capsule',
            routeOfAdministration: 'Oral', indications: 'Bacterial infections, UTI, respiratory infections',
            contraindications: 'Penicillin allergy', sideEffects: 'Nausea, diarrhea, rash',
            drugInteractions: 'Oral contraceptives, methotrexate', storageInstructions: 'Store below 25°C in a dry place',
            prescriptionRequired: true,
            batchNumber: 'AMX-2026-01', manufactureDate: getRelativeDate(-90),
            expiryDate: getRelativeDate(270), quantity: 120, openingStock: 100,
            reorderLevel: 20, shelfLocation: 'A1-03',
            costPrice: 12.50, sellingPrice: 18.00, profitMargin: 30.56,
            taxRate: 5, discountEligibility: true
        },
        {
            id: 'MED002', barcode: '8901030722402', qrCode: 'MED002-QR',
            drugName: 'Lipitor 20mg', genericName: 'Atorvastatin Calcium',
            brandName: 'Lipitor', manufacturer: 'Pfizer Inc.', category: 'Cardiovascular',
            country: 'USA', drugImage: '',
            activeIngredient: 'Atorvastatin', strength: '20mg', dosageForm: 'Tablet',
            routeOfAdministration: 'Oral', indications: 'High cholesterol, cardiovascular disease prevention',
            contraindications: 'Active liver disease, pregnancy', sideEffects: 'Muscle pain, headache',
            drugInteractions: 'Clarithromycin, grapefruit juice', storageInstructions: 'Store at room temperature',
            prescriptionRequired: true,
            batchNumber: 'LIP-2025-05', manufactureDate: getRelativeDate(-300),
            expiryDate: getRelativeDate(-10), quantity: 45, openingStock: 50,
            reorderLevel: 15, shelfLocation: 'B2-07',
            costPrice: 45.00, sellingPrice: 65.00, profitMargin: 30.77,
            taxRate: 8, discountEligibility: true
        },
        {
            id: 'MED003', barcode: '8901030722419', qrCode: 'MED003-QR',
            drugName: 'Paracetamol 500mg', genericName: 'Acetaminophen',
            brandName: 'Panadol', manufacturer: 'Haleon', category: 'Analgesics',
            country: 'UK', drugImage: '',
            activeIngredient: 'Acetaminophen', strength: '500mg', dosageForm: 'Tablet',
            routeOfAdministration: 'Oral', indications: 'Fever, mild to moderate pain, headache',
            contraindications: 'Severe liver impairment', sideEffects: 'Rare allergic reaction',
            drugInteractions: 'Alcohol, warfarin', storageInstructions: 'Store below 30°C',
            prescriptionRequired: false,
            batchNumber: 'PAN-2026-03', manufactureDate: getRelativeDate(-60),
            expiryDate: getRelativeDate(400), quantity: 8, openingStock: 200,
            reorderLevel: 30, shelfLocation: 'A1-01',
            costPrice: 1.20, sellingPrice: 3.50, profitMargin: 65.71,
            taxRate: 5, discountEligibility: true
        },
        {
            id: 'MED004', barcode: '8901030722426', qrCode: 'MED004-QR',
            drugName: 'Ventolin Inhaler', genericName: 'Albuterol Sulfate',
            brandName: 'Ventolin', manufacturer: 'GlaxoSmithKline', category: 'Respiratory',
            country: 'UK', drugImage: '',
            activeIngredient: 'Albuterol', strength: '100mcg/puff', dosageForm: 'Inhaler',
            routeOfAdministration: 'Inhalation', indications: 'Asthma, bronchospasm',
            contraindications: 'Hypersensitivity', sideEffects: 'Tremor, tachycardia',
            drugInteractions: 'Beta-blockers, diuretics', storageInstructions: 'Store below 30°C, protect from frost',
            prescriptionRequired: true,
            batchNumber: 'VEN-2026-02', manufactureDate: getRelativeDate(-120),
            expiryDate: getRelativeDate(18), quantity: 35, openingStock: 40,
            reorderLevel: 10, shelfLocation: 'C3-02',
            costPrice: 15.00, sellingPrice: 22.00, profitMargin: 31.82,
            taxRate: 5, discountEligibility: false
        },
        {
            id: 'MED005', barcode: '8901030722433', qrCode: 'MED005-QR',
            drugName: 'Metformin 850mg', genericName: 'Metformin Hydrochloride',
            brandName: 'Glucophage', manufacturer: 'Merck', category: 'Antidiabetic',
            country: 'France', drugImage: '',
            activeIngredient: 'Metformin', strength: '850mg', dosageForm: 'Tablet',
            routeOfAdministration: 'Oral', indications: 'Type 2 diabetes mellitus',
            contraindications: 'Renal impairment, metabolic acidosis', sideEffects: 'Nausea, flatulence, metallic taste',
            drugInteractions: 'Contrast media, cimetidine', storageInstructions: 'Store at room temperature',
            prescriptionRequired: true,
            batchNumber: 'MET-2026-04', manufactureDate: getRelativeDate(-45),
            expiryDate: getRelativeDate(600), quantity: 130, openingStock: 150,
            reorderLevel: 25, shelfLocation: 'B1-04',
            costPrice: 8.00, sellingPrice: 14.50, profitMargin: 44.83,
            taxRate: 5, discountEligibility: true
        },
        {
            id: 'MED006', barcode: '8901030722440', qrCode: 'MED006-QR',
            drugName: 'Omeprazole 20mg', genericName: 'Omeprazole',
            brandName: 'Prilosec', manufacturer: 'AstraZeneca', category: 'Gastrointestinal',
            country: 'Sweden', drugImage: '',
            activeIngredient: 'Omeprazole', strength: '20mg', dosageForm: 'Capsule',
            routeOfAdministration: 'Oral', indications: 'GERD, peptic ulcers, acid reflux',
            contraindications: 'Hypersensitivity to PPIs', sideEffects: 'Headache, abdominal pain',
            drugInteractions: 'Clopidogrel, methotrexate', storageInstructions: 'Store below 25°C',
            prescriptionRequired: false,
            batchNumber: 'OMP-2026-01', manufactureDate: getRelativeDate(-30),
            expiryDate: getRelativeDate(500), quantity: 95, openingStock: 100,
            reorderLevel: 20, shelfLocation: 'A2-05',
            costPrice: 5.00, sellingPrice: 9.50, profitMargin: 47.37,
            taxRate: 5, discountEligibility: true
        }
    ],
    suppliers: [
        { id: 'SUP001', companyName: 'PharmaCorp Inc.', contactPerson: 'John Doe', phone: '+1 (555) 019-2834', email: 'sales@pharmacorp.com', address: '100 Biotech Way, Boston MA', outstandingBalance: 250.00, createdAt: getRelativeDate(-120) },
        { id: 'SUP002', companyName: 'Global Meds Ltd.', contactPerson: 'Jane Smith', phone: '+1 (555) 043-9821', email: 'info@globalmeds.com', address: '45 Pill Lane, New York NY', outstandingBalance: 0.00, createdAt: getRelativeDate(-100) },
        { id: 'SUP003', companyName: 'Apex Distributors', contactPerson: 'Robert Lee', phone: '+1 (555) 076-4311', email: 'orders@apexdist.com', address: '82 Logistics Blvd, Chicago IL', outstandingBalance: 1200.00, createdAt: getRelativeDate(-80) }
    ],
    customers: [
        { id: 'CUS001', fullName: 'Alice Johnson', phone: '+1 (555) 015-8822', email: 'alice@gmail.com', address: '12 Maple St, Boston MA', dateRegistered: getRelativeDate(-30) },
        { id: 'CUS002', fullName: 'Bob Miller', phone: '+1 (555) 012-4433', email: 'bob.miller@yahoo.com', address: '405 Oak Ave, Quincy MA', dateRegistered: getRelativeDate(-15) },
        { id: 'CUS003', fullName: 'Charlie Davis', phone: '+1 (555) 019-5566', email: 'charlie.d@gmail.com', address: '88 Pine Rd, Cambridge MA', dateRegistered: getRelativeDate(-5) }
    ],
    inventory: [],
    stock_batches: [
        { id: 'SB001', supplierId: 'SUP001', medicineId: 'MED001', batchNumber: 'AMX-2026-01', quantity: 40, costPrice: 12.50, expiryDate: getRelativeDate(270), dateAdded: getRelativeDate(-10), type: 'purchase' },
        { id: 'SB002', supplierId: 'SUP003', medicineId: 'MED004', batchNumber: 'VEN-2026-02', quantity: 10, costPrice: 15.00, expiryDate: getRelativeDate(18), dateAdded: getRelativeDate(-5), type: 'purchase' }
    ],
    damaged_stock: [],
    sales: [
        { id: 'SAL1001', date: getRelativeDate(-25), sellerId: 'SEL001', sellerName: 'John Kimani', customerId: 'CUS001', customerName: 'Alice Johnson', subtotal: 36.00, tax: 1.80, discount: 0.00, grandTotal: 37.80, paymentMethod: 'Cash', status: 'completed' },
        { id: 'SAL1002', date: getRelativeDate(-10), sellerId: 'SEL001', sellerName: 'John Kimani', customerId: 'CUS002', customerName: 'Bob Miller', subtotal: 130.00, tax: 10.40, discount: 5.00, grandTotal: 135.40, paymentMethod: 'Card', status: 'completed' },
        { id: 'SAL1003', date: getRelativeDate(-2), sellerId: 'SEL002', sellerName: 'Mary Wanjiku', customerId: 'CUS003', customerName: 'Charlie Davis', subtotal: 58.00, tax: 2.90, discount: 2.00, grandTotal: 58.90, paymentMethod: 'Cash', status: 'completed' },
        { id: 'SAL1004', date: getRelativeDate(0), sellerId: 'SEL001', sellerName: 'John Kimani', customerId: 'CUS001', customerName: 'Alice Johnson', subtotal: 21.50, tax: 1.08, discount: 1.00, grandTotal: 21.58, paymentMethod: 'M-Pesa', status: 'completed' }
    ],
    sale_items: [
        { saleId: 'SAL1001', medicineId: 'MED001', drugName: 'Amoxicillin 500mg', quantity: 2, unitPrice: 18.00, total: 36.00 },
        { saleId: 'SAL1002', medicineId: 'MED002', drugName: 'Lipitor 20mg', quantity: 2, unitPrice: 65.00, total: 130.00 },
        { saleId: 'SAL1003', medicineId: 'MED001', drugName: 'Amoxicillin 500mg', quantity: 1, unitPrice: 18.00, total: 18.00 },
        { saleId: 'SAL1003', medicineId: 'MED004', drugName: 'Ventolin Inhaler', quantity: 1, unitPrice: 22.00, total: 22.00 },
        { saleId: 'SAL1003', medicineId: 'MED003', drugName: 'Paracetamol 500mg', quantity: 5, unitPrice: 3.50, total: 17.50 },
        { saleId: 'SAL1004', medicineId: 'MED003', drugName: 'Paracetamol 500mg', quantity: 1, unitPrice: 3.50, total: 3.50 },
        { saleId: 'SAL1004', medicineId: 'MED001', drugName: 'Amoxicillin 500mg', quantity: 1, unitPrice: 18.00, total: 18.00 }
    ],
    payments: [
        { id: 'PAY001', saleId: 'SAL1001', amount: 37.80, method: 'Cash', date: getRelativeDate(-25), reference: '' },
        { id: 'PAY002', saleId: 'SAL1002', amount: 135.40, method: 'Card', date: getRelativeDate(-10), reference: 'VISA-****4532' },
        { id: 'PAY003', saleId: 'SAL1003', amount: 58.90, method: 'Cash', date: getRelativeDate(-2), reference: '' },
        { id: 'PAY004', saleId: 'SAL1004', amount: 21.58, method: 'M-Pesa', date: getRelativeDate(0), reference: 'MPESA-TX9928' }
    ],
    prescriptions: [
        { id: 'RX001', patientName: 'Alice Johnson', doctorName: 'Dr. Sarah Smith', doctorPhone: '+1 (555) 300-1122', dateIssued: getRelativeDate(-5), medicines: 'Amoxicillin 500mg (Qty: 2)', status: 'Verified', verifiedBy: 'ADM001', verifiedAt: getRelativeDate(-4), imagePath: 'mock', notes: '' },
        { id: 'RX002', patientName: 'Bob Miller', doctorName: 'Dr. Gregory House', doctorPhone: '+1 (555) 300-3344', dateIssued: getRelativeDate(-1), medicines: 'Lipitor 20mg (Qty: 2)', status: 'Pending', verifiedBy: null, verifiedAt: null, imagePath: '', notes: '' }
    ],
    price_history: [
        { id: 'PH001', medicineId: 'MED003', medicineName: 'Paracetamol 500mg', field: 'sellingPrice', oldValue: 3.00, newValue: 3.50, changedBy: 'ADM001', changedByName: 'System Administrator', reason: 'Market adjustment', timestamp: new Date(Date.now() - 86400000 * 15).toISOString() }
    ],
    audit_logs: [
        { id: 'LOG001', userId: 'ADM001', userName: 'System Administrator', role: 'admin', action: 'System Setup', details: 'Enterprise Edition initialized with seed data.', timestamp: new Date(Date.now() - 86400000 * 5).toISOString(), ipAddress: '127.0.0.1' },
        { id: 'LOG002', userId: 'ADM001', userName: 'System Administrator', role: 'admin', action: 'Stock Added', details: 'Added 40 units of Amoxicillin 500mg. Batch AMX-2026-01.', timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), ipAddress: '127.0.0.1' },
        { id: 'LOG003', userId: 'SEL001', userName: 'John Kimani', role: 'seller', action: 'Sale Completed', details: 'Invoice SAL1003 for Charlie Davis.', timestamp: new Date(Date.now() - 3600000 * 12).toISOString(), ipAddress: '127.0.0.1' }
    ],
    notifications: [
        { id: 'NOT001', type: 'low_stock', title: 'Low Stock Alert', message: 'Paracetamol 500mg has only 8 units left (min: 30).', read: false, createdAt: new Date().toISOString() },
        { id: 'NOT002', type: 'expired', title: 'Expired Medicine', message: 'Lipitor 20mg expired on ' + getRelativeDate(-10) + '.', read: false, createdAt: new Date().toISOString() },
        { id: 'NOT003', type: 'near_expiry', title: 'Near Expiry', message: 'Ventolin Inhaler expires in 18 days.', read: false, createdAt: new Date().toISOString() }
    ],
    settings: {
        pharmacyName: 'Edoc Pharmacy',
        pharmacyLogo: '',
        pharmacyAddress: '123 Medical Center Boulevard, Suite 100',
        pharmacyPhone: '+1 (555) 742-7629',
        pharmacyEmail: 'info@edocpharmacy.com',
        currency: '$',
        currencyCode: 'USD',
        defaultTaxRate: 5,
        defaultDiscountLimit: 20,
        receiptFooter: 'Thank you for choosing Edoc Pharmacy! Your health is our priority.',
        businessHours: 'Mon-Sat: 8:00 AM - 9:00 PM | Sun: 10:00 AM - 6:00 PM'
    }
};

// ============================================================
// Database Manager Class
// ============================================================
class PharmacyDB {
    constructor() {
        this.data = null;
        this.init();
    }

    init() {
        try {
            const raw = localStorage.getItem(DB_KEY);
            if (raw) {
                this.data = JSON.parse(raw);
                // Ensure new tables exist
                const defaults = JSON.parse(JSON.stringify(DEFAULT_DB));
                Object.keys(defaults).forEach(key => {
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
            console.error('DB init error, resetting:', e);
            this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
            this.save();
        }
    }

    save() {
        try {
            localStorage.setItem(DB_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('DB save failed:', e);
        }
    }

    reset() {
        this.data = JSON.parse(JSON.stringify(DEFAULT_DB));
        // Clear password hashes so auth.js re-seeds them
        this.data.admins.forEach(a => a.passwordHash = '');
        this.data.sellers.forEach(s => s.passwordHash = '');
        this.save();
    }

    importBackup(jsonString) {
        try {
            const parsed = JSON.parse(jsonString);
            if (parsed && parsed.medicines && parsed.settings) {
                this.data = parsed;
                this.save();
                return true;
            }
        } catch (e) { console.error('Import failed:', e); }
        return false;
    }

    // Audit Logger
    logAudit(userId, userName, role, action, details) {
        this.data.audit_logs.unshift({
            id: generateId('LOG'),
            userId, userName, role, action, details,
            timestamp: new Date().toISOString(),
            ipAddress: '127.0.0.1'
        });
        if (this.data.audit_logs.length > 2000) this.data.audit_logs.pop();
        this.save();
    }

    // Price Change Logger
    logPriceChange(medicineId, medicineName, field, oldValue, newValue, changedBy, changedByName, reason) {
        this.data.price_history.unshift({
            id: generateId('PH'),
            medicineId, medicineName, field, oldValue, newValue,
            changedBy, changedByName, reason,
            timestamp: new Date().toISOString()
        });
        this.save();
    }

    // Expiry Status Calculator
    getExpiryStatus(expiryDateStr) {
        const today = new Date(); today.setHours(0,0,0,0);
        const expiry = new Date(expiryDateStr); expiry.setHours(0,0,0,0);
        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) return { label: 'Expired', cls: 'critical', level: 0, daysLeft: diffDays };
        if (diffDays <= 30) return { label: `Critical (${diffDays}d)`, cls: 'critical', level: 1, daysLeft: diffDays };
        if (diffDays <= 90) return { label: `Warning (${diffDays}d)`, cls: 'warning', level: 2, daysLeft: diffDays };
        return { label: 'Normal', cls: 'normal', level: 3, daysLeft: diffDays };
    }

    // Recalculate medicine stock from batches/sales/damaged
    recalcStock(medId) {
        const med = this.data.medicines.find(m => m.id === medId);
        if (!med) return;
        const opening = med.openingStock || 0;
        const purchased = this.data.stock_batches.filter(b => b.medicineId === medId && b.type === 'purchase').reduce((s, b) => s + b.quantity, 0);
        const sold = this.data.sale_items.filter(si => si.medicineId === medId).reduce((s, si) => s + si.quantity, 0);
        const damaged = this.data.damaged_stock.filter(d => d.medicineId === medId).reduce((s, d) => s + d.quantity, 0);
        const returned = this.data.stock_batches.filter(b => b.medicineId === medId && b.type === 'return').reduce((s, b) => s + b.quantity, 0);
        med.quantity = opening + purchased - sold - damaged - returned;
        this.save();
    }

    recalcAllStock() {
        this.data.medicines.forEach(m => this.recalcStock(m.id));
    }

    // Notification scanner
    refreshNotifications() {
        const notifs = [];
        this.data.medicines.forEach(m => {
            if (m.quantity <= m.reorderLevel) {
                notifs.push({ id: generateId('NOT'), type: 'low_stock', title: 'Low Stock', message: `${m.drugName}: ${m.quantity} units left (min: ${m.reorderLevel})`, read: false, createdAt: new Date().toISOString() });
            }
            const exp = this.getExpiryStatus(m.expiryDate);
            if (exp.level === 0) {
                notifs.push({ id: generateId('NOT'), type: 'expired', title: 'Expired', message: `${m.drugName} expired on ${m.expiryDate}!`, read: false, createdAt: new Date().toISOString() });
            } else if (exp.level === 1) {
                notifs.push({ id: generateId('NOT'), type: 'near_expiry', title: 'Near Expiry', message: `${m.drugName} expires in ${exp.daysLeft} days.`, read: false, createdAt: new Date().toISOString() });
            }
        });
        this.data.suppliers.forEach(s => {
            if (s.outstandingBalance > 0) {
                notifs.push({ id: generateId('NOT'), type: 'payment', title: 'Outstanding Payment', message: `${s.companyName}: ${this.data.settings.currency}${s.outstandingBalance.toFixed(2)} outstanding.`, read: false, createdAt: new Date().toISOString() });
            }
        });
        this.data.notifications = notifs;
        this.save();
    }
}

// Singleton
const db = new PharmacyDB();
db.recalcAllStock();
window.DB = db;
window.generateId = generateId;
window.getRelativeDate = getRelativeDate;
