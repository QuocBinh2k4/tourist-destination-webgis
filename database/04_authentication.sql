
-- Bổ sung xác thực cho TourismGIS

CREATE TABLE IF NOT EXISTS tourism.tai_khoan (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ten_dang_nhap VARCHAR(60) NOT NULL UNIQUE,
    mat_khau_hash TEXT NOT NULL,
    ho_ten VARCHAR(150) NOT NULL,
    vai_tro VARCHAR(20) NOT NULL DEFAULT 'viewer'
        CHECK (vai_tro IN ('admin', 'editor', 'viewer')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tourism.phien_dang_nhap (
    token_hash CHAR(64) PRIMARY KEY,
    tai_khoan_id BIGINT NOT NULL
        REFERENCES tourism.tai_khoan(id)
        ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phien_user
ON tourism.phien_dang_nhap(tai_khoan_id);

CREATE INDEX IF NOT EXISTS idx_phien_expires
ON tourism.phien_dang_nhap(expires_at);
