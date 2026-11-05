-- TOURISMGIS - THIET KE CSDL KHONG GIAN QUAN LY DU LICH
-- PostgreSQL + PostGIS. Chay trong CSDL tourismgis da duoc tao.
-- CSDL chinh: CREATE DATABASE tourismgis; (chay rieng khi ket noi postgres)
-- Script tao schema va cau truc, KHONG xoa bang hien co.

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE SCHEMA IF NOT EXISTS tourism;

-- 01. Ranh gioi hanh chinh / vung nghien cuu
CREATE TABLE IF NOT EXISTS tourism.don_vi_hanh_chinh (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma_dvhc VARCHAR(30) NOT NULL UNIQUE,
    ten VARCHAR(200) NOT NULL,
    cap_hanh_chinh VARCHAR(25) NOT NULL
        CHECK (cap_hanh_chinh IN ('tinh_thanh', 'xa_phuong', 'khu_vuc_khac')),
    parent_id BIGINT REFERENCES tourism.don_vi_hanh_chinh(id) ON DELETE RESTRICT,
    nguon_du_lieu TEXT NOT NULL,
    geom geometry(MultiPolygon, 4326) NOT NULL,
    CONSTRAINT chk_dvhc_valid CHECK (ST_IsValid(geom) AND NOT ST_IsEmpty(geom)),
    CONSTRAINT chk_dvhc_not_self_parent CHECK (parent_id IS DISTINCT FROM id)
);

