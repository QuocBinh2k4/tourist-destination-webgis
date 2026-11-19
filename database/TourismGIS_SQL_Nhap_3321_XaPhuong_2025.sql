-- TOURISMGIS: NHAP 3.321 XA/PHUONG TU DU LIEU RGHC_2025
-- DAU VAO: tourism.stg_rghc_xa_2025
-- (Import lop xa_3321 tu file TourismGIS_RanhGioi_Xa_3321_2025.gpkg trong QGIS)
-- YEU CAU: Bang tourism.don_vi_hanh_chinh da co du 34 tinh
-- Quan trong: ma_xa_nguon la MA NGUON (8 ky tu), KHONG PHAI ma xa chinh thuc.
-- Script dat ma trong CSDL thanh 'SRC25_' || ma_xa_nguon.
-- Khong xoa cac ban ghi hanh chinh khac; ho tro chay lai.

BEGIN;

DO $$
DECLARE
    n INTEGER;
BEGIN
    IF to_regclass('tourism.stg_rghc_xa_2025') IS NULL THEN
        RAISE EXCEPTION 'Chua co bang tourism.stg_rghc_xa_2025. Hay nhap lop xa_3321 qua QGIS truoc.';
    END IF;

    SELECT COUNT(*) INTO n FROM tourism.stg_rghc_xa_2025;
    IF n <> 3321 THEN
        RAISE EXCEPTION 'Bang trung gian phai co 3321 xa/phuong, hien co %.', n;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM tourism.stg_rghc_xa_2025 s
        WHERE s.ma_xa_nguon IS NULL OR BTRIM(s.ma_xa_nguon::text) = ''
           OR s.ten_xa IS NULL OR BTRIM(s.ten_xa::text) = ''
           OR s.ma_tinh_qd19 IS NULL OR BTRIM(s.ma_tinh_qd19::text) = ''
           OR s.geom IS NULL OR ST_IsEmpty(s.geom)
           OR NOT ST_IsValid(s.geom)
           OR ST_SRID(s.geom) <> 4326
    ) THEN
        RAISE EXCEPTION 'Du lieu xa bi thieu ma/ten/tinh, hinh hoc rong, sai SRID hoac khong hop le.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM tourism.stg_rghc_xa_2025
        GROUP BY BTRIM(ma_xa_nguon::text)
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'Ma xa nguon bi trung trong bang trung gian.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM tourism.stg_rghc_xa_2025 s
        LEFT JOIN tourism.don_vi_hanh_chinh p
          ON p.ma_dvhc = BTRIM(s.ma_tinh_qd19::text)
         AND p.cap_hanh_chinh = 'tinh_thanh'
        WHERE p.id IS NULL
    ) THEN
        RAISE EXCEPTION 'Co xa chua ghep duoc tinh. Nhap du 34 tinh va kiem tra ma_tinh_qd19 truoc.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM tourism.stg_rghc_xa_2025 s
        JOIN tourism.don_vi_hanh_chinh d
          ON d.ma_dvhc = 'SRC25_' || BTRIM(s.ma_xa_nguon::text)
        WHERE d.nguon_du_lieu <> 'RGHC_2025_XA_SOURCE_CODE_NOT_OFFICIAL'
    ) THEN
        RAISE EXCEPTION 'Da ton tai ma SRC25_ trong CSDL thuoc nguon khac. Khong ghi de.';
    END IF;
END $$;

INSERT INTO tourism.don_vi_hanh_chinh (
    ma_dvhc,
    ten,
    cap_hanh_chinh,
    parent_id,
    nguon_du_lieu,
    geom
)
SELECT
    'SRC25_' || BTRIM(s.ma_xa_nguon::text),
    BTRIM(s.ten_xa::text),
    'xa_phuong',
    p.id,
    'RGHC_2025_XA_SOURCE_CODE_NOT_OFFICIAL',
    ST_Multi(
        ST_CollectionExtract(ST_Force2D(s.geom), 3)
    )::geometry(MultiPolygon, 4326)
FROM tourism.stg_rghc_xa_2025 s
JOIN tourism.don_vi_hanh_chinh p
  ON p.ma_dvhc = BTRIM(s.ma_tinh_qd19::text)
 AND p.cap_hanh_chinh = 'tinh_thanh'
ON CONFLICT (ma_dvhc)
DO UPDATE SET
    ten = EXCLUDED.ten,
    cap_hanh_chinh = EXCLUDED.cap_hanh_chinh,
    parent_id = EXCLUDED.parent_id,
    nguon_du_lieu = EXCLUDED.nguon_du_lieu,
    geom = EXCLUDED.geom
WHERE tourism.don_vi_hanh_chinh.nguon_du_lieu =
    'RGHC_2025_XA_SOURCE_CODE_NOT_OFFICIAL';

DO $$
DECLARE
    n INTEGER;
BEGIN
    SELECT COUNT(*) INTO n
    FROM tourism.don_vi_hanh_chinh
    WHERE nguon_du_lieu = 'RGHC_2025_XA_SOURCE_CODE_NOT_OFFICIAL';

    IF n <> 3321 THEN
        RAISE EXCEPTION 'Sau khi nhap phai co 3321 xa/phuong, hien co %.', n;
    END IF;
END $$;

COMMIT;

-- KIEM TRA KET QUA
SELECT
    cap_hanh_chinh,
    COUNT(*) AS so_xa_phuong,
    COUNT(*) FILTER (WHERE parent_id IS NULL) AS chua_co_tinh,
    COUNT(*) FILTER (WHERE ST_SRID(geom) <> 4326) AS sai_srid,
    COUNT(*) FILTER (WHERE NOT ST_IsValid(geom)) AS hinh_hoc_loi
FROM tourism.don_vi_hanh_chinh
WHERE nguon_du_lieu = 'RGHC_2025_XA_SOURCE_CODE_NOT_OFFICIAL'
GROUP BY cap_hanh_chinh;

-- DEM XA THEO TINH
SELECT
    p.ma_dvhc AS ma_tinh,
    p.ten AS ten_tinh,
    COUNT(x.id) AS so_xa_phuong
FROM tourism.don_vi_hanh_chinh p
JOIN tourism.don_vi_hanh_chinh x ON x.parent_id = p.id
WHERE x.nguon_du_lieu = 'RGHC_2025_XA_SOURCE_CODE_NOT_OFFICIAL'
GROUP BY p.id, p.ma_dvhc, p.ten
ORDER BY p.ten;
