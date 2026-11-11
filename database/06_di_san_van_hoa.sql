-- Chạy sau 01_khoi_tao_csdl_tourismgis.sql.
-- Hồ sơ phi vật thể, hiện vật và tư liệu không bắt buộc có tọa độ.
CREATE TABLE IF NOT EXISTS tourism.di_san_van_hoa (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma VARCHAR(40) NOT NULL UNIQUE,
    ten VARCHAR(250) NOT NULL,
    loai_hinh_id BIGINT NOT NULL REFERENCES tourism.loai_hinh_du_lich(id),
    phan_loai VARCHAR(150) NOT NULL,
    dia_ban TEXT,
    nam_ghi_danh VARCHAR(40),
    mo_ta TEXT,
    nguon_url TEXT NOT NULL,
    nguon_ten TEXT NOT NULL,
    ngay_doi_chieu DATE NOT NULL,
    diem_du_lich_id BIGINT REFERENCES tourism.diem_du_lich(id) ON DELETE SET NULL,
    ghi_chu_toa_do TEXT
);
CREATE INDEX IF NOT EXISTS idx_di_san_loai ON tourism.di_san_van_hoa(loai_hinh_id);
