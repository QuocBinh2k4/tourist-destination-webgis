
import {
  Menu,
  Search,
  RefreshCw,
  LogOut,
  LoaderCircle,
  UserRound,
  Wifi,
  WifiOff
} from "lucide-react";

export default function Header({
  currentUser,
  onLogout,
  loggingOut,
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
        <div className="header-account">
          <div className="header-avatar" aria-hidden="true">
            <UserRound size={18} />
          </div>
          <div className="header-account-info">
            <strong title={currentUser.fullName}>{currentUser.fullName}</strong>
            <span>{({ admin: "Quản trị viên", editor: "Biên tập viên", viewer: "Người xem" })[currentUser.role] || currentUser.role}</span>
          </div>
          <button
            className="logout-button"
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            aria-busy={loggingOut}
            title="Đăng xuất khỏi hệ thống"
          >
            {loggingOut
              ? <LoaderCircle size={16} className="spin" aria-hidden="true" />
              : <LogOut size={16} aria-hidden="true" />}
            <span>{loggingOut ? "Đang đăng xuất..." : "Đăng xuất"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
