
import { useEffect, useState } from "react";
import { Plus, Pencil, Save } from "lucide-react";

import {
  getLoaiDichVu,
  createLoaiDichVu,
  updateLoaiDichVu,
  deleteLoaiDichVu
} from "../api/client";

import "../styles/phan8.css";

const emptyForm = {
  ma: "",
  ten: "",
  mo_ta: "",
  is_active: true
};

export default function LoaiDichVuPage() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const response = await getLoaiDichVu();
    if (!response.success) {
      throw new Error("Không tải được danh mục");
    }
    setItems(response.data);
  }

  useEffect(() => {
    load().catch(error => setMessage(error.message));
  }, []);

  function edit(item) {
    setEditId(item.id);
    setForm({
      ma: item.ma,
      ten: item.ten,
      mo_ta: item.mo_ta || "",
      is_active: item.is_active
    });
    setMessage("");
  }

  function reset() {
    setEditId(null);
    setForm({ ...emptyForm });
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      if (editId) {
        await updateLoaiDichVu(editId, form);
      } else {
        await createLoaiDichVu(form);
      }

      await load();
      reset();
      setMessage("Lưu danh mục thành công.");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
        error.response?.data?.errors?.join(". ") ||
        error.message
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(item) {
    if (!window.confirm(
      `Ngừng sử dụng loại dịch vụ "${item.ten}"?`
    )) return;

    try {
      await deleteLoaiDichVu(item.id);
      await load();
      setMessage("Đã ngừng sử dụng danh mục.");
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
          <h2>Quản lý loại dịch vụ</h2>
          <p>Danh mục phân loại các cơ sở cung cấp dịch vụ</p>
        </div>
      </div>

      {message && <div className="p8-message">{message}</div>}

      <div className="p8-two-columns">
        <div className="p8-panel">
          <div className="p8-panel-title">
            <h3>Danh sách loại dịch vụ</h3>
            <span>{items.length} danh mục</span>
          </div>

          <div className="p8-table-wrap">
            <table className="p8-table">
              <thead>
                <tr>
                  <th>Mã</th><th>Tên</th><th>Số cơ sở</th>
                  <th>Trạng thái</th><th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id}>
                    <td>{item.ma}</td>
                    <td><strong>{item.ten}</strong></td>
                    <td>{item.so_co_so}</td>
                    <td>
                      {item.is_active ? "Hoạt động" : "Ngừng"}
                    </td>
                    <td>
                      <button
                        className="p8-secondary"
                        onClick={() => edit(item)}
                      >
                        <Pencil size={15} />
                      </button>{" "}
                      <button
                        className="p8-secondary"
                        disabled={!item.is_active}
                        onClick={() => deactivate(item)}
                      >
                        Ngừng
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <form className="p8-panel p8-inline-form" onSubmit={save}>
          <h3>
            {editId ? "Chỉnh sửa loại dịch vụ" : "Thêm loại dịch vụ"}
          </h3>

          <label>
            Mã loại dịch vụ
            <input
              required
              maxLength={30}
              value={form.ma}
              onChange={e =>
                setForm({ ...form, ma: e.target.value })
              }
            />
          </label>

          <label>
            Tên loại dịch vụ
            <input
              required
              maxLength={150}
              value={form.ten}
              onChange={e =>
                setForm({ ...form, ten: e.target.value })
              }
            />
          </label>

          <label>
            Mô tả
            <textarea
              rows={3}
              value={form.mo_ta}
              onChange={e =>
                setForm({ ...form, mo_ta: e.target.value })
              }
            />
          </label>

          <label className="p8-check-label">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e =>
                setForm({ ...form, is_active: e.target.checked })
              }
            />
            Đang hoạt động
          </label>

          <div className="p8-actions">
            <button
              className="p8-secondary"
              type="button"
              onClick={reset}
            >
              <Plus size={16} /> Làm mới
            </button>

            <button className="p8-primary" disabled={saving}>
              <Save size={16} />
              {saving ? "Đang lưu..." : "Lưu danh mục"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