-- 02. Danh muc loai hinh du lich
CREATE TABLE IF NOT EXISTS tourism.loai_hinh_du_lich (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma VARCHAR(30) NOT NULL UNIQUE,
    ten VARCHAR(150) NOT NULL UNIQUE,
    mo_ta TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 03. Diem du lich
CREATE TABLE IF NOT EXISTS tourism.diem_du_lich (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma VARCHAR(30) NOT NULL UNIQUE,
    ten VARCHAR(250) NOT NULL,
    dia_chi TEXT,
    mo_ta TEXT,
    gia_ve_vnd NUMERIC(12,0) CHECK (gia_ve_vnd >= 0),
    gio_mo_cua JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(gio_mo_cua) = 'object'),
    so_dien_thoai VARCHAR(25),
    website TEXT,
    trang_thai VARCHAR(25) NOT NULL DEFAULT 'dang_hoat_dong'
        CHECK (trang_thai IN ('dang_hoat_dong','tam_dong','ngung_hoat_dong')),
    nguon_du_lieu TEXT NOT NULL,
    ngay_kiem_chung DATE,
    geom geometry(Point, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_diem_toa_do CHECK (
        NOT ST_IsEmpty(geom)
        AND ST_X(geom) BETWEEN -180 AND 180
        AND ST_Y(geom) BETWEEN -90 AND 90
    )
);

-- 04. Diem du lich va loai hinh: N-N
CREATE TABLE IF NOT EXISTS tourism.diem_du_lich_loai_hinh (
    diem_du_lich_id BIGINT NOT NULL REFERENCES tourism.diem_du_lich(id) ON DELETE CASCADE,
    loai_hinh_id BIGINT NOT NULL REFERENCES tourism.loai_hinh_du_lich(id) ON DELETE RESTRICT,
    PRIMARY KEY (diem_du_lich_id, loai_hinh_id)
);

-- 05. Danh muc loai dich vu
CREATE TABLE IF NOT EXISTS tourism.loai_dich_vu (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma VARCHAR(30) NOT NULL UNIQUE,
    ten VARCHAR(150) NOT NULL UNIQUE,
    mo_ta TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 06. Co so cung cap dich vu
CREATE TABLE IF NOT EXISTS tourism.co_so_dich_vu (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ma VARCHAR(30) NOT NULL UNIQUE,
    ten VARCHAR(250) NOT NULL,
    dia_chi TEXT,
    so_dien_thoai VARCHAR(25),
    gio_mo_cua JSONB NOT NULL DEFAULT '{}'::jsonb
        CHECK (jsonb_typeof(gio_mo_cua) = 'object'),
    trang_thai VARCHAR(25) NOT NULL DEFAULT 'dang_hoat_dong'
        CHECK (trang_thai IN ('dang_hoat_dong','tam_dong','ngung_hoat_dong')),
    nguon_du_lieu TEXT NOT NULL,
    ngay_kiem_chung DATE,
    geom geometry(Point, 4326) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_dich_vu_toa_do CHECK (
        NOT ST_IsEmpty(geom)
        AND ST_X(geom) BETWEEN -180 AND 180
        AND ST_Y(geom) BETWEEN -90 AND 90
    )
);

-- 07. Co so dich vu va loai dich vu: N-N
CREATE TABLE IF NOT EXISTS tourism.co_so_dich_vu_loai (
    co_so_dich_vu_id BIGINT NOT NULL REFERENCES tourism.co_so_dich_vu(id) ON DELETE CASCADE,
    loai_dich_vu_id BIGINT NOT NULL REFERENCES tourism.loai_dich_vu(id) ON DELETE RESTRICT,
    PRIMARY KEY (co_so_dich_vu_id, loai_dich_vu_id)
);

-- 08. Tieu chi do luong kha nang tiep can dich vu
CREATE TABLE IF NOT EXISTS tourism.tieu_chi_tiep_can (
    loai_dich_vu_id BIGINT PRIMARY KEY REFERENCES tourism.loai_dich_vu(id) ON DELETE RESTRICT,
    ban_kinh_m INTEGER NOT NULL CHECK (ban_kinh_m BETWEEN 100 AND 10000),
    so_luong_toi_thieu INTEGER NOT NULL CHECK (so_luong_toi_thieu BETWEEN 1 AND 100),
    trong_so NUMERIC(6,2) NOT NULL CHECK (trong_so > 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 09. Anh tai diem du lich (luu URL/path, khong luu file binary)
CREATE TABLE IF NOT EXISTS tourism.anh_diem_du_lich (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    diem_du_lich_id BIGINT NOT NULL REFERENCES tourism.diem_du_lich(id) ON DELETE CASCADE,
    duong_dan TEXT NOT NULL,
    chu_thich TEXT,
    thu_tu INTEGER NOT NULL DEFAULT 0 CHECK (thu_tu >= 0)
);

-- Chi muc hinh hoc + bieu thuc geography (cho tinh met va ST_DWithin)
CREATE INDEX IF NOT EXISTS idx_dvhc_geom_gist
    ON tourism.don_vi_hanh_chinh USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_diem_geom_gist
    ON tourism.diem_du_lich USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_diem_geog_gist
    ON tourism.diem_du_lich USING GIST ((geom::geography));
CREATE INDEX IF NOT EXISTS idx_dich_vu_geom_gist
    ON tourism.co_so_dich_vu USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_dich_vu_geog_gist
    ON tourism.co_so_dich_vu USING GIST ((geom::geography));
CREATE INDEX IF NOT EXISTS idx_lien_ket_diem_loai
    ON tourism.diem_du_lich_loai_hinh (loai_hinh_id);
CREATE INDEX IF NOT EXISTS idx_lien_ket_co_so_loai
    ON tourism.co_so_dich_vu_loai (loai_dich_vu_id);
CREATE INDEX IF NOT EXISTS idx_anh_diem
    ON tourism.anh_diem_du_lich (diem_du_lich_id);
CREATE INDEX IF NOT EXISTS idx_diem_trang_thai
    ON tourism.diem_du_lich (trang_thai);
CREATE INDEX IF NOT EXISTS idx_dich_vu_trang_thai
    ON tourism.co_so_dich_vu (trang_thai);

-- Tu dong cap nhat thoi gian sua
CREATE OR REPLACE FUNCTION tourism.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_diem_updated_at ON tourism.diem_du_lich;
CREATE TRIGGER trg_diem_updated_at
BEFORE UPDATE ON tourism.diem_du_lich
FOR EACH ROW EXECUTE FUNCTION tourism.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_dich_vu_updated_at ON tourism.co_so_dich_vu;
CREATE TRIGGER trg_dich_vu_updated_at
BEFORE UPDATE ON tourism.co_so_dich_vu
FOR EACH ROW EXECUTE FUNCTION tourism.fn_set_updated_at();

-- Tim diem du lich trong ban kinh p_ban_kinh_m xung quanh toa do WGS84
CREATE OR REPLACE FUNCTION tourism.fn_tim_diem_trong_ban_kinh(
    p_lon DOUBLE PRECISION,
    p_lat DOUBLE PRECISION,
    p_ban_kinh_m DOUBLE PRECISION,
    p_gioi_han INTEGER DEFAULT 100
)
RETURNS TABLE (
    diem_id BIGINT,
    ma_diem VARCHAR(30),
    ten_diem VARCHAR(250),
    khoang_cach_m DOUBLE PRECISION,
    geom geometry(Point, 4326)
)
LANGUAGE plpgsql STABLE AS $$
DECLARE
    v_tam geography;
BEGIN
    IF p_lon NOT BETWEEN -180 AND 180 OR p_lat NOT BETWEEN -90 AND 90
       OR p_lon IS NULL OR p_lat IS NULL THEN
       RAISE EXCEPTION 'Toa do khong hop le';
    END IF;
    IF p_ban_kinh_m IS NULL OR p_ban_kinh_m <= 0 OR p_ban_kinh_m > 100000 THEN
       RAISE EXCEPTION 'Ban kinh phai trong khoang (0, 100000] met';
    END IF;
    v_tam := ST_SetSRID(ST_MakePoint(p_lon, p_lat),4326)::geography;
    RETURN QUERY
        SELECT d.id, d.ma, d.ten,
               ST_Distance(d.geom::geography, v_tam), d.geom
        FROM tourism.diem_du_lich AS d
        WHERE d.trang_thai = 'dang_hoat_dong'
          AND ST_DWithin(d.geom::geography, v_tam, p_ban_kinh_m)
        ORDER BY ST_Distance(d.geom::geography, v_tam), d.id
        LIMIT LEAST(GREATEST(COALESCE(p_gioi_han,100),1),500);
END;
$$;

-- Buffer minh hoa cho mot diem du lich (hinh hoc 4326 tra ve phia client)
CREATE OR REPLACE FUNCTION tourism.fn_buffer_diem(
    p_diem_id BIGINT,
    p_ban_kinh_m INTEGER
)
RETURNS geometry LANGUAGE plpgsql STABLE AS $$
BEGIN
    IF p_ban_kinh_m IS NULL OR p_ban_kinh_m <= 0 OR p_ban_kinh_m > 100000 THEN
        RAISE EXCEPTION 'Ban kinh khong hop le';
    END IF;
    RETURN (
        SELECT ST_Buffer(d.geom::geography, p_ban_kinh_m)::geometry
        FROM tourism.diem_du_lich d WHERE d.id = p_diem_id
    );
END;
$$;

-- Danh gia tung loai dich vu tai tung diem; khong nhan doi co so da gan nhieu loai
CREATE OR REPLACE FUNCTION tourism.fn_danh_gia_tiep_can()
RETURNS TABLE (
    diem_id BIGINT,
    ten_diem VARCHAR(250),
    loai_dich_vu_id BIGINT,
    ten_loai_dich_vu VARCHAR(150),
    ban_kinh_m INTEGER,
    so_co_so INTEGER,
    so_luong_toi_thieu INTEGER,
    dat BOOLEAN
)
LANGUAGE sql STABLE AS $$
    SELECT d.id, d.ten, ld.id, ld.ten,
           tc.ban_kinh_m, thong_ke.so_co_so, tc.so_luong_toi_thieu,
           (thong_ke.so_co_so >= tc.so_luong_toi_thieu) AS dat
    FROM tourism.diem_du_lich AS d
    CROSS JOIN tourism.tieu_chi_tiep_can AS tc
    JOIN tourism.loai_dich_vu AS ld
      ON ld.id = tc.loai_dich_vu_id AND ld.is_active
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::INTEGER AS so_co_so
        FROM tourism.co_so_dich_vu AS cs
        WHERE cs.trang_thai = 'dang_hoat_dong'
          AND ST_DWithin(d.geom::geography, cs.geom::geography, tc.ban_kinh_m)
          AND EXISTS (
              SELECT 1 FROM tourism.co_so_dich_vu_loai AS l
              WHERE l.co_so_dich_vu_id = cs.id
                AND l.loai_dich_vu_id = tc.loai_dich_vu_id
          )
    ) AS thong_ke ON TRUE
    WHERE d.trang_thai = 'dang_hoat_dong'
      AND tc.is_active;
$$;

-- Diem so 0-100: tong diem dat duoc / tong trong so, moi tieu chi gioi han 100%
CREATE OR REPLACE VIEW tourism.vw_chi_so_tiep_can AS
SELECT dg.diem_id, dg.ten_diem,
       ROUND(
           100 * SUM(
               LEAST(dg.so_co_so::NUMERIC / dg.so_luong_toi_thieu, 1::NUMERIC)
               * tc.trong_so
           ) / NULLIF(SUM(tc.trong_so), 0),
           2
       ) AS diem_tiep_can_100,
       BOOL_AND(dg.dat) AS dat_tat_ca_tieu_chi
FROM tourism.fn_danh_gia_tiep_can() AS dg
JOIN tourism.tieu_chi_tiep_can AS tc
    ON tc.loai_dich_vu_id = dg.loai_dich_vu_id
GROUP BY dg.diem_id, dg.ten_diem;

-- Danh sach diem khong dat tung loai dich vu
CREATE OR REPLACE VIEW tourism.vw_diem_thieu_dich_vu AS
SELECT * FROM tourism.fn_danh_gia_tiep_can()
WHERE NOT dat;
