
import { useEffect, useMemo, useState } from "react";
import {
  Plus, Pencil, Search, RefreshCw,
  Building2, Save, X
} from "lucide-react";

import {
  getCoSoDichVu,
  getCoSoDichVuById,
  createCoSoDichVu,
  updateCoSoDichVu,
  deleteCoSoDichVu,
  getLoaiDichVu,
  getApiError
} from "../api/client";

import "../styles/phan8.css";

const initialForm = {
  ma: "", ten: "", dia_chi: "",
  so_dien_thoai: "",
  trang_thai: "dang_hoat_dong",
  nguon_du_lieu: "",
  ngay_kiem_chung: "",
  longitude: "", latitude: "",
  gio_mo: "", gio_dong: "",
  loai_dich_vu_ids: []
};

const statusText = {
  dang_hoat_dong: "Đang hoạt động",
  tam_dong: "Tạm đóng",
  ngung_hoat_dong: "Ngừng hoạt động"
};

export default function CoSoDichVuPage() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function loadData() {
    setLoading(true);

    try {
      const [services, types] = await Promise.all([
        getCoSoDichVu(), getLoaiDichVu()
      ]);

      if (!services.success || !types.success) {
        throw new Error("Không tải được danh sách");
      }

      setItems(services.data);
      setCategories(types.data);
    } catch (error) {
      setMessage(
        getApiError(error) || error.message
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("vi");

    return items.filter(item => {
      const textMatch = !q || [
        item.ma, item.ten, item.dia_chi
      ].some(v => String(v || "")
        .toLocaleLowerCase("vi").includes(q));

      const statusMatch =
        !status || item.trang_thai === status;

      const typeMatch =
        !categoryId ||
        (item.loai_dich_vu || []).some(
          x => String(x.id) === categoryId
        );

      return textMatch && statusMatch && typeMatch;
    });
  }, [items, search, categoryId, status]);

  const totalPages = Math.max(
    1, Math.ceil(filtered.length / pageSize)
  );
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function openCreate() {
    setEditingId(null);
    setForm({ ...initialForm, loai_dich_vu_ids: [] });
    setFormOpen(true);
    setMessage("");
  }

  async function openEdit(id) {
    try {
      const response = await getCoSoDichVuById(id);
      const item = response.data;

      setEditingId(id);
      setForm({
        ma: item.ma || "",
        ten: item.ten || "",
        dia_chi: item.dia_chi || "",
        so_dien_thoai: item.so_dien_thoai || "",
        trang_thai: item.trang_thai,
        nguon_du_lieu: item.nguon_du_lieu || "",
        ngay_kiem_chung:
          item.ngay_kiem_chung?.slice(0, 10) || "",
        longitude: item.longitude ?? "",
        latitude: item.latitude ?? "",
        gio_mo: item.gio_mo_cua?.mo || "",
        gio_dong: item.gio_mo_cua?.dong || "",
        loai_dich_vu_ids:
          (item.loai_dich_vu_ids || []).map(Number)
      });
      setFormOpen(true);
      setMessage("");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        error.message
      );
    }
  }

  function changeField(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function toggleType(id) {
    const value = Number(id);

    setForm(prev => ({
      ...prev,
      loai_dich_vu_ids:
        prev.loai_dich_vu_ids.includes(value)
          ? prev.loai_dich_vu_ids.filter(x => x !== value)
          : [...prev.loai_dich_vu_ids, value]
    }));
  }

  async function handleSave(event) {
    event.preventDefault();

    const longitude = Number(form.longitude);
    const latitude = Number(form.latitude);

    if (
      !form.ma.trim() || !form.ten.trim() ||
      !form.nguon_du_lieu.trim() ||
      form.ma.length > 30 || form.ten.length > 250 ||
      form.longitude === "" || form.latitude === "" ||
      !Number.isFinite(longitude) ||
      !Number.isFinite(latitude) ||
      Math.abs(longitude) > 180 ||
      Math.abs(latitude) > 90
    ) {
      setMessage("Kiểm tra mã, tên, nguồn dữ liệu và tọa độ.");
      return;
    }

    const payload = {
      ma: form.ma.trim(),
      ten: form.ten.trim(),
      dia_chi: form.dia_chi,
      so_dien_thoai: form.so_dien_thoai,
      trang_thai: form.trang_thai,
      nguon_du_lieu: form.nguon_du_lieu.trim(),
      ngay_kiem_chung: form.ngay_kiem_chung || null,
      longitude,
      latitude,
      gio_mo_cua: form.gio_mo && form.gio_dong
        ? { mo: form.gio_mo, dong: form.gio_dong }
        : {},
      loai_dich_vu_ids: form.loai_dich_vu_ids
    };

    setSaving(true);
    setMessage("");

    try {
      if (editingId) {
        await updateCoSoDichVu(editingId, payload);
      } else {
        await createCoSoDichVu(payload);
      }

      setFormOpen(false);
      await loadData();
      setMessage("Đã lưu cơ sở dịch vụ thành công.");
    } catch (error) {
      setMessage(
        error.response?.data?.errors?.join(". ") ||
        error.response?.data?.message ||
        error.message
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(item) {
    if (!window.confirm(
      `Ngừng hoạt động cơ sở "${item.ten}"?`
    )) return;

    try {
      await deleteCoSoDichVu(item.id);
      await loadData();
      setMessage("Đã chuyển cơ sở sang ngừng hoạt động.");
    } catch (error) {
      setMessage(
        error.response?.data?.message || error.message
      );
    }
  }

  return (
    <div className="p8-page">
      <div className="p8-heading">
        <div>
          <h2>Quản lý cơ sở dịch vụ</h2>
          <p>Nhà hàng, lưu trú, y tế và các dịch vụ du lịch</p>
        </div>
        <button className="p8-primary" onClick={openCreate}>
          <Plus size={17} /> Thêm cơ sở
        </button>
      </div>

      {message && (
        <div className="p8-message" role="status">
          {message}
          <button onClick={() => setMessage("")}>×</button>
        </div>
      )}

      <div className="p8-panel">
        <div className="p8-toolbar">
          <div className="p8-search">
            <Search size={18} />
            <input
              placeholder="Tìm mã, tên hoặc địa chỉ..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            value={categoryId}
            onChange={e => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả loại dịch vụ</option>
            {categories.map(c => (
              <option value={c.id} key={c.id}>
                {c.ten}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={e => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusText).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>

          <button className="p8-secondary" onClick={loadData}>
            <RefreshCw size={17} />
          </button>
        </div>

        <div className="p8-table-wrap">
          <table className="p8-table">
            <thead>
              <tr>
                <th>Mã</th><th>Tên cơ sở</th>
                <th>Loại dịch vụ</th><th>Trạng thái</th>
                <th>Địa chỉ</th><th>Tọa độ</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7">Đang tải...</td></tr>
              ) : visible.length === 0 ? (
                <tr><td colSpan="7">Không có dữ liệu.</td></tr>
              ) : visible.map(item => (
                <tr key={item.id}>
                  <td><strong>{item.ma}</strong></td>
                  <td><Building2 size={15} /> {item.ten}</td>
                  <td>
                    {(item.loai_dich_vu || [])
                      .map(x => x.ten).join(", ") || "Chưa phân loại"}
                  </td>
                  <td>{statusText[item.trang_thai]}</td>
                  <td>{item.dia_chi || "Chưa cập nhật"}</td>
                  <td>
                    {Number(item.latitude).toFixed(5)},{" "}
                    {Number(item.longitude).toFixed(5)}
                  </td>
                  <td>
                    <button
                      className="p8-secondary"
                      onClick={() => openEdit(item.id)}
                      title="Sửa"
                    >
                      <Pencil size={15} />
                    </button>{" "}
                    <button
                      className="p8-secondary"
                      disabled={item.trang_thai === "ngung_hoat_dong"}
                      onClick={() => handleDeactivate(item)}
                    >
                      Ngừng
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p8-pagination">
          <span>{filtered.length} kết quả</span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            {[5, 10, 20].map(n => (
              <option key={n} value={n}>{n} / trang</option>
            ))}
          </select>
          <button
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Trước
          </button>
          <span>{currentPage}/{totalPages}</span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setPage(currentPage + 1)}
          >
            Sau
          </button>
        </div>
      </div>

      {formOpen && (
        <div className="p8-overlay">
          <form className="p8-modal" onSubmit={handleSave}>
            <div className="p8-modal-header">
              <h3>
                {editingId ? "Sửa cơ sở dịch vụ" : "Thêm cơ sở dịch vụ"}
              </h3>
              <button
                type="button"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p8-form-body">
              <div className="p8-form-grid">
                {[
                  ["ma", "Mã cơ sở *"],
                  ["ten", "Tên cơ sở *"],
                  ["dia_chi", "Địa chỉ"],
                  ["so_dien_thoai", "Điện thoại"],
                  ["nguon_du_lieu", "Nguồn dữ liệu *"],
                  ["longitude", "Kinh độ *"],
                  ["latitude", "Vĩ độ *"]
                ].map(([name, label]) => (
                  <label key={name}>
                    {label}
                    <input
                      value={form[name]}
                      type={
                        ["longitude", "latitude"].includes(name)
                          ? "number" : "text"
                      }
                      step="any"
                      onChange={e =>
                        changeField(name, e.target.value)
                      }
                      required={[
                        "ma", "ten", "nguon_du_lieu",
                        "longitude", "latitude"
                      ].includes(name)}
                    />
                  </label>
                ))}

                <label>
                  Trạng thái
                  <select
                    value={form.trang_thai}
                    onChange={e =>
                      changeField("trang_thai", e.target.value)
                    }
                  >
                    {Object.entries(statusText).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Ngày kiểm chứng
                  <input
                    type="date"
                    value={form.ngay_kiem_chung}
                    onChange={e =>
                      changeField("ngay_kiem_chung", e.target.value)
                    }
                  />
                </label>

                <label>
                  Giờ mở cửa
                  <input
                    type="time"
                    value={form.gio_mo}
                    onChange={e =>
                      changeField("gio_mo", e.target.value)
                    }
                  />
                </label>

                <label>
                  Giờ đóng cửa
                  <input
                    type="time"
                    value={form.gio_dong}
                    onChange={e =>
                      changeField("gio_dong", e.target.value)
                    }
                  />
                </label>
              </div>

              <h4>Loại dịch vụ</h4>
              <div className="p8-check-grid">
                {categories.filter(c =>
                  c.is_active ||
                  form.loai_dich_vu_ids.includes(Number(c.id))
                ).map(c => (
                  <label key={c.id}>
                    <input
                      type="checkbox"
                      checked={form.loai_dich_vu_ids.includes(
                        Number(c.id)
                      )}
                      onChange={() => toggleType(c.id)}
                    />
                    {c.ten}
                  </label>
                ))}
              </div>
            </div>

            <div className="p8-modal-footer">
              <button
                className="p8-secondary"
                type="button"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                Hủy
              </button>
              <button className="p8-primary" disabled={saving}>
                <Save size={17} />
                {saving ? "Đang lưu..." : "Lưu dữ liệu"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
