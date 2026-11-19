-- TourismGIS: import layer tinh_34 from TourismGIS_RanhGioi_Tinh_34_2025.gpkg
-- QGIS first: import as schema tourism / table stg_rghc_tinh_2025,
-- with the geometry column named geom and CRS EPSG:4326.
-- WARNING: ma_dvhc uses official 2-digit code mapped from source names;
-- ma_tinh_nguon is an internal 3-digit source code, NOT the official code.

BEGIN;
DO $$
DECLARE n INTEGER;
BEGIN
  SELECT COUNT(*) INTO n FROM tourism.stg_rghc_tinh_2025;
  IF n <> 34 THEN
    RAISE EXCEPTION 'Expected 34 province features, got %', n;
  END IF;
  IF EXISTS (
    SELECT 1 FROM tourism.stg_rghc_tinh_2025
    WHERE ma_dvhc IS NULL OR BTRIM(ten) = '' OR geom IS NULL
       OR ST_IsEmpty(geom) OR NOT ST_IsValid(geom)
       OR ST_SRID(geom) <> 4326
  ) THEN
    RAISE EXCEPTION 'Province staging data are incomplete or spatially invalid';
  END IF;
  IF EXISTS (
    SELECT 1 FROM tourism.stg_rghc_tinh_2025
    GROUP BY ma_dvhc HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate province codes in staging data';
  END IF;
END $$;

INSERT INTO tourism.don_vi_hanh_chinh
  (ma_dvhc, ten, cap_hanh_chinh, parent_id, nguon_du_lieu, geom)
SELECT
  ma_dvhc,
  ten,
  'tinh_thanh',
  NULL,
  'RGHC_2025_USER_SUPPLIED',
  ST_Multi(ST_CollectionExtract(ST_Force2D(geom), 3))::geometry(MultiPolygon,4326)
FROM tourism.stg_rghc_tinh_2025
ON CONFLICT (ma_dvhc)
DO UPDATE SET
  ten = EXCLUDED.ten,
  cap_hanh_chinh = EXCLUDED.cap_hanh_chinh,
  parent_id = EXCLUDED.parent_id,
  nguon_du_lieu = EXCLUDED.nguon_du_lieu,
  geom = EXCLUDED.geom;

COMMIT;

-- Verification: must yield 34 after import.
SELECT ma_dvhc, ten, ST_SRID(geom) AS srid, ST_IsValid(geom) AS valid
FROM tourism.don_vi_hanh_chinh
WHERE cap_hanh_chinh = 'tinh_thanh'
  AND nguon_du_lieu = 'RGHC_2025_USER_SUPPLIED'
ORDER BY ma_dvhc;
