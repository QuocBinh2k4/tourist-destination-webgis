
import {
  Menu,
  Search,
  RefreshCw,
  Wifi,
  WifiOff
} from "lucide-react";

export default function Header({
  title,
  subtitle,
  onOpenMenu,
  connected,
  search,
  onSearchChange,
  onRefresh,
  refreshing,
  showSearch = true
}) {
  return (
    <header className="top-header">
      <div className="header-left">
        <button
          className="menu-toggle"
          onClick={onOpenMenu}
          aria-label="Mở menu"
        >
          <Menu size={23} />
        </button>

        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>

      <div className="header-actions">
        
        {showSearch && (
        <div className="header-search">
            <Search size={18} />
            <input
            type="search"
            placeholder="Tìm điểm du lịch..."
            aria-label="Tìm điểm du lịch"
            value={search}
            onChange={(event) => {
                onSearchChange(event.target.value);
            }}
            />
        </div>
        )}


        <button
          className="icon-button"
          onClick={onRefresh}
          disabled={refreshing}
          title="Tải lại dữ liệu"
          aria-label="Tải lại dữ liệu"
        >
          <RefreshCw
            size={19}
            className={refreshing ? "spin" : ""}
          />
        </button>

        <div
          className={`connection-status ${
            connected ? "online" : "offline"
          }`}
          title={
            connected
              ? "Backend và database đang kết nối"
              : "Chưa xác nhận được kết nối"
          }
        >
          {connected
            ? <Wifi size={17} />
            : <WifiOff size={17} />
          }
          <span>
            {connected ? "Đã kết nối" : "Mất kết nối"}
          </span>
        </div>
      </div>
    </header>
  );
}
