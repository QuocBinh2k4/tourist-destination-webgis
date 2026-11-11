import { useEffect, useMemo, useState } from "react";
import { Landmark, Music2, Gem, Building2, ScrollText, Search, ExternalLink, MapPin, ArrowUpRight, RefreshCw } from "lucide-react";
import { getDiSan, getApiError } from "../api/client";
import "../styles/disan.css";

const groups = [
  { ma: "DI_TICH", ten: "Di tích", icon: Landmark },
  { ma: "PHI_VAT_THE", ten: "Di sản văn hóa phi vật thể", icon: Music2 },
  { ma: "BAO_VAT", ten: "Bảo vật quốc gia", icon: Gem },
  { ma: "BAO_TANG", ten: "Bảo tàng", icon: Building2 },
  { ma: "TU_LIEU", ten: "Di sản tư liệu", icon: ScrollText }
];
const normalize = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLocaleLowerCase("vi");

export default function DiSanPage({ onOpenMap }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [category, setCategory] = useState("");
  const [classification, setClassification] = useState("");
  const [search, setSearch] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    getDiSan().then(response => {
      if (!response.success || !Array.isArray(response.data)) throw new Error("Dữ liệu không hợp lệ");
      if (active) { setItems(response.data); setError(""); }
    }).catch(err => {
      if (active) setError(getApiError(err));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [reload]);

  const classifications = useMemo(() => [...new Set(items.filter(item => !category || item.loai_hinh_ma === category).map(item => item.phan_loai))].sort((a, b) => a.localeCompare(b, "vi")), [items, category]);
  const filtered = useMemo(() => items.filter(item =>
    (!category || item.loai_hinh_ma === category) &&
    (!classification || item.phan_loai === classification) &&
    normalize([item.ten, item.dia_ban, item.phan_loai].join(" ")).includes(normalize(search.trim()))
  ), [items, category, classification, search]);

  function selectCategory(code) {
    setCategory(code);
    setClassification("");
  }

  return (
    <div className="heritage-page">
      <section className="heritage-intro">
        <div>
          <span className="heritage-eyebrow"><Landmark size={15} /> KHÁM PHÁ VIỆT NAM</span>
          <h2>Những giá trị được gìn giữ qua thời gian</h2>
          <p>Khám phá các di tích, thực hành văn hóa, hiện vật và tư liệu trong bộ hồ sơ di sản chọn lọc.</p>
          <a href="https://dsvh.gov.vn/thong-tin-di-san-van-hoa-121" target="_blank" rel="noreferrer">Nguồn: Cục Di sản văn hóa <ExternalLink size={14} /></a>
        </div>
        <button type="button" className="heritage-map-button" onClick={onOpenMap}><MapPin size={17} /> Mở bản đồ WebGIS <ArrowUpRight size={16} /></button>
      </section>

      <div className="heritage-groups" aria-label="Lọc theo nhóm di sản">
        {groups.map(group => {
          const Icon = group.icon;
          return <button type="button" key={group.ma} className={`heritage-group ${category === group.ma ? "selected" : ""}`} aria-pressed={category === group.ma} onClick={() => selectCategory(category === group.ma ? "" : group.ma)}>
            <Icon size={22} /><strong>{group.ten}</strong><span>{loading ? "…" : items.filter(item => item.loai_hinh_ma === group.ma).length} hồ sơ</span>
          </button>;
        })}
      </div>

      <section className="heritage-results" aria-label="Danh sách di sản">
        <div className="heritage-filters">
          <label className="heritage-search"><Search size={18} /><input type="search" aria-label="Tìm di sản hoặc địa bàn" placeholder="Tìm tên di sản, địa bàn…" value={search} onChange={event => setSearch(event.target.value)} /></label>
          <label><span className="heritage-sr-only">Phân loại chi tiết</span><select value={classification} onChange={event => setClassification(event.target.value)}><option value="">Tất cả phân loại</option>{classifications.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
          <button type="button" className="heritage-reset" onClick={() => { selectCategory(""); setSearch(""); }}>Xóa bộ lọc</button>
          <span className="heritage-result-count" role="status">{loading ? "Đang tải…" : `${filtered.length} / ${items.length} hồ sơ`}</span>
        </div>

        {error ? <div className="heritage-empty" role="alert"><p>{error}</p><button type="button" className="heritage-reset" onClick={() => { setLoading(true); setReload(value => value + 1); }}><RefreshCw size={15} /> Thử lại</button></div>
          : loading ? <p className="heritage-empty" role="status">Đang tải hồ sơ di sản…</p>
            : filtered.length === 0 ? <p className="heritage-empty">Không có hồ sơ phù hợp. Hãy thử từ khóa hoặc nhóm khác.</p>
              : <div className="heritage-grid">{filtered.map(item => {
                const Icon = groups.find(group => group.ma === item.loai_hinh_ma)?.icon || Landmark;
                const hasCoordinates = item.longitude != null && item.latitude != null;
                return <article className="heritage-card" key={item.id}>
                  <div className="heritage-card-top"><span className="heritage-card-icon"><Icon size={21} /></span><span className="heritage-badge">{item.loai_hinh_ten}</span></div>
                  <h3>{item.ten}</h3>
                  <p className="heritage-classification">{item.phan_loai}</p>
                  {item.mo_ta && <p className="heritage-description">{item.mo_ta}</p>}
                  <dl><div><dt>Địa bàn / nơi lưu giữ</dt><dd>{item.dia_ban || "Chưa bổ sung"}</dd></div><div><dt>Năm theo danh mục nguồn</dt><dd>{item.nam_ghi_danh || "Không áp dụng / chưa bổ sung"}</dd></div></dl>
                  {hasCoordinates ? <p className="heritage-coordinate-note"><MapPin size={14} /> {item.ghi_chu_toa_do?.split("Nguồn tọa độ:")[0] || "Điểm tham chiếu; không thể hiện ranh giới di sản."}</p> : <p className="heritage-coordinate-note">Hồ sơ chưa gắn điểm bản đồ.</p>}
                  <div className="heritage-card-footer"><a href={item.nguon_url} target="_blank" rel="noreferrer">Xem nguồn <ExternalLink size={14} /></a>{hasCoordinates && <a href={`https://www.openstreetmap.org/?mlat=${item.latitude}&mlon=${item.longitude}#map=15/${item.latitude}/${item.longitude}`} target="_blank" rel="noreferrer">Vị trí tham chiếu <ArrowUpRight size={14} /></a>}</div>
                </article>;
              })}</div>}
      </section>
      <p className="heritage-footnote">Bộ hồ sơ chọn lọc, đối chiếu ngày 11/11/2026; chưa phải toàn bộ danh mục quốc gia. Tên địa bàn và năm ghi danh được giữ theo nguồn, có thể dùng địa giới cũ. Di sản phi vật thể có thể trải rộng nhiều địa phương; tọa độ tham chiếu không thể hiện ranh giới hoặc điểm phục vụ khách. Nguồn nội dung: Cục Di sản văn hóa; nguồn tọa độ: UNESCO World Heritage Centre.</p>
    </div>
  );
}
