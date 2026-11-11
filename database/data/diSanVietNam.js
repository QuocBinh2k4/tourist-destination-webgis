// Bộ hồ sơ chọn lọc, không phải danh mục đầy đủ của Việt Nam.
// Địa bàn và năm ghi danh giữ theo nguồn; không suy ra địa giới hiện hành.
const base = "https://dsvh.gov.vn/";
const sources = {
  sites: base + "di-san-van-hoa-va-thien-nhien-the-gioi-1754",
  intangible: base + "di-san-van-hoa-phi-vat-the-dai-dien-cua-nhan-loai-1755",
  urgent: base + "di-san-van-hoa-phi-vat-the-can-bao-ve-khan-cap-1756",
  treasures: base + "bao-vat-quoc-gia-1758",
  museums: "https://baotang.dsvh.gov.vn/",
  documents: base + "di-san-tu-lieu-1761"
};
const categories = [
  { ma: "DI_TICH", ten: "Di tích", mo_ta: "Theo Cục Di sản văn hóa: di sản văn hóa và thiên nhiên thế giới; di tích quốc gia đặc biệt; di tích quốc gia." },
  { ma: "PHI_VAT_THE", ten: "Di sản văn hóa phi vật thể", mo_ta: "Theo Cục Di sản văn hóa: di sản đại diện của nhân loại; cần bảo vệ khẩn cấp; di sản phi vật thể quốc gia." },
  { ma: "BAO_VAT", ten: "Bảo vật quốc gia", mo_ta: "Theo Cục Di sản văn hóa: bảo vật quốc gia, di vật và cổ vật. Hồ sơ hiện vật không đồng nghĩa với một điểm du lịch độc lập." },
  { ma: "BAO_TANG", ten: "Bảo tàng", mo_ta: "Theo Cục Di sản văn hóa: bảo tàng quốc gia; chuyên ngành; cấp tỉnh; ngoài công lập." },
  { ma: "TU_LIEU", ten: "Di sản tư liệu", mo_ta: "Theo Cục Di sản văn hóa: tư liệu được ghi danh ở cấp thế giới và khu vực châu Á - Thái Bình Dương." }
];
const dms = (d, m, s) => d + m / 60 + s / 3600;
const sites = [
  ["HUE", "Quần thể di tích Cố đô Huế", "Huế", "1993", 678,
    [dms(107,34,40), dms(16,28,10)],
    "Hệ thống kiến trúc gắn với kinh đô triều Nguyễn.", "Kinh thành Huế, một hợp phần của quần thể", true],
  ["MY_SON", "Khu di tích Chăm Mỹ Sơn", "Quảng Nam (theo nguồn)", "1999", 949,
    [dms(108,6,33.008), dms(15,46,25.835)],
    "Quần thể đền tháp phản ánh lịch sử và kiến trúc Champa.", "Điểm tham chiếu di sản UNESCO", false],
  ["HOI_AN", "Đô thị cổ Hội An", "Hội An, Quảng Nam (theo nguồn)", "1999", 948,
    [dms(108,19,60), dms(15,52,60)],
    "Không gian đô thị cảng cổ với kiến trúc và mạng lưới đường phố được bảo tồn.", "Điểm tham chiếu di sản UNESCO", false],
  ["THANG_LONG", "Hoàng thành Thăng Long", "Hà Nội", "2010", 1328,
    [dms(105,50,19.043), dms(21,2,15.072)],
    "Khu trung tâm hoàng thành và dấu tích khảo cổ của kinh đô Thăng Long.", "Điểm tham chiếu di sản UNESCO", false],
  ["THANH_HO", "Thành nhà Hồ", "Thanh Hóa", "2011", 1358,
    [dms(105,36,17), dms(20,4,41)],
    "Di tích thành đá gắn với triều Hồ.", "Thành nội, một hợp phần của di sản", true],
  ["TRANG_AN", "Quần thể danh thắng Tràng An", "Ninh Bình", "2014", 1438,
    [dms(105,53,47), dms(20,15,24)],
    "Cảnh quan núi đá vôi có giá trị văn hóa và tự nhiên.", "Điểm tham chiếu di sản UNESCO", false]
].map(([ma, ten, dia_ban, nam_ghi_danh, unesco, coordinates, mo_ta, coordinateLabel, maps]) => ({
  ma: "DS_" + ma, ten, dia_ban, nam_ghi_danh, mo_ta,
  category: "DI_TICH",
  phan_loai: ma === "TRANG_AN" ? "Di sản hỗn hợp thế giới" : "Di sản văn hóa thế giới",
  nguon_url: sources.sites, coordinates,
  coordinateSource: `https://whc.unesco.org/en/list/${unesco}/${maps ? "maps/" : ""}`,
  ghi_chu_toa_do: coordinateLabel + "; không phải cổng vào hay ranh giới di sản."
}));
const intangible = [
  ["NHA_NHAC", "Nhã nhạc - Âm nhạc cung đình Việt Nam", "Huế", "2003"],
  ["CONG_CHIENG", "Không gian văn hóa cồng chiêng Tây Nguyên", "Tây Nguyên", "2005"],
  ["QUAN_HO", "Dân ca Quan họ Bắc Ninh", "Bắc Ninh", "2009"],
  ["HOI_GIONG", "Hội Gióng ở đền Phù Đổng và đền Sóc", "Hà Nội", "2010"],
  ["HUNG_VUONG", "Tín ngưỡng thờ cúng Hùng Vương ở Phú Thọ", "Phú Thọ", "2012"],
  ["DON_CA", "Nghệ thuật Đờn ca tài tử Nam Bộ", "Nam Bộ", "2013"],
  ["VI_GIAM", "Dân ca Ví, Giặm Nghệ Tĩnh", "Nghệ An, Hà Tĩnh", "2014"],
  ["KEO_CO", "Nghi lễ và trò chơi kéo co", "Nhiều địa phương; hồ sơ đa quốc gia", "2015"],
  ["THO_MAU", "Thực hành tín ngưỡng thờ Mẫu Tam phủ của người Việt", "Nhiều địa phương", "2016"],
  ["BAI_CHOI", "Nghệ thuật Bài Chòi Trung Bộ Việt Nam", "Trung Bộ", "2017"],
  ["HAT_XOAN", "Hát Xoan Phú Thọ", "Phú Thọ", "2017"],
  ["THEN", "Thực hành Then của người Tày, Nùng, Thái", "Nhiều địa phương", "2019"],
  ["XOE_THAI", "Nghệ thuật Xòe Thái", "Nhiều địa phương", "2021"]
].map(([ma, ten, dia_ban, nam_ghi_danh]) => ({
  ma: "DS_" + ma, ten, dia_ban, nam_ghi_danh, category: "PHI_VAT_THE",
  phan_loai: "Đại diện của nhân loại", nguon_url: sources.intangible
}));
const urgent = [
  ["CA_TRU", "Ca trù", "Nhiều địa phương", "2009"],
  ["GOM_CHAM", "Nghệ thuật làm gốm của người Chăm", "Ninh Thuận, Bình Thuận (theo nguồn)", "2022"]
].map(([ma, ten, dia_ban, nam_ghi_danh]) => ({
  ma: "DS_" + ma, ten, dia_ban, nam_ghi_danh, category: "PHI_VAT_THE",
  phan_loai: "Cần bảo vệ khẩn cấp", nguon_url: sources.urgent
}));
const treasures = [
  ["NGOC_LU", "Trống đồng Ngọc Lũ"],
  ["HOANG_HA", "Trống đồng Hoàng Hạ"],
  ["DAO_THINH", "Thạp đồng Đào Thịnh"]
].map(([ma, ten]) => ({
  ma: "DS_" + ma, ten, category: "BAO_VAT", phan_loai: "Bảo vật quốc gia",
  dia_ban: "Bảo tàng Lịch sử quốc gia (nơi lưu giữ theo nguồn)", nam_ghi_danh: "2012",
  nguon_url: sources.treasures, mo_ta: "Quyết định 1426/QĐ-TTg ngày 01/12/2012."
}));
const museums = [
  ["BT_LICH_SU", "Bảo tàng Lịch sử quốc gia"],
  ["BT_DAN_TOC", "Bảo tàng Dân tộc học Việt Nam"],
  ["BT_PHU_NU", "Bảo tàng Phụ nữ Việt Nam"]
].map(([ma, ten]) => ({
  ma: "DS_" + ma, ten, category: "BAO_TANG", phan_loai: "Cơ sở bảo tàng",
  nguon_url: sources.museums
}));
const documents = [
  ["MOC_BAN_NGUYEN", "Mộc bản triều Nguyễn", "Trung tâm Lưu trữ quốc gia IV (theo nguồn)", "2009"],
  ["BIA_TIEN_SI", "Bia Tiến sĩ Văn Miếu - Quốc Tử Giám", "Hà Nội", "2010 và 2015"],
  ["CHAU_BAN", "Châu bản triều Nguyễn", "Trung tâm Lưu trữ quốc gia I (theo nguồn)", "2014 và 2017"]
].map(([ma, ten, dia_ban, nam_ghi_danh]) => ({
  ma: "DS_" + ma, ten, dia_ban, nam_ghi_danh, category: "TU_LIEU",
  phan_loai: "Di sản tư liệu thế giới", nguon_url: sources.documents
}));
module.exports = {
  categories,
  records: [...sites, ...intangible, ...urgent, ...treasures, ...museums, ...documents],
  checkedAt: "2026-11-11"
};
