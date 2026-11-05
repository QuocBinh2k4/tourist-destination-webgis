
import { useEffect, useState } from "react";
import CoordinatePicker from "./CoordinatePicker";

import {
  X,
  Save,
  MapPin,
  LoaderCircle
} from "lucide-react";

// Giá trị mặc định của form
const initialForm = {
  ma: "",
  ten: "",
  dia_chi: "",
  mo_ta: "",
  gia_ve_vnd: "",
  so_dien_thoai: "",
  website: "",
  trang_thai: "dang_hoat_dong",
  nguon_du_lieu: "",
  ngay_kiem_chung: "",
  gio_mo: "",
  gio_dong: "",
  longitude: "",
  latitude: "",
  loai_hinh_ids: []
};

// Chuyển dữ liệu API thành dữ liệu form
function toFormData(data) {
  if (!data) return { ...initialForm };

  const hours = data.gio_mo_cua || {};

  return {
    ma: data.ma || "",
    ten: data.ten || "",
    dia_chi: data.dia_chi || "",
    mo_ta: data.mo_ta || "",
    gia_ve_vnd: data.gia_ve_vnd ?? "",
    so_dien_thoai: data.so_dien_thoai || "",
    website: data.website || "",
    trang_thai: data.trang_thai || "dang_hoat_dong",
    nguon_du_lieu: data.nguon_du_lieu || "",
    ngay_kiem_chung: data.ngay_kiem_chung
      ? String(data.ngay_kiem_chung).slice(0, 10)
      : "",
    gio_mo: hours.mo || "",
    gio_dong: hours.dong || "",
    longitude: data.longitude ?? "",
    latitude: data.latitude ?? "",
    loai_hinh_ids: (data.loai_hinh_ids || []).map(Number)
  };
}

