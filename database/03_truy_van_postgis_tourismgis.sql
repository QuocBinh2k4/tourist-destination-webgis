-- TRUY VAN MINH HOA. Chay sau cac tap 01 va 02.
-- 01. Tim theo ten va loai hinh (khong nhan ban ghi)
SELECT d.id, d.ma, d.ten, d.gia_ve_vnd
FROM tourism.diem_du_lich AS d
WHERE d.ten ILIKE '%mau%'
  AND EXISTS (
    SELECT 1 FROM tourism.diem_du_lich_loai_hinh dl
    JOIN tourism.loai_hinh_du_lich lh ON lh.id=dl.loai_hinh_id
    WHERE dl.diem_du_lich_id=d.id AND lh.ma='VH'
  );

-- 02. Tinh khoang cach truc tiep giua hai diem (m)
SELECT a.ten AS diem_a, b.ten AS diem_b,
       ROUND(ST_Distance(a.geom::geography, b.geom::geography)::NUMERIC, 2) AS khoang_cach_m
FROM tourism.diem_du_lich a CROSS JOIN tourism.diem_du_lich b
WHERE a.ma='DL001' AND b.ma='DL002';

-- 03. Cac diem trong ban kinh 3000m tu toa do chon
SELECT diem_id,ten_diem,
       ROUND(khoang_cach_m::NUMERIC,2) AS khoang_cach_m,
       ST_AsGeoJSON(geom)::JSONB AS geometry
FROM tourism.fn_tim_diem_trong_ban_kinh(105.82,21.03,3000,100);

-- 04. 5 diem gan nhat so voi diem DL001, KHONG tinh chinh no
SELECT d.ma,d.ten,
       ROUND(ST_Distance(d.geom::geography, g.geom::geography)::NUMERIC,2) AS khoang_cach_m
FROM tourism.diem_du_lich d
JOIN tourism.diem_du_lich g ON g.ma='DL001'
WHERE d.id<>g.id AND d.trang_thai='dang_hoat_dong'
ORDER BY ST_Distance(d.geom::geography, g.geom::geography),d.id
LIMIT 5;

-- 05. Thong ke diem theo vung: ST_Covers ke ca diem tren bien
-- CSDL ranh gioi can KHONG chong lan de tranh trung so luong.
SELECT a.ma_dvhc,a.ten,COUNT(d.id) AS so_diem
FROM tourism.don_vi_hanh_chinh a
LEFT JOIN tourism.diem_du_lich d ON ST_Covers(a.geom,d.geom)
GROUP BY a.id,a.ma_dvhc,a.ten ORDER BY so_diem DESC;

-- 06. Buffer 1000m quanh diem DL001 de ve len WebGIS
SELECT d.ma,ST_AsGeoJSON(tourism.fn_buffer_diem(d.id,1000))::JSONB AS buffer_geojson
FROM tourism.diem_du_lich d WHERE d.ma='DL001';

-- 07. Dem co so an uong trong ban kinh 1500m tai diem DL001
SELECT d.ten, COUNT(DISTINCT s.id) AS so_co_so_an_uong
FROM tourism.diem_du_lich d
LEFT JOIN tourism.co_so_dich_vu s
 ON s.trang_thai='dang_hoat_dong'
 AND ST_DWithin(d.geom::geography,s.geom::geography,1500)
 AND EXISTS (
    SELECT 1 FROM tourism.co_so_dich_vu_loai sl
    JOIN tourism.loai_dich_vu ld ON ld.id=sl.loai_dich_vu_id
    WHERE sl.co_so_dich_vu_id=s.id AND ld.ma='AN_UONG'
 )
WHERE d.ma='DL001'
GROUP BY d.id,d.ten;

-- 08. Diem theo tieu chi dich vu, day du ca tieu chi KHONG dat
SELECT * FROM tourism.fn_danh_gia_tiep_can()
ORDER BY diem_id,loai_dich_vu_id;

-- 09. Chi so tiep can 0-100 cho moi diem
SELECT * FROM tourism.vw_chi_so_tiep_can
ORDER BY diem_tiep_can_100 DESC;

-- 10. Cac diem du lich thieu mot hoac nhieu dich vu
SELECT * FROM tourism.vw_diem_thieu_dich_vu
ORDER BY diem_id,loai_dich_vu_id;

-- 11. Vung thieu bao phu dich vu AN_UONG tren vung gia lap.
-- Luon tinh ca cac co so NAM NGOAI ranh gioi nhung phu qua bien.
WITH p AS (
    SELECT a.geom AS ranh_gioi, ld.id AS loai_id, tc.ban_kinh_m AS r_m
    FROM tourism.don_vi_hanh_chinh a
    CROSS JOIN tourism.loai_dich_vu ld
    JOIN tourism.tieu_chi_tiep_can tc ON tc.loai_dich_vu_id=ld.id
    WHERE a.ma_dvhc='KV_TEST' AND ld.ma='AN_UONG'
), phu AS (
    SELECT ST_UnaryUnion(ST_Collect(
        ST_Buffer(s.geom::geography,p.r_m)::geometry
    )) AS geom_phu
    FROM p
    JOIN tourism.co_so_dich_vu s
        ON s.trang_thai='dang_hoat_dong'
       AND ST_DWithin(s.geom::geography,p.ranh_gioi::geography,p.r_m)
       AND EXISTS (
          SELECT 1 FROM tourism.co_so_dich_vu_loai cl
          WHERE cl.co_so_dich_vu_id=s.id AND cl.loai_dich_vu_id=p.loai_id
       )
), thieu AS (
    SELECT ST_Multi(ST_CollectionExtract(
        ST_Difference(
            p.ranh_gioi,
            COALESCE(phu.geom_phu, 'MULTIPOLYGON EMPTY'::geometry)
        ),3
    )) AS geom
    FROM p CROSS JOIN phu
)
SELECT ROUND((ST_Area(geom::geography)/1000000.0)::NUMERIC,3) AS dien_tich_thieu_km2,
       ST_AsGeoJSON(geom)::JSONB AS geometry
FROM thieu;

-- 12. Tra GeoJSON FeatureCollection cho WebGIS
SELECT jsonb_build_object(
  'type','FeatureCollection',
  'features',COALESCE(jsonb_agg(jsonb_build_object(
      'type','Feature',
      'id',d.id,
      'geometry',ST_AsGeoJSON(d.geom)::jsonb,
      'properties',jsonb_build_object('ma',d.ma,'ten',d.ten,'gia_ve_vnd',d.gia_ve_vnd)
  )), '[]'::jsonb)
) AS geojson
FROM tourism.diem_du_lich d
WHERE d.trang_thai='dang_hoat_dong';

-- 13. EXPLAIN ANALYZE de so sanh truoc/sau khi co chi muc GiST
EXPLAIN (ANALYZE,BUFFERS)
SELECT d.id,d.ten FROM tourism.diem_du_lich d
WHERE ST_DWithin(
 d.geom::geography,
 ST_SetSRID(ST_MakePoint(105.82,21.03),4326)::geography,
 1500
);
-- Chu y: bo du lieu nho co the dung Sequential Scan du da co chi muc.
