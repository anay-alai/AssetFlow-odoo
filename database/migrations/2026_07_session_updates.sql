-- ============================================================================
-- AssetFlow migration — brings an existing database up to the current schema
-- WITHOUT dropping data. Safe to re-run (idempotent on TiDB / MySQL 8+ that
-- support ADD COLUMN IF NOT EXISTS; MODIFY is naturally idempotent).
--
-- Run with:  cd backend && npm run db:migrate
-- Or paste into the TiDB SQL editor.
-- ============================================================================

-- 1. Assets: maintenance snapshot + QR payload -------------------------------
ALTER TABLE Assets
    ADD COLUMN IF NOT EXISTS prior_status
        ENUM('Available','Allocated','Reserved','Under Maintenance','Lost','Retired','Disposed') NULL
        AFTER status;

ALTER TABLE Assets
    ADD COLUMN IF NOT EXISTS qr_code TEXT NULL
        AFTER photo_url;

-- 2. Users: password-reset token columns -------------------------------------
ALTER TABLE Users
    ADD COLUMN IF NOT EXISTS reset_token_hash VARCHAR(255) NULL;

ALTER TABLE Users
    ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP NULL;

-- 3. AuditItems: add 'Pending' to the verification ENUM + default ------------
ALTER TABLE AuditItems
    MODIFY COLUMN verification_status
        ENUM('Pending','Verified','Missing','Damaged') DEFAULT 'Pending';

-- 4. AuditCycles: make end_date optional -------------------------------------
ALTER TABLE AuditCycles
    MODIFY COLUMN end_date DATE NULL;
