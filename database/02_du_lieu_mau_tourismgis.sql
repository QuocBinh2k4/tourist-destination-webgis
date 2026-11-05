-- DU LIEU GIA LAP PHUC VU KIEM THU; KHONG PHAI DU LIEU THUC DIA.
-- Chay SAU 01_khoi_tao_csdl_tourismgis.sql.
INSERT INTO tourism.don_vi_hanh_chinh
(ma_dvhc, ten, cap_hanh_chinh, nguon_du_lieu, geom) VALUES
('KV_TEST', 'Vung thuc nghiem gia lap', 'khu_vuc_khac', 'du lieu gia lap',
 ST_Multi(ST_GeomFromText('POLYGON((105.75 20.95, 105.95 20.95, 105.95 21.15, 105.75 21.15, 105.75 20.95))',4326)))
ON CONFLICT (ma_dvhc) DO NOTHING;

INSERT INTO tourism.loai_hinh_du_lich (ma,ten,mo_ta) VALUES
('VH','Van hoa','Du lich van hoa'),
('LS','Lich su','Tham quan di tich'),
('ST','Sinh thai','Du lich sinh thai')
ON CONFLICT (ma) DO NOTHING;

INSERT INTO tourism.loai_dich_vu (ma,ten,mo_ta) VALUES
('AN_UONG','An uong','Nha hang, quan an'),
('LUU_TRU','Luu tru','Khach san, nha nghi'),
('Y_TE','Y te','Co so y te'),
('DO_XE','Bai do xe','Bai do xe')
ON CONFLICT (ma) DO NOTHING;

INSERT INTO tourism.diem_du_lich
(ma,ten,dia_chi,mo_ta,gia_ve_vnd,nguon_du_lieu,geom) VALUES
('DL001','Diem mau A','Khu vuc gia lap','Diem van hoa de thu nghiem',20000,'du lieu gia lap',ST_SetSRID(ST_MakePoint(105.82,21.03),4326)),
('DL002','Diem mau B','Khu vuc gia lap','Diem sinh thai de thu nghiem',0,'du lieu gia lap',ST_SetSRID(ST_MakePoint(105.84,21.04),4326)),
('DL003','Diem mau C','Khu vuc gia lap','Diem lich su de thu nghiem',30000,'du lieu gia lap',ST_SetSRID(ST_MakePoint(105.89,21.09),4326))
ON CONFLICT (ma) DO NOTHING;

INSERT INTO tourism.diem_du_lich_loai_hinh(diem_du_lich_id,loai_hinh_id)
SELECT d.id,l.id FROM tourism.diem_du_lich d
JOIN tourism.loai_hinh_du_lich l ON
 (d.ma = 'DL001' AND l.ma = 'VH') OR
 (d.ma = 'DL002' AND l.ma = 'ST') OR
 (d.ma = 'DL003' AND l.ma = 'LS')
ON CONFLICT DO NOTHING;

INSERT INTO tourism.co_so_dich_vu (ma,ten,dia_chi,nguon_du_lieu,geom) VALUES
('DV001','Co so an uong mau 1','Khu vuc gia lap','du lieu gia lap',ST_SetSRID(ST_MakePoint(105.823,21.030),4326)),
('DV002','Co so luu tru mau 2','Khu vuc gia lap','du lieu gia lap',ST_SetSRID(ST_MakePoint(105.827,21.032),4326)),
('DV003','Co so y te mau 3','Khu vuc gia lap','du lieu gia lap',ST_SetSRID(ST_MakePoint(105.89,21.08),4326)),
('DV004','Bai do xe mau 4','Khu vuc gia lap','du lieu gia lap',ST_SetSRID(ST_MakePoint(105.83,21.02),4326))
ON CONFLICT (ma) DO NOTHING;

INSERT INTO tourism.co_so_dich_vu_loai(co_so_dich_vu_id,loai_dich_vu_id)
SELECT s.id,l.id FROM tourism.co_so_dich_vu s
JOIN tourism.loai_dich_vu l ON
 (s.ma='DV001' AND l.ma='AN_UONG') OR
 (s.ma='DV002' AND l.ma='LUU_TRU') OR
 (s.ma='DV003' AND l.ma='Y_TE') OR
 (s.ma='DV004' AND l.ma='DO_XE')
ON CONFLICT DO NOTHING;

INSERT INTO tourism.tieu_chi_tiep_can
(loai_dich_vu_id,ban_kinh_m,so_luong_toi_thieu,trong_so,is_active)
SELECT id,
       CASE ma WHEN 'AN_UONG' THEN 1000 WHEN 'LUU_TRU' THEN 2000 WHEN 'Y_TE' THEN 2500 ELSE 1500 END,
       1,
       CASE ma WHEN 'AN_UONG' THEN 3 WHEN 'LUU_TRU' THEN 2 WHEN 'Y_TE' THEN 2 ELSE 1 END,
       TRUE
FROM tourism.loai_dich_vu
WHERE ma IN ('AN_UONG','LUU_TRU','Y_TE','DO_XE')
ON CONFLICT (loai_dich_vu_id) DO NOTHING;
