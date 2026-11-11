
import { useCallback, useEffect, useState } from "react";
import {
  getAllLoaiHinh,
  getLoaiHinh,
  createLoaiHinh,
  updateLoaiHinh,
  deactivateLoaiHinh,
  getApiError
} from "../api/client";

import "../styles/phan8.css";

const emptyForm = {
  ma: "",
  ten: "",
  mo_ta: "",
  is_active: true
};

export default function LoaiHinhPage({ role }) {
  const canManage = role === "admin";

  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const response = await (canManage ? getAllLoaiHinh() : getLoaiHinh());
    setItems(response.data);
  }, [canManage]);

  useEffect(() => {
    load().catch(error => {
      setMessage(getApiError(error));
    });
  }, [load]);

  function edit(item) {
    setEditId(item.id);
    setForm({
      ma: item.ma,
      ten: item.ten,
      mo_ta: item.mo_ta || "",
      is_active: item.is_active
    });
  }

  function reset() {
    setEditId(null);
    setForm({ ...emptyForm });
  }

  async function save(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (editId) {
        await updateLoaiHinh(editId, form);
      } else {
        await createLoaiHinh(form);
      }

      await load();
      reset();
      setMessage("Lưu loại hình du lịch thành công.");
    } catch (error) {
      setMessage(getApiError(error));
    } finally {
      setLoading(false);
    }
  }

  async function deactivate(item) {
    if (!window.confirm(
      `Ngừng sử dụng loại hình "${item.ten}"?`
    )) return;

    try {
      await deactivateLoaiHinh(item.id);
      await load();
      setMessage("Đã ngừng sử dụng loại hình.");
    } catch (error) {
      setMessage(getApiError(error));
    }
  }

  return (
    <div className="p8-page">
      <div className="p8-heading">
        <div>
          <h2>Quản lý loại hình du lịch</h2>
          <p>
            Danh mục di sản theo Cục Di sản văn hóa và các loại hình du lịch đang sử dụng.
          </p>
        </div>
      </div>

      {message && (
        <div className="p8-message" role="status">
          {message}
        </div>
      )}

      <div className={canManage ? "p8-two-columns" : ""}>
        <section className="p8-panel">
          <div className="p8-panel-title">
            <h3>Danh sách loại hình</h3>
            <span>{items.length} danh mục</span>
          </div>

          <div className="p8-table-wrap">
            <table className="p8-table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên loại hình</th>
                  <th>Số điểm</th>
                  <th>Hồ sơ di sản</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>

              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>{item.ma}</td>
                    <td><strong>{item.ten}</strong><p className="p8-note">{item.mo_ta}</p></td>
                    <td>{item.so_diem ?? 0}</td>
                    <td>{item.so_di_san ?? 0}</td>
                    <td>
                      {item.is_active
                        ? "Hoạt động"
                        : "Ngừng sử dụng"}
                    </td>
                    <td>
                      {canManage && (<button
                        className="p8-secondary"
                        onClick={() => edit(item)}
                      >
                        Sửa
                      </button>)}{" "}
                      {canManage && (<button
                        className="p8-secondary"
                        disabled={!item.is_active}
                        onClick={() => deactivate(item)}
                      >
                        Ngừng
                      </button>)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {canManage && (<form
          className="p8-panel p8-inline-form"
          onSubmit={save}
        >
          <h3>
            {editId
              ? "Chỉnh sửa loại hình"
              : "Thêm loại hình du lịch"}
          </h3>

          <label>
            Mã loại hình
            <input
              required
              maxLength={30}
              value={form.ma}
              onChange={event => setForm({
                ...form,
                ma: event.target.value
              })}
            />
          </label>

          <label>
            Tên loại hình
            <input
              required
              maxLength={150}
              value={form.ten}
              onChange={event => setForm({
                ...form,
                ten: event.target.value
              })}
            />
          </label>

          <label>
            Mô tả
            <textarea
              rows={3}
              value={form.mo_ta}
              onChange={event => setForm({
                ...form,
                mo_ta: event.target.value
              })}
            />
          </label>

          <label className="p8-check-label">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={event => setForm({
                ...form,
                is_active: event.target.checked
              })}
            />
            Đang hoạt động
          </label>

          <div className="p8-actions">
            <button
              type="button"
              className="p8-secondary"
              onClick={reset}
            >
              Làm mới
            </button>

            <button
              type="submit"
              className="p8-primary"
              disabled={loading}
            >
              {loading ? "Đang lưu..." : "Lưu dữ liệu"}
            </button>
          </div>
        </form>)}
      </div>
    </div>
  );
}
