import { useCallback, useEffect, useRef, useState } from "react";
import { UsersRound, UserCheck, ShieldCheck, Monitor, Plus, RefreshCw, Search, Pencil, Trash2, LogOut, X, Save, Info, CheckCircle2, ChevronLeft, ChevronRight, FilterX, AlertTriangle } from "lucide-react";
import StatCard from "../components/StatCard";
import api, { getApiError } from "../api/client";
import "../styles/phan8.css";
import "../styles/accounts.css";

const roles = { admin: "Quản trị viên", editor: "Biên tập viên", viewer: "Người xem" };
const empty = { username: "", fullName: "", password: "", role: "viewer", active: true };
const date = value => new Date(value).toLocaleString("vi-VN");
const roleDescriptions = {
  admin: "Quản lý tài khoản, phân quyền, mọi phiên đăng nhập và toàn bộ dữ liệu.",
  editor: "Xem, thêm và sửa điểm du lịch, cơ sở dịch vụ. Quản lý phiên của mình.",
  viewer: "Tra cứu, phân tích dữ liệu và quản lý phiên đăng nhập của mình.",
};

function useModal() {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => element.close();
  }, []);
  return dialog;
}

function ConfirmAction({ confirmation, busy, error, onClose, onConfirm }) {
  const dialog = useModal();
  return <dialog ref={dialog} className="account-dialog account-confirm" aria-labelledby="account-confirm-title" aria-describedby="account-confirm-description" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="p8-modal-header"><h3 id="account-confirm-title">{confirmation.title}</h3><button disabled={busy} onClick={onClose} aria-label="Đóng"><X size={20} /></button></div>
    <div className="p8-form-body"><span className="account-confirm-icon"><AlertTriangle size={26} /></span><p id="account-confirm-description">{confirmation.description}</p>{error && <p className="error-banner" role="alert">{error}</p>}</div>
    <div className="p8-modal-footer"><button className="p8-secondary" autoFocus disabled={busy} onClick={onClose}>Hủy</button><button className="p8-danger" disabled={busy} onClick={onConfirm}>{busy ? "Đang xử lý..." : confirmation.label}</button></div>
  </dialog>;
}

