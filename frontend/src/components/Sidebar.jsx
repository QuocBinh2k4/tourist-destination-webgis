import {
  LayoutDashboard,
  MapPin,
  Tags,
  Landmark,
  Building2,
  Map,
  ChartNoAxesCombined,
  MapPinned,
  X,
  Database,
  BarChart3,
  ShieldAlert,
  UsersRound,
  Monitor,
} from "lucide-react";

const menuGroups = [
  { label: "TỔNG QUAN", items: [
    { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  ] },
  { label: "DỮ LIỆU DU LỊCH", items: [
    { id: "destinations", label: "Điểm du lịch", icon: MapPin },
    { id: "heritage", label: "Di sản văn hóa", icon: Landmark },
    { id: "services", label: "Cơ sở dịch vụ", icon: Building2 },
    { id: "categories", label: "Loại hình du lịch", icon: Tags },
    { id: "service-types", label: "Loại dịch vụ", icon: Tags },
  ] },
  { label: "BẢN ĐỒ VÀ PHÂN TÍCH", items: [
    { id: "map", label: "Bản đồ WebGIS", icon: Map },
    { id: "analysis", label: "Phân tích không gian", icon: ChartNoAxesCombined },
    { id: "service-gaps", label: "Khu vực thiếu dịch vụ", icon: ShieldAlert },
    { id: "statistics", label: "Thống kê", icon: BarChart3 },
  ] },
];

export default function Sidebar({
  role,
  activePage,
  onChangePage,
  mobileOpen,
  onClose,
}) {
  return (
    <>
      {mobileOpen && (
        <button
          className="sidebar-overlay"
          aria-label="Đóng menu"
          onClick={onClose}
        />
      )}

      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <MapPinned size={25} />
          </div>

          <div className="brand-text">
            <strong>TourismGIS</strong>
            <span>Spatial Management</span>
          </div>

          <button
            className="sidebar-close"
            onClick={onClose}
            aria-label="Đóng Sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-menu" aria-label="Điều hướng chính">
          {[...menuGroups, { label: role === "admin" ? "QUẢN TRỊ HỆ THỐNG" : "TÀI KHOẢN", items: [
            { id: "accounts", label: role === "admin" ? "Tài khoản và phân quyền" : "Phiên đăng nhập", icon: role === "admin" ? UsersRound : Monitor },
          ] }].map(group => <div className="sidebar-group" key={group.label}>
            <div className="sidebar-section-label">{group.label}</div>
            {group.items.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;

            return (
              <button
                key={item.id}
                className={`sidebar-item ${active ? "active" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  onChangePage(item.id);
                  onClose();
                }}
              >
                <Icon size={19} strokeWidth={2} />
                <span>{item.label}</span>
              </button>
            );
          })}</div>)}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-server">
            <Database size={19} />
            <div>
              <strong>PostgreSQL + PostGIS</strong>
              <span>Cơ sở dữ liệu không gian</span>
            </div>
          </div>
          <div className="sidebar-version">TourismGIS · Phiên bản 1.0</div>
        </div>
      </aside>
    </>
  );
}
