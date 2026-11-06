import {
  LayoutDashboard,
  MapPin,
  Tags,
  Building2,
  Map,
  ChartNoAxesCombined,
  MapPinned,
  X,
  Database,
  BarChart3,
  ShieldAlert,
} from "lucide-react";

const menuItems = [
  {
    id: "dashboard",
    label: "Tổng quan",
    icon: LayoutDashboard,
  },
  {
    id: "destinations",
    label: "Điểm du lịch",
    icon: MapPin,
  },
  {
    id: "categories",
    label: "Loại hình du lịch",
    icon: Tags,
  },
  {
    id: "services",
    label: "Cơ sở dịch vụ",
    icon: Building2,
  },
  {
    id: "service-types",
    label: "Loại dịch vụ",
    icon: Tags,
  },
  {
    id: "map",
    label: "Bản đồ WebGIS",
    icon: Map,
  },
  {
    id: "analysis",
    label: "Phân tích không gian",
    icon: ChartNoAxesCombined,
  },
  {
    id: "statistics",
    label: "Thống kê",
    icon: BarChart3,
  },
  {
    id: "service-gaps",
    label: "Khu vực thiếu dịch vụ",
    icon: ShieldAlert,
  },
];

export default function Sidebar({
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

        <div className="sidebar-section-label">QUẢN LÝ HỆ THỐNG</div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = activePage === item.id;

            return (
              <button
                key={item.id}
                className={`sidebar-item ${active ? "active" : ""}`}
                onClick={() => {
                  onChangePage(item.id);
                  onClose();
                }}
              >
                <Icon size={19} strokeWidth={2} />
                <span>{item.label}</span>
              </button>
            );
          })}
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