function AccountForm({ form, field, busy, currentUser, error, onSave, onClose }) {
  const dialog = useModal();
  const self = String(form.id) === String(currentUser.id);
  return <dialog ref={dialog} className="account-dialog" aria-labelledby="account-form-title" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <form onSubmit={onSave}>
      <div className="p8-modal-header"><div><h3 id="account-form-title">{form.id ? "Chỉnh sửa tài khoản" : "Thêm tài khoản"}</h3><p className="p8-note">Thông tin đăng nhập và quyền truy cập hệ thống</p></div>
        <button type="button" disabled={busy} onClick={onClose} aria-label="Đóng"><X size={20} /></button></div>
      <div className="p8-form-body">
        {error && <p className="error-banner" role="alert">{error}</p>}
        <fieldset disabled={busy} className="account-fields">
          <div className="p8-form-grid">
            <label>Tên đăng nhập<input autoFocus required pattern="[a-zA-Z0-9_.\-]{3,60}" maxLength={60} autoComplete="off" placeholder="VD: nguyen.van.a" value={form.username} onChange={e => field("username", e.target.value)} /><span className="p8-note">3–60 ký tự: chữ, số, dấu chấm, gạch dưới, gạch ngang.</span></label>
            <label>Họ và tên<input required maxLength={150} placeholder="Nhập họ và tên" value={form.fullName} onChange={e => field("fullName", e.target.value)} /></label>
            <label>{form.id ? "Mật khẩu mới" : "Mật khẩu"}<input type="password" required={!form.id} minLength={8} maxLength={1024} autoComplete="new-password" placeholder={form.id ? "Để trống để giữ nguyên" : "Tối thiểu 8 ký tự"} value={form.password} onChange={e => field("password", e.target.value)} /></label>
            <label>Vai trò<select value={form.role} disabled={self} onChange={e => field("role", e.target.value)}>{Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><span className="p8-note">{roleDescriptions[form.role]}</span></label>
          </div>
          <label className="account-active"><input type="checkbox" checked={form.active} disabled={self} onChange={e => field("active", e.target.checked)} /><span><strong>Cho phép đăng nhập</strong><small>Bỏ chọn để khóa tài khoản này.</small></span></label>
          {self && <p className="p8-note account-self-note">Bạn đang sửa tài khoản của mình. Vai trò và trạng thái đăng nhập được giữ nguyên.</p>}
        </fieldset>
        {form.id && <p className="account-info"><Info size={17} />Lưu thay đổi sẽ thu hồi mọi phiên của tài khoản này{self ? " và yêu cầu bạn đăng nhập lại" : ""}.</p>}
      </div>
      <div className="p8-modal-footer"><button type="button" className="p8-secondary" disabled={busy} onClick={onClose}>Hủy</button><button className="p8-primary" disabled={busy}><Save size={16} />{busy ? "Đang lưu..." : "Lưu tài khoản"}</button></div>
    </form>
  </dialog>;
}

export default function AccountsPage({ currentUser, onSessionEnded }) {
  const admin = currentUser.role === "admin";
  const [accounts, setAccounts] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(admin ? "accounts" : "sessions");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [confirmation, setConfirmation] = useState(null);

  const load = useCallback(async () => {
    try {
      const [users, activeSessions] = await Promise.all([
        admin ? api.get("/accounts") : Promise.resolve({ data: { data: [] } }),
        api.get("/accounts/sessions"),
      ]);
      setAccounts(users.data.data);
      setSessions(activeSessions.data.data);
    } catch (err) { setError(getApiError(err)); }
    finally { setLoading(false); }
  }, [admin]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) load(); });
    return () => { active = false; };
  }, [load]);

  async function act(action, message, endsSession = false) {
    setBusy(true); setError(""); setNotice("");
    try {
      await action();
      if (endsSession) { onSessionEnded(); return; }
      setForm(null); setConfirmation(null); setNotice(message); await load();
    } catch (err) { setError(getApiError(err)); }
    finally { setBusy(false); }
  }

  function save(event) {
    event.preventDefault();
    act(() => form.id ? api.put("/accounts/" + form.id, form) : api.post("/accounts", form),
      form.id ? "Đã cập nhật tài khoản và thu hồi các phiên cũ." : "Đã thêm tài khoản mới.",
      String(form.id) === String(currentUser.id));
  }

  const field = (key, value) => setForm(previous => ({ ...previous, [key]: value }));
  const filtered = accounts.filter(user => (!roleFilter || user.vai_tro === roleFilter) &&
    (!statusFilter || user.is_active === (statusFilter === "active")) &&
    (user.ten_dang_nhap + " " + user.ho_ten).toLocaleLowerCase("vi").includes(search.trim().toLocaleLowerCase("vi")));
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * 10, currentPage * 10);
  const hasFilters = Boolean(search || roleFilter || statusFilter);
  function clearFilters() { setSearch(""); setRoleFilter(""); setStatusFilter(""); setPage(1); }
  function confirmAction(value) { setError(""); setConfirmation(value); }

  return <section className="accounts-page">
    <div className="p8-heading">
      <div><h2>{admin ? "Tài khoản và phân quyền" : "Phiên đăng nhập của tôi"}</h2><p>{admin ? "Quản lý thành viên, quyền truy cập và các phiên đăng nhập." : "Theo dõi và kết thúc các phiên đăng nhập của bạn."}</p></div>
      <div className="account-actions"><button className="p8-secondary" disabled={busy || loading} onClick={() => { setError(""); setLoading(true); load(); }}><RefreshCw size={16} className={loading ? "spin" : ""} />Tải lại</button>
        {admin && <button className="p8-primary" disabled={busy} onClick={() => { setForm({ ...empty }); setError(""); }}><Plus size={17} />Thêm tài khoản</button>}</div>
    </div>
    {error && !form && !confirmation && <p className="error-banner" role="alert">{error}</p>}
    {notice && <div className="p8-message account-notice" role="status"><CheckCircle2 size={17} /><span>{notice}</span><button aria-label="Đóng thông báo" onClick={() => setNotice("")}><X size={16} /></button></div>}
    {admin && <div className="stats-grid account-stats">
      <StatCard title="Tổng tài khoản" value={loading ? "..." : accounts.length} icon={UsersRound} color="blue" description="Thành viên trong hệ thống" />
      <StatCard title="Đang hoạt động" value={loading ? "..." : accounts.filter(user => user.is_active).length} icon={UserCheck} color="green" description="Tài khoản được phép đăng nhập" />
      <StatCard title="Quản trị viên" value={loading ? "..." : accounts.filter(user => user.vai_tro === "admin" && user.is_active).length} icon={ShieldCheck} color="purple" description="Quản trị viên đang hoạt động" />
      <StatCard title="Phiên đăng nhập" value={loading ? "..." : sessions.length} icon={Monitor} color="orange" description="Các phiên còn hiệu lực" />
    </div>}
    <section className="panel account-panel" aria-busy={loading}>
      {admin && <div className="account-tabs" aria-label="Nội dung quản lý">
        <button aria-pressed={tab === "accounts"} onClick={() => setTab("accounts")}><UsersRound size={17} />Danh sách tài khoản<span>{accounts.length}</span></button>
        <button aria-pressed={tab === "sessions"} onClick={() => setTab("sessions")}><Monitor size={17} />Phiên đăng nhập<span>{sessions.length}</span></button>
      </div>}
      {tab === "accounts" && admin ? <>
        <div className="p8-toolbar account-toolbar">
          <div className="p8-search"><Search size={18} /><input type="search" aria-label="Tìm tài khoản" placeholder="Tìm tên đăng nhập, họ tên..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} /></div>
          <select aria-label="Lọc vai trò" value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}><option value="">Tất cả vai trò</option>{Object.entries(roles).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
          <select aria-label="Lọc trạng thái" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}><option value="">Tất cả trạng thái</option><option value="active">Hoạt động</option><option value="locked">Đã khóa</option></select>
          {hasFilters && <button className="p8-secondary" onClick={clearFilters}><FilterX size={16} />Xóa lọc</button>}
        </div>
        <div className="table-scroll"><table className="data-table account-table"><caption className="account-sr-only">Danh sách tài khoản và quyền truy cập</caption><thead><tr><th scope="col">Thành viên</th><th scope="col">Vai trò</th><th scope="col">Trạng thái</th><th scope="col">Thao tác</th></tr></thead><tbody>
          {!loading && visible.map(user => <tr key={user.id}>
            <td data-label="Thành viên"><div className="account-member"><span className="account-avatar" aria-hidden="true">{user.ho_ten?.trim().charAt(0).toUpperCase() || "?"}</span><div className="account-identity"><strong>{user.ho_ten}{String(user.id) === String(currentUser.id) && <span className="account-self">Bạn</span>}</strong><small>{user.ten_dang_nhap}</small></div></div></td>
            <td data-label="Vai trò"><span className={"account-role " + user.vai_tro}>{roles[user.vai_tro]}</span></td>
            <td data-label="Trạng thái"><span className={"status-badge " + (user.is_active ? "dang_hoat_dong" : "ngung_hoat_dong")}>{user.is_active ? "Hoạt động" : "Đã khóa"}</span></td>
            <td data-label="Thao tác"><div className="account-actions"><button className="p8-secondary" disabled={busy} aria-label={"Sửa và cấp quyền cho " + user.ten_dang_nhap} onClick={() => { setError(""); setForm({ id: user.id, username: user.ten_dang_nhap, fullName: user.ho_ten, role: user.vai_tro, active: user.is_active, password: "" }); }}><Pencil size={15} />Sửa / cấp quyền</button>
              <button className="account-delete" title={String(user.id) === String(currentUser.id) ? "Không thể xóa tài khoản đang sử dụng" : "Xóa tài khoản"} aria-label={"Xóa tài khoản " + user.ten_dang_nhap} disabled={busy || String(user.id) === String(currentUser.id)} onClick={() => {
                confirmAction({ title: "Xóa tài khoản", description: "Xóa tài khoản “" + user.ten_dang_nhap + "” và toàn bộ phiên đăng nhập? Thao tác này không thể hoàn tác.", label: "Xóa tài khoản", action: () => api.delete("/accounts/" + user.id), message: "Đã xóa tài khoản." });
              }}><Trash2 size={16} /><span>Xóa</span></button></div></td>
          </tr>)}
          <EmptyRow loading={loading} empty={!filtered.length} columns={4} text={hasFilters ? "Không tìm thấy tài khoản phù hợp. Thử thay đổi từ khóa hoặc bộ lọc." : "Chưa có tài khoản. Chọn “Thêm tài khoản” để tạo thành viên mới."} />
        </tbody></table></div>
        <div className="account-pagination"><span>{loading ? "Đang tải..." : filtered.length ? `Hiển thị ${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, filtered.length)} / ${filtered.length} tài khoản` : "0 tài khoản"}</span><div><button className="p8-secondary" aria-label="Trang trước" disabled={loading || currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><span>Trang {currentPage} / {pageCount}</span><button className="p8-secondary" aria-label="Trang sau" disabled={loading || currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></div></div>
      </> : <>
        <div className="panel-header"><div><h3>Phiên đăng nhập đang hoạt động</h3><p>Phiên có hiệu lực 8 giờ. {admin ? "Quản lý phiên của tất cả tài khoản." : "Thu hồi phiên để kết thúc truy cập."}</p></div><Monitor size={21} className="muted-icon" /></div>
        <div className="table-scroll"><table className="data-table account-table"><caption className="account-sr-only">Các phiên đăng nhập còn hiệu lực</caption><thead><tr><th scope="col">Tài khoản</th><th scope="col">Đăng nhập lúc</th><th scope="col">Hết hạn lúc</th><th scope="col">Thao tác</th></tr></thead><tbody>
          {!loading && sessions.map(session => <tr key={session.id}><td data-label="Tài khoản"><div className="account-session-identity"><strong>{session.ten_dang_nhap}</strong>{session.current && <span className="status-badge dang_hoat_dong">Phiên hiện tại</span>}</div></td><td data-label="Đăng nhập lúc">{date(session.created_at)}</td><td data-label="Hết hạn lúc">{date(session.expires_at)}</td><td data-label="Thao tác"><button className="p8-secondary" disabled={busy} onClick={() => {
            confirmAction({ title: "Thu hồi phiên đăng nhập", description: session.current ? "Bạn sẽ đăng xuất khỏi phiên hiện tại và cần đăng nhập lại để tiếp tục." : "Kết thúc phiên của tài khoản “" + session.ten_dang_nhap + "” đăng nhập lúc " + date(session.created_at) + "?", label: "Thu hồi phiên", action: () => api.delete("/accounts/sessions/" + session.id), message: "Đã thu hồi phiên.", endsSession: session.current });
          }}><LogOut size={15} />Thu hồi</button></td></tr>)}
          <EmptyRow loading={loading} empty={!sessions.length} columns={4} text="Không có phiên hoạt động." />
        </tbody></table></div>
      </>}
    </section>
    {admin && <section className="panel account-permissions" aria-labelledby="account-permissions-title"><h3 id="account-permissions-title"><ShieldCheck size={18} />Quyền của từng vai trò</h3><div className="account-role-guide">
      {Object.entries(roles).map(([role, label]) => <div key={role}><span className={"account-role " + role}>{label}</span><p>{roleDescriptions[role]}</p></div>)}
    </div></section>}
    {admin && form && <AccountForm form={form} field={field} busy={busy} currentUser={currentUser} error={error} onSave={save} onClose={() => { setForm(null); setError(""); }} />}
    {confirmation && <ConfirmAction confirmation={confirmation} busy={busy} error={error} onClose={() => { setConfirmation(null); setError(""); }} onConfirm={() => act(confirmation.action, confirmation.message, confirmation.endsSession)} />}
  </section>;
}

function EmptyRow({ loading, empty, columns, text }) {
  if (!loading && !empty) return null;
  return <tr><td className="empty-cell" colSpan={columns}><span role="status">{loading ? "Đang tải dữ liệu..." : text}</span></td></tr>;
}