export default function DiemDuLichForm({
  open,
  mode,
  initialData,
  categories,
  onClose,
  onSubmit,
  saving,
  submitError
}) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [pickerOpen, setPickerOpen] = useState(false);

  // Đồng bộ dữ liệu khi mở form hoặc thay đổi đối tượng
  useEffect(() => {
    if (open) {
      setForm(toFormData(initialData));
      setErrors({});
      setPickerOpen(false);
    }
  }, [open, initialData]);

  
    function handleMapPosition(position) {
    setForm((prev) => ({
        ...prev,
        longitude: position.longitude.toFixed(6),
        latitude: position.latitude.toFixed(6)
    }));

    setErrors((prev) => ({
        ...prev,
        longitude: "",
        latitude: ""
    }));

    setPickerOpen(false);
    }

  if (!open) return null;

  const isEdit = mode === "edit";

  // Cập nhật một trường trong form
  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: ""
    }));
  }

  // Chọn hoặc bỏ chọn loại hình du lịch
  function toggleCategory(id) {
    const categoryId = Number(id);

    setForm((prev) => ({
      ...prev,
      loai_hinh_ids: prev.loai_hinh_ids.includes(categoryId)
        ? prev.loai_hinh_ids.filter((x) => x !== categoryId)
        : [...prev.loai_hinh_ids, categoryId]
    }));
  }

  // Kiểm tra dữ liệu trước khi gửi
  function validate() {
    const nextErrors = {};

    if (!form.ma.trim()) {
      nextErrors.ma = "Vui lòng nhập mã điểm du lịch";
    } else if (form.ma.trim().length > 30) {
      nextErrors.ma = "Mã không được quá 30 ký tự";
    }

    if (!form.ten.trim()) {
      nextErrors.ten = "Vui lòng nhập tên điểm du lịch";
    } else if (form.ten.trim().length > 250) {
      nextErrors.ten = "Tên không được quá 250 ký tự";
    }

    if (!form.nguon_du_lieu.trim()) {
      nextErrors.nguon_du_lieu = "Vui lòng nhập nguồn dữ liệu";
    }

    const lon = Number(form.longitude);
    const lat = Number(form.latitude);

    if (
      form.longitude === "" ||
      !Number.isFinite(lon) ||
      lon < -180 || lon > 180
    ) {
      nextErrors.longitude = "Kinh độ phải từ -180 đến 180";
    }

    if (
      form.latitude === "" ||
      !Number.isFinite(lat) ||
      lat < -90 || lat > 90
    ) {
      nextErrors.latitude = "Vĩ độ phải từ -90 đến 90";
    }

    if (
      form.gia_ve_vnd !== "" &&
      (
        !Number.isSafeInteger(Number(form.gia_ve_vnd)) ||
        Number(form.gia_ve_vnd) < 0 ||
        Number(form.gia_ve_vnd) > 999999999999
      )
    ) {
      nextErrors.gia_ve_vnd = "Giá vé không hợp lệ";
    }

    if (
      (form.gio_mo && !form.gio_dong) ||
      (!form.gio_mo && form.gio_dong)
    ) {
      nextErrors.gio_mo = "Nhập đủ giờ mở và giờ đóng";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!validate()) return;

    const gio_mo_cua = {};

    if (form.gio_mo && form.gio_dong) {
      gio_mo_cua.mo = form.gio_mo;
      gio_mo_cua.dong = form.gio_dong;
    }

    const payload = {
      ma: form.ma.trim(),
      ten: form.ten.trim(),
      dia_chi: form.dia_chi.trim(),
      mo_ta: form.mo_ta.trim(),
      gia_ve_vnd: form.gia_ve_vnd === ""
        ? null
        : Number(form.gia_ve_vnd),
      so_dien_thoai: form.so_dien_thoai.trim(),
      website: form.website.trim(),
      trang_thai: form.trang_thai,
      nguon_du_lieu: form.nguon_du_lieu.trim(),
      ngay_kiem_chung: form.ngay_kiem_chung || null,
      gio_mo_cua,
      longitude: Number(form.longitude),
      latitude: Number(form.latitude),
      loai_hinh_ids: form.loai_hinh_ids
    };

    await onSubmit(payload);
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="form-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="destination-form-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="form-modal-header">
          <div>
            <h2 id="destination-form-title">
              {isEdit
                ? "Chỉnh sửa điểm du lịch"
                : "Thêm điểm du lịch mới"}
            </h2>

            <p>
              Nhập thông tin thuộc tính và vị trí không gian
            </p>
          </div>

          <button
            type="button"
            className="dm-icon-button"
            onClick={onClose}
            aria-label="Đóng form"
            disabled={saving}
          >
            <X size={21} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-modal-body">
            <h3 className="form-section-title">
              01. Thông tin chung
            </h3>

            <div className="dm-form-grid">
              <div className="dm-field">
                <label htmlFor="ma">
                  Mã điểm du lịch <span>*</span>
                </label>

                <input
                  id="ma"
                  name="ma"
                  value={form.ma}
                  onChange={handleChange}
                  placeholder="Ví dụ: DL004"
                  maxLength={30}
                />

                {errors.ma && (
                  <small className="field-error">{errors.ma}</small>
                )}
              </div>

              <div className="dm-field">
                <label htmlFor="ten">
                  Tên điểm du lịch <span>*</span>
                </label>

                <input
                  id="ten"
                  name="ten"
                  value={form.ten}
                  onChange={handleChange}
                  placeholder="Nhập tên điểm du lịch"
                  maxLength={250}
                />

                {errors.ten && (
                  <small className="field-error">{errors.ten}</small>
                )}
              </div>

              <div className="dm-field dm-full">
                <label htmlFor="dia_chi">Địa chỉ</label>

                <input
                  id="dia_chi"
                  name="dia_chi"
                  value={form.dia_chi}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ"
                />
              </div>

              <div className="dm-field dm-full">
                <label htmlFor="mo_ta">Mô tả</label>

                <textarea
                  id="mo_ta"
                  name="mo_ta"
                  rows={3}
                  value={form.mo_ta}
                  onChange={handleChange}
                  placeholder="Mô tả điểm du lịch..."
                />
              </div>

              <div className="dm-field">
                <label htmlFor="gia_ve_vnd">
                  Giá vé (VNĐ)
                </label>

                <input
                  id="gia_ve_vnd"
                  name="gia_ve_vnd"
                  type="number"
                  min="0"
                  step="1"
                  value={form.gia_ve_vnd}
                  onChange={handleChange}
                  placeholder="0"
                />

                {errors.gia_ve_vnd && (
                  <small className="field-error">
                    {errors.gia_ve_vnd}
                  </small>
                )}
              </div>

              <div className="dm-field">
                <label htmlFor="trang_thai">
                  Trạng thái
                </label>

                <select
                  id="trang_thai"
                  name="trang_thai"
                  value={form.trang_thai}
                  onChange={handleChange}
                >
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
              </div>

              <div className="dm-field">
                <label htmlFor="so_dien_thoai">
                  Số điện thoại
                </label>

                <input
                  id="so_dien_thoai"
                  name="so_dien_thoai"
                  value={form.so_dien_thoai}
                  onChange={handleChange}
                  maxLength={25}
                />
              </div>

              <div className="dm-field">
                <label htmlFor="website">Website</label>

                <input
                  id="website"
                  name="website"
                  type="url"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <h3 className="form-section-title">
              02. Loại hình và thời gian
            </h3>

            <div className="dm-field">
              <label>Loại hình du lịch</label>

              <div className="category-checkbox-grid">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="category-checkbox"
                  >
                    <input
                      type="checkbox"
                      checked={form.loai_hinh_ids.includes(
                        Number(category.id)
                      )}
                      onChange={() => toggleCategory(category.id)}
                    />
                    <span>{category.ten}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="dm-form-grid">
              <div className="dm-field">
                <label htmlFor="gio_mo">Giờ mở cửa</label>
                <input
                  id="gio_mo"
                  type="time"
                  name="gio_mo"
                  value={form.gio_mo}
                  onChange={handleChange}
                />
                {errors.gio_mo && (
                  <small className="field-error">
                    {errors.gio_mo}
                  </small>
                )}
              </div>

              <div className="dm-field">
                <label htmlFor="gio_dong">Giờ đóng cửa</label>
                <input
                  id="gio_dong"
                  type="time"
                  name="gio_dong"
                  value={form.gio_dong}
                  onChange={handleChange}
                />
              </div>

              <div className="dm-field">
                <label htmlFor="nguon_du_lieu">
                  Nguồn dữ liệu <span>*</span>
                </label>

                <input
                  id="nguon_du_lieu"
                  name="nguon_du_lieu"
                  value={form.nguon_du_lieu}
                  onChange={handleChange}
                  placeholder="Khảo sát thực địa / Dữ liệu mẫu..."
                />

                {errors.nguon_du_lieu && (
                  <small className="field-error">
                    {errors.nguon_du_lieu}
                  </small>
                )}
              </div>

              <div className="dm-field">
                <label htmlFor="ngay_kiem_chung">
                  Ngày kiểm chứng
                </label>

                <input
                  id="ngay_kiem_chung"
                  name="ngay_kiem_chung"
                  type="date"
                  value={form.ngay_kiem_chung}
                  onChange={handleChange}
                />
              </div>
            </div>

            <h3 className="form-section-title">
              03. Dữ liệu không gian
            </h3>

            <div className="coordinate-info">
              <MapPin size={19} />
              <span>
                Hệ tọa độ WGS84 (EPSG:4326).
                Nhập kinh độ trước, vĩ độ sau.
              </span>
            </div>

            
            <button
                type="button"
                className="dm-btn dm-btn-secondary pick-coordinate-button"
                onClick={() => setPickerOpen(true)}
            >
                <MapPin size={18} />
                Chọn vị trí trực tiếp trên bản đồ
            </button>


            <div className="dm-form-grid">
              <div className="dm-field">
                <label htmlFor="longitude">
                  Kinh độ (Longitude) <span>*</span>
                </label>

                <input
                  id="longitude"
                  name="longitude"
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={handleChange}
                  placeholder="105.852"
                />

                {errors.longitude && (
                  <small className="field-error">
                    {errors.longitude}
                  </small>
                )}
              </div>

              <div className="dm-field">
                <label htmlFor="latitude">
                  Vĩ độ (Latitude) <span>*</span>
                </label>

                <input
                  id="latitude"
                  name="latitude"
                  type="number"
                  step="any"
                  value={form.latitude}
                  onChange={handleChange}
                  placeholder="21.029"
                />

                {errors.latitude && (
                  <small className="field-error">
                    {errors.latitude}
                  </small>
                )}
              </div>
            </div>
          </div>

            {submitError && (
            <div className="dm-alert error" role="alert">
                {submitError}
            </div>
            )}

          <div className="form-modal-footer">
            <button
              type="button"
              className="dm-btn dm-btn-secondary"
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </button>

            <button
              type="submit"
              className="dm-btn dm-btn-primary"
              disabled={saving}
            >
              {saving
                ? <LoaderCircle className="dm-spinning" size={18} />
                : <Save size={18} />}
              {saving
                ? "Đang lưu..."
                : isEdit
                  ? "Lưu thay đổi"
                  : "Thêm điểm du lịch"}
            </button>
          </div>
        </form>
      </div>
      {pickerOpen && (
        <CoordinatePicker
            initialLatitude={form.latitude}
            initialLongitude={form.longitude}
            onConfirm={handleMapPosition}
            onClose={() => setPickerOpen(false)}
        />
        )}
    </div>
  );
}
