-- ================================================
-- CrypMerce Location & Shipping System Migration
-- Version: 1.0
-- Date: 2025-12-28
-- ================================================

-- BACKUP REMINDER: Make sure you have backed up your database before running this!

-- ================================================
-- ADD LOCATION FIELDS TO USERS TABLE
-- ================================================
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL COMMENT 'User latitude coordinate',
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL COMMENT 'User longitude coordinate',
ADD COLUMN IF NOT EXISTS address TEXT NULL COMMENT 'Full formatted address from geocoding',
ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL COMMENT 'City/Regency name',
ADD COLUMN IF NOT EXISTS province VARCHAR(100) NULL COMMENT 'Province name',
ADD COLUMN IF NOT EXISTS address_detail VARCHAR(500) NULL COMMENT 'Additional address details (building, floor, etc)';

-- ================================================
-- ADD LOCATION FIELDS TO SELLERS TABLE
-- ================================================
ALTER TABLE sellers 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8) NULL COMMENT 'Seller latitude coordinate',
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8) NULL COMMENT 'Seller longitude coordinate',
ADD COLUMN IF NOT EXISTS address TEXT NULL COMMENT 'Full formatted address from geocoding',
ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL COMMENT 'City/Regency name',
ADD COLUMN IF NOT EXISTS province VARCHAR(100) NULL COMMENT 'Province name',
ADD COLUMN IF NOT EXISTS address_detail VARCHAR(500) NULL COMMENT 'Additional address details (building, floor, etc)';

-- Note: The 'location' column already exists in sellers table from previous implementation

-- ================================================
-- ADD SHIPPING FIELDS TO ORDERS TABLE
-- ================================================
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS shipping_cost DECIMAL(10, 2) DEFAULT 0 COMMENT 'Calculated shipping cost',
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(8, 2) NULL COMMENT 'Distance between seller and buyer in km',
ADD COLUMN IF NOT EXISTS shipping_address TEXT NULL COMMENT 'Full shipping address',
ADD COLUMN IF NOT EXISTS buyer_latitude DECIMAL(10, 8) NULL COMMENT 'Buyer latitude at time of order',
ADD COLUMN IF NOT EXISTS buyer_longitude DECIMAL(11, 8) NULL COMMENT 'Buyer longitude at time of order',
ADD COLUMN IF NOT EXISTS buyer_city VARCHAR(100) NULL COMMENT 'Buyer city at time of order',
ADD COLUMN IF NOT EXISTS seller_city VARCHAR(100) NULL COMMENT 'Seller city at time of order';

-- ================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================================
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_sellers_location ON sellers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_sellers_city ON sellers(city);
CREATE INDEX IF NOT EXISTS idx_orders_shipping ON orders(shipping_cost, distance_km);

-- ================================================
-- VERIFY MIGRATION
-- ================================================
-- Run these queries to verify the migration was successful:

-- Check users table structure
-- DESCRIBE users;

-- Check sellers table structure
-- DESCRIBE sellers;

-- Check orders table structure
-- DESCRIBE orders;

-- ================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ================================================
-- If you need to rollback this migration, run:
-- Rollback instructions removed for safety
-- (See older version for rollback queries)

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
SELECT 'Migration completed successfully!' AS status;
