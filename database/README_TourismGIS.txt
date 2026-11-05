TOURISMGIS - BO TAI LIEU THIET KE CSDL KHONG GIAN

1. 05_dac_ta_thiet_ke_TourismGIS.md : dac ta, bang du lieu, yeu cau, API, phan tich.
2. ERD_TourismGIS.png : so do ERD de chen vao bao cao.
3. 04_so_do_ERD_tourismgis.mmd : ma Mermaid co the sua.
4. erd_tourismgis.dot : nguon Graphviz de ve lai so do.
5. 01_khoi_tao_csdl_tourismgis.sql : 9 bang + constraints + GiST + trigger + function + view.
6. 02_du_lieu_mau_tourismgis.sql : du lieu TEST GIA LAP, khong phai dia diem du lich thuc te.
7. 03_truy_van_postgis_tourismgis.sql : 13 truy van minh hoa.

THU TU CHAY
- Cai PostgreSQL co PostGIS.
- Tao database bang lenh: CREATE DATABASE tourismgis;
- Ket noi toi database tourismgis trong pgAdmin.
- Chay 01, sau do 02, sau do 03.
- Thuc nghiem voi QGIS va xay dung API WebGIS.

LUU Y
- Bo script duoc xay dung theo cu phap PostgreSQL/PostGIS, chua duoc thuc thi truc tiep
  tren may chu PostgreSQL trong moi truong soan thao nay.
- Ranh gioi va diem mau la GIA LAP, khong su dung nhu du lieu quan ly thuc dia.
- Khoang cach theo geography la khoang cach truc tiep, khong phai tuyen duong giao thong.
