
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Kiểm tra Backend
export async function checkHealth() {
  const response = await api.get("/health");
  return response.data;
}

// Lấy danh sách, tìm kiếm và lọc điểm du lịch
export async function getDiemDuLich(params = {}) {
  const response = await api.get("/diem-du-lich", {
    params
  });

  return response.data;
}

// Xem chi tiết một điểm du lịch
export async function getDiemDuLichById(id) {
  const response = await api.get(`/diem-du-lich/${id}`);
  return response.data;
}

// Thêm điểm du lịch
export async function createDiemDuLich(data) {
  const response = await api.post(
    "/diem-du-lich",
    data
  );

  return response.data;
}

// Sửa điểm du lịch
export async function updateDiemDuLich(id, data) {
  const response = await api.put(
    `/diem-du-lich/${id}`,
    data
  );

  return response.data;
}

// Xóa điểm du lịch
export async function deleteDiemDuLich(id) {
  const response = await api.delete(
    `/diem-du-lich/${id}`
  );

  return response.data;
}

// Lấy danh mục loại hình du lịch
export async function getLoaiHinh() {
  const response = await api.get("/loai-hinh");
  return response.data;
}

// Đọc thông báo lỗi từ API
export function getApiError(error) {
  const data = error?.response?.data;

  if (Array.isArray(data?.errors) && data.errors.length) {
    return data.errors.join(". ");
  }

  return data?.message ||
    "Không thể thực hiện thao tác. Kiểm tra kết nối Backend.";
}

export default api;
