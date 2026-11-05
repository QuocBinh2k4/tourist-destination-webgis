
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  MapPin,
  FilterX,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import {
  getDiemDuLich,
  getDiemDuLichById,
  getLoaiHinh,
  createDiemDuLich,
  updateDiemDuLich,
  deleteDiemDuLich,
  getApiError
} from "../api/client";

import DiemDuLichForm from "../components/DiemDuLichForm";
import ConfirmDialog from "../components/ConfirmDialog";

import "../styles/diemDuLich.css";

const PAGE_SIZES = [5, 10, 20];

function money(value) {
  if (value === null || value === undefined) {
    return "Chưa cập nhật";
  }

  return new Intl.NumberFormat("vi-VN").format(
    Number(value)
  ) + " đ";
}

const statusNames = {
  dang_hoat_dong: "Đang hoạt động",
  tam_dong: "Tạm đóng",
  ngung_hoat_dong: "Ngừng hoạt động"
};

export default function DiemDuLichPage({ onDataChanged }) {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [categoryId, setCategoryId] = useState("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const [editingItem, setEditingItem] = useState(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const [deleteItem, setDeleteItem] = useState(null);

  const [submitError, setSubmitError] = useState("");

  // Lấy dữ liệu từ API
  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [diemResult, loaiResult] = await Promise.all([
        getDiemDuLich(),
        getLoaiHinh()
      ]);

      if (
        !diemResult.success ||
        !loaiResult.success ||
        !Array.isArray(diemResult.data) ||
        !Array.isArray(loaiResult.data)
      ) {
        throw new Error("Phản hồi API không hợp lệ");
      }

      setItems(diemResult.data);
      setCategories(loaiResult.data);
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiError(error)
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Tìm kiếm và lọc trên danh sách hiện tại
  const filteredItems = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");

    return items.filter((item) => {
      const matchesSearch = !keyword || [
        item.ma,
        item.ten,
        item.dia_chi
      ].some((value) =>
        String(value || "")
          .toLocaleLowerCase("vi")
          .includes(keyword)
      );

      const matchesStatus =
        !status || item.trang_thai === status;

      const matchesCategory =
        !categoryId ||
        (item.loai_hinh || []).some(
          (c) => String(c.id) === String(categoryId)
        );

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory
      );
    });
  }, [items, search, status, categoryId]);

  // Tính tổng số trang
  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / pageSize)
  );

  const safePage = Math.min(page, totalPages);

  // Danh sách hiển thị trên trang hiện tại
  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage, pageSize]);

  function changeSearch(value) {
    setSearch(value);
    setPage(1);
  }

  function changeStatus(value) {
    setStatus(value);
    setPage(1);
  }

  function changeCategory(value) {
    setCategoryId(value);
    setPage(1);
  }

  function clearFilters() {
    setSearch("");
    setStatus("");
    setCategoryId("");
    setPage(1);
  }

  // Mở form thêm
  function openCreate() {
    setSubmitError("");
    setFormMode("create");
    setEditingItem(null);
    setFormOpen(true);
    setMessage(null);
  }

  // Lấy dữ liệu chi tiết trước khi sửa
  async function openEdit(item) {
    setSubmitError("");
    setLoadingEdit(true);
    setMessage(null);

    try {
      const result = await getDiemDuLichById(item.id);

      if (!result.success) {
        throw new Error("Không tải được chi tiết");
      }

      setEditingItem(result.data);
      setFormMode("edit");
      setFormOpen(true);
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiError(error)
      });
    } finally {
      setLoadingEdit(false);
    }
  }

  // Lưu dữ liệu từ form
  async function handleSave(payload) {
    setSaving(true);

    try {
      if (formMode === "edit") {
        await updateDiemDuLich(
          editingItem.id,
          payload
        );
      } else {
        await createDiemDuLich(payload);
      }

      const wasEdit = formMode === "edit";

      setFormOpen(false);
      setEditingItem(null);

      setMessage({
        type: "success",
        text: wasEdit
          ? "Cập nhật điểm du lịch thành công."
          : "Thêm điểm du lịch thành công."
      });

      await loadData();

      // Cập nhật dữ liệu của Dashboard
      onDataChanged?.();
    } catch (error) {
        setSubmitError(getApiError(error));
    } finally {
        setSaving(false);
    }
  }

  // Xác nhận xóa
  async function handleDelete() {
    if (!deleteItem) return;

    setDeleting(true);

    try {
      await deleteDiemDuLich(deleteItem.id);

      setDeleteItem(null);

      setMessage({
        type: "success",
        text: "Đã xóa điểm du lịch thành công."
      });

      await loadData();
      onDataChanged?.();
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiError(error)
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="destination-page">
      <div className="dm-page-heading">
        <div>
          <h2>Danh sách điểm du lịch</h2>
          <p>
            Quản lý dữ liệu thuộc tính và vị trí
            không gian trong PostgreSQL/PostGIS.
          </p>
        </div>

        <button
          className="dm-btn dm-btn-primary"
          onClick={openCreate}
        >
          <Plus size={18} />
          Thêm điểm du lịch
        </button>
      </div>

      {message && (
        <div
          className={`dm-alert ${message.type}`}
          role="status"
        >
          <span>{message.text}</span>

          <button
            onClick={() => setMessage(null)}
            aria-label="Đóng thông báo"
          >
            ×
          </button>
        </div>
      )}

      <section className="dm-panel">
        <div className="dm-toolbar">
          <div className="dm-search">
            <Search size={18} />

            <input
              type="search"
              value={search}
              onChange={(event) =>
                changeSearch(event.target.value)
              }
              placeholder="Tìm theo mã, tên, địa chỉ..."
              aria-label="Tìm kiếm điểm du lịch"
            />
          </div>

          <select
            aria-label="Lọc loại hình"
            value={categoryId}
            onChange={(event) =>
              changeCategory(event.target.value)
            }
          >
            <option value="">Tất cả loại hình</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.ten}
              </option>
            ))}
          </select>

          <select
            aria-label="Lọc trạng thái"
            value={status}
            onChange={(event) =>
              changeStatus(event.target.value)
            }
          >
            <option value="">Tất cả trạng thái</option>
            <option value="dang_hoat_dong">
              Đang hoạt động
            </option>
            <option value="tam_dong">
              Tạm đóng
            </option>
            <option value="ngung_hoat_dong">
              Ngừng hoạt động
            </option>
          </select>

          <button
            className="dm-btn dm-btn-secondary"
            onClick={clearFilters}
            title="Xóa điều kiện lọc"
          >
            <FilterX size={17} />
          </button>

          <button
            className="dm-btn dm-btn-secondary"
            onClick={loadData}
            disabled={loading}
            title="Tải lại danh sách"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        <div className="dm-table-summary">
          <span>
            Tổng số: <strong>{items.length}</strong> điểm du lịch
          </span>

          <span>
            Kết quả lọc: <strong>{filteredItems.length}</strong>
          </span>
        </div>

        <div className="dm-table-wrapper">
          <table className="dm-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Mã điểm</th>
                <th>Tên điểm du lịch</th>
                <th>Loại hình</th>
                <th>Địa chỉ</th>
                <th>Giá vé</th>
                <th>Trạng thái</th>
                <th>Tọa độ</th>
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="dm-empty">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : pagedItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="dm-empty">
                    Không có điểm du lịch phù hợp.
                  </td>
                </tr>
              ) : (
                pagedItems.map((item, index) => (
                  <tr key={item.id}>
                    <td>
                      {(safePage - 1) * pageSize + index + 1}
                    </td>

                    <td>
                      <span className="dm-code">
                        {item.ma}
                      </span>
                    </td>

                    <td>
                      <strong>{item.ten}</strong>
                    </td>

                    <td>
                      <div className="dm-category-tags">
                        {(item.loai_hinh || []).length
                          ? item.loai_hinh.map((c) => (
                              <span key={c.id}>
                                {c.ten}
                              </span>
                            ))
                          : "Chưa phân loại"}
                      </div>
                    </td>

                    <td>
                      {item.dia_chi || "Chưa cập nhật"}
                    </td>

                    <td>{money(item.gia_ve_vnd)}</td>

                    <td>
                      <span
                        className={`dm-status ${item.trang_thai}`}
                      >
                        {statusNames[item.trang_thai] ||
                          item.trang_thai}
                      </span>
                    </td>

                    <td>
                      <div className="dm-coordinate">
                        <MapPin size={14} />
                        {Number(item.latitude).toFixed(5)},
                        {" "}
                        {Number(item.longitude).toFixed(5)}
                      </div>
                    </td>

                    <td>
                      <div className="dm-row-actions">
                        <button
                          title="Chỉnh sửa"
                          aria-label={`Sửa ${item.ten}`}
                          className="dm-action-edit"
                          onClick={() => openEdit(item)}
                          disabled={loadingEdit}
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          title="Xóa"
                          aria-label={`Xóa ${item.ten}`}
                          className="dm-action-delete"
                          onClick={() => {
                            setDeleteItem(item);
                            setMessage(null);
                          }}
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="dm-pagination">
          <div className="dm-page-size">
            <span>Số bản ghi mỗi trang:</span>

            <select
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPage(1);
              }}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="dm-page-controls">
            <span>
              Trang {safePage} / {totalPages}
            </span>

            <button
              disabled={safePage <= 1}
              onClick={() => setPage(safePage - 1)}
              aria-label="Trang trước"
            >
              <ChevronLeft size={19} />
            </button>

            <button
              disabled={safePage >= totalPages}
              onClick={() => setPage(safePage + 1)}
              aria-label="Trang sau"
            >
              <ChevronRight size={19} />
            </button>
          </div>
        </div>
      </section>

      <DiemDuLichForm
        open={formOpen}
        mode={formMode}
        initialData={editingItem}
        categories={categories}
        saving={saving}
        submitError={submitError}
        onClose={() => {
          if (!saving) setFormOpen(false);
        }}
        onSubmit={handleSave}
      />

      <ConfirmDialog
        open={Boolean(deleteItem)}
        item={deleteItem}
        deleting={deleting}
        onCancel={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
