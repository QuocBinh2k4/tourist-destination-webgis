
import axios from "axios";

// Tạo Axios Client dùng chung
const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json"
  }
});

// Lấy danh sách điểm du lịch
export async function getDiemDuLich(params = {}) {
  const response = await api.get(
    "/diem-du-lich",
    { params }
  );

  return response.data;
}

// Lấy danh sách loại hình du lịch
export async function getLoaiHinh() {
  const response = await api.get("/loai-hinh");

  return response.data;
}

// Kiểm tra kết nối Backend và PostgreSQL
export async function checkHealth() {
  const response = await api.get("/health");

  return response.data;
}

export default api;
