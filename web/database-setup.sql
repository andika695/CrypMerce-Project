-- ============================================
-- CrypMerce Database Setup
-- Seller Authentication System
-- ============================================

-- Use the database
USE crypmerce_database;

-- ============================================
-- Table: users
-- Stores all user accounts (buyers and sellers)
-- ============================================

-- Check if users table exists, if not create it
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(20) NULL,
    role ENUM('user', 'seller') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- If users table already exists but doesn't have role column, add it
-- (This will fail silently if column already exists)
-- ALTER TABLE users ADD COLUMN role ENUM('user', 'seller') DEFAULT 'user';

-- ============================================
-- Table: sellers
-- Stores seller-specific information
-- ============================================

CREATE TABLE IF NOT EXISTS sellers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    store_name VARCHAR(255) NOT NULL UNIQUE,
    profile_photo VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_store_name (store_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Table: categories (if not exists)
-- Product categories
-- ============================================

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default categories if table is empty
INSERT INTO categories (name, description) 
SELECT * FROM (SELECT 'Fashion Pria', 'Pakaian dan aksesoris pria') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Fashion Pria') LIMIT 1;

INSERT INTO categories (name, description) 
SELECT * FROM (SELECT 'Fashion Wanita', 'Pakaian dan aksesoris wanita') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Fashion Wanita') LIMIT 1;

INSERT INTO categories (name, description) 
SELECT * FROM (SELECT 'Handphone', 'Smartphone dan aksesoris') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Handphone') LIMIT 1;

INSERT INTO categories (name, description) 
SELECT * FROM (SELECT 'Komputer', 'Laptop, PC, dan aksesoris') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Komputer') LIMIT 1;

INSERT INTO categories (name, description) 
SELECT * FROM (SELECT 'Kecantikan', 'Produk kecantikan dan perawatan') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Kecantikan') LIMIT 1;

INSERT INTO categories (name, description) 
SELECT * FROM (SELECT 'Kesehatan', 'Produk kesehatan dan obat-obatan') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Kesehatan') LIMIT 1;

INSERT INTO categories (name, description) 
SELECT * FROM (SELECT 'Otomotif', 'Suku cadang dan aksesoris kendaraan') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Otomotif') LIMIT 1;

INSERT INTO categories (name, description) 
SELECT * FROM (SELECT 'Makanan', 'Makanan dan minuman') AS tmp
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Makanan') LIMIT 1;

-- ============================================
-- Table: products (if not exists)
-- Products listed by sellers
-- ============================================

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id INT NOT NULL,
    category_id INT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    price DECIMAL(15, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    image VARCHAR(500) NULL,
    variants JSON NULL, -- Stores color/size data e.g. {"colors": ["Red", "Blue"], "sizes": ["S", "M", "L"]}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_seller_id (seller_id),
    INDEX idx_category_id (category_id),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- UPDATE COMMAND (Run this if table already exists)
-- ============================================
-- ALTER TABLE products ADD COLUMN variants JSON NULL AFTER image;

-- ============================================
-- Verification Queries
-- Run these to check if tables were created
-- ============================================

-- Show all tables
-- SHOW TABLES;

-- Describe users table
-- DESCRIBE users;

-- Describe sellers table
-- DESCRIBE sellers;

-- Describe products table
-- DESCRIBE products;

-- Describe categories table
-- DESCRIBE categories;

-- ============================================
-- Sample Data (Optional - for testing)
-- Uncomment to insert test data
-- ============================================

-- Test User (password: test123)
-- INSERT INTO users (username, password, role) 
-- VALUES ('testuser', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user');

-- Test Seller (password: seller123)
-- INSERT INTO users (username, password, role) 
-- VALUES ('testseller', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'seller');

-- Test Seller Profile
-- INSERT INTO sellers (user_id, store_name) 
-- VALUES (2, 'Toko Test');

-- ============================================
-- Notes
-- ============================================
-- 1. Make sure to create the upload directory:
--    web/images/seller-profiles/
--    
-- 2. Set proper permissions (755 or 777) for upload directory
--
-- 3. Password in sample data is hashed using bcrypt
--    Use PHP password_hash() function to create passwords
--
-- 4. Only two roles are allowed: 'user' and 'seller'
--
-- 5. Foreign keys ensure data integrity:
--    - Deleting a user will delete their seller profile
--    - Deleting a seller will delete their products
-- ============================================
