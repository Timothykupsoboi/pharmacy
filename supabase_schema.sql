-- ==============================================================================
-- Edoc Pharmacy Enterprise - Supabase Schema
-- ==============================================================================

-- 1. Admins Table
CREATE TABLE IF NOT EXISTS admins (
    "id" TEXT PRIMARY KEY,
    "username" TEXT UNIQUE,
    "passwordHash" TEXT,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "active" BOOLEAN DEFAULT TRUE,
    "failedAttempts" INTEGER DEFAULT 0,
    "lockedUntil" TEXT,
    "lastLogin" TEXT,
    "createdAt" TEXT
);

-- 2. Sellers Table
CREATE TABLE IF NOT EXISTS sellers (
    "id" TEXT PRIMARY KEY,
    "username" TEXT UNIQUE,
    "passwordHash" TEXT,
    "fullName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "active" BOOLEAN DEFAULT TRUE,
    "failedAttempts" INTEGER DEFAULT 0,
    "lockedUntil" TEXT,
    "lastLogin" TEXT,
    "createdAt" TEXT
);

-- 3. Medicine Categories (Single Column for strings)
CREATE TABLE IF NOT EXISTS medicine_categories (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT UNIQUE
);

-- 4. Medicines
CREATE TABLE IF NOT EXISTS medicines (
    "id" TEXT PRIMARY KEY,
    "barcode" TEXT,
    "drugName" TEXT,
    "genericName" TEXT,
    "brandName" TEXT,
    "manufacturer" TEXT,
    "category" TEXT,
    "country" TEXT,
    "prescriptionRequired" BOOLEAN DEFAULT FALSE,
    "batchNumber" TEXT,
    "manufactureDate" TEXT,
    "expiryDate" TEXT,
    "quantity" INTEGER DEFAULT 0,
    "openingStock" INTEGER DEFAULT 0,
    "reorderLevel" INTEGER DEFAULT 0,
    "shelfLocation" TEXT,
    "costPrice" NUMERIC(10, 2) DEFAULT 0.00,
    "sellingPrice" NUMERIC(10, 2) DEFAULT 0.00,
    "profitMargin" NUMERIC(10, 2) DEFAULT 0.00,
    "taxRate" NUMERIC(5, 2) DEFAULT 0.00,
    "discountEligibility" BOOLEAN DEFAULT FALSE
);

-- 5. Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    "id" TEXT PRIMARY KEY,
    "companyName" TEXT,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "outstandingBalance" NUMERIC(12, 2) DEFAULT 0.00,
    "createdAt" TEXT
);

-- 6. Customers
CREATE TABLE IF NOT EXISTS customers (
    "id" TEXT PRIMARY KEY,
    "fullName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "dateRegistered" TEXT
);

-- 7. Stock Batches
CREATE TABLE IF NOT EXISTS stock_batches (
    "id" TEXT PRIMARY KEY,
    "supplierId" TEXT,
    "medicineId" TEXT,
    "batchNumber" TEXT,
    "quantity" INTEGER,
    "costPrice" NUMERIC(10, 2),
    "expiryDate" TEXT,
    "dateAdded" TEXT,
    "type" TEXT
);

-- 8. Damaged Stock
CREATE TABLE IF NOT EXISTS damaged_stock (
    "id" TEXT PRIMARY KEY,
    "medicineId" TEXT,
    "quantity" INTEGER,
    "reason" TEXT,
    "reportedBy" TEXT,
    "dateReported" TEXT
);

-- 9. Sales
CREATE TABLE IF NOT EXISTS sales (
    "id" TEXT PRIMARY KEY,
    "date" TEXT,
    "sellerId" TEXT,
    "sellerName" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "subtotal" NUMERIC(12, 2),
    "tax" NUMERIC(10, 2),
    "discount" NUMERIC(10, 2),
    "grandTotal" NUMERIC(12, 2),
    "paymentMethod" TEXT,
    "status" TEXT
);

-- 10. Sale Items
CREATE TABLE IF NOT EXISTS sale_items (
    "id" SERIAL PRIMARY KEY,
    "saleId" TEXT,
    "medicineId" TEXT,
    "drugName" TEXT,
    "quantity" INTEGER,
    "unitPrice" NUMERIC(10, 2),
    "total" NUMERIC(12, 2)
);

-- 11. Payments
CREATE TABLE IF NOT EXISTS payments (
    "id" TEXT PRIMARY KEY,
    "saleId" TEXT,
    "amount" NUMERIC(12, 2),
    "method" TEXT,
    "date" TEXT,
    "reference" TEXT
);

-- 12. Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    "id" TEXT PRIMARY KEY,
    "patientName" TEXT,
    "doctorName" TEXT,
    "doctorPhone" TEXT,
    "dateIssued" TEXT,
    "medicines" TEXT,
    "status" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" TEXT,
    "imagePath" TEXT,
    "notes" TEXT
);

-- 13. Price History
CREATE TABLE IF NOT EXISTS price_history (
    "id" TEXT PRIMARY KEY,
    "medicineId" TEXT,
    "medicineName" TEXT,
    "field" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT,
    "changedByName" TEXT,
    "reason" TEXT,
    "timestamp" TEXT
);

-- 14. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT,
    "userName" TEXT,
    "role" TEXT,
    "action" TEXT,
    "details" TEXT,
    "timestamp" TEXT,
    "ipAddress" TEXT
);

-- 15. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    "id" TEXT PRIMARY KEY,
    "type" TEXT,
    "title" TEXT,
    "message" TEXT,
    "read" BOOLEAN DEFAULT FALSE,
    "createdAt" TEXT
);

-- 16. Settings
CREATE TABLE IF NOT EXISTS settings (
    "id" SERIAL PRIMARY KEY,
    "pharmacyName" TEXT,
    "currency" TEXT,
    "defaultTaxRate" NUMERIC(5, 2)
);

-- ==============================================================================
-- To sync data from your browser to Supabase after running this script:
-- 1. Load the Admin Dashboard in your browser.
-- 2. Open Developer Tools (F12) -> Console.
-- 3. Run: await window.DB.pushToSupabase({ dryRun: false });
-- ==============================================================================
