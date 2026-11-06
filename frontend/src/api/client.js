
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


export async function getMapDiemDuLich() {
  const response = await api.get(
    "/map/diem-du-lich"
  );

  return response.data;
}

export async function getMapCoSoDichVu() {
  const response = await api.get(
    "/map/co-so-dich-vu"
  );

  return response.data;
}

export default api;


// Tính khoảng cách giữa hai điểm du lịch
export async function getDistance(fromId, toId) {
  const response = await api.get("/analysis/distance", {
    params: { fromId, toId }
  });

  return response.data;
}

// Tìm N điểm du lịch gần nhất
export async function getNearest(pointId, limit = 5) {
  const response = await api.get("/analysis/nearest", {
    params: { pointId, limit }
  });

  return response.data;
}

// Tìm điểm du lịch trong bán kính
export async function getRadiusSearch(
  lon, lat, radius, limit = 100
) {
  const response = await api.get("/analysis/radius", {
    params: { lon, lat, radius, limit }
  });

  return response.data;
}

// Tạo Buffer quanh một điểm du lịch
export async function getBuffer(pointId, radius) {
  const response = await api.get("/analysis/buffer", {
    params: { pointId, radius }
  });

  return response.data;
}

// Đánh giá khả năng tiếp cận dịch vụ
export async function getAccessibility(pointId = null) {
  const response = await api.get("/analysis/access", {
    params: pointId ? { pointId } : {}
  });

  return response.data;
}


// Quản lý cơ sở dịch vụ
export async function getCoSoDichVu(params = {}) {
  const res = await api.get("/co-so-dich-vu", { params });
  return res.data;
}

export async function getCoSoDichVuById(id) {
  const res = await api.get(`/co-so-dich-vu/${id}`);
  return res.data;
}

export async function createCoSoDichVu(data) {
  const res = await api.post("/co-so-dich-vu", data);
  return res.data;
}

export async function updateCoSoDichVu(id, data) {
  const res = await api.put(`/co-so-dich-vu/${id}`, data);
  return res.data;
}

export async function deleteCoSoDichVu(id) {
  const res = await api.delete(`/co-so-dich-vu/${id}`);
  return res.data;
}

// Quản lý loại dịch vụ
export async function getLoaiDichVu() {
  const res = await api.get("/loai-dich-vu");
  return res.data;
}

export async function createLoaiDichVu(data) {
  const res = await api.post("/loai-dich-vu", data);
  return res.data;
}

export async function updateLoaiDichVu(id, data) {
  const res = await api.put(`/loai-dich-vu/${id}`, data);
  return res.data;
}

export async function deleteLoaiDichVu(id) {
  const res = await api.delete(`/loai-dich-vu/${id}`);
  return res.data;
}

// Thống kê
export async function getDashboardStats() {
  const res = await api.get("/stats/dashboard");
  return res.data;
}

// Phân tích khu vực thiếu dịch vụ
export async function getMissingServicePoints(categoryId) {
  const res = await api.get("/gaps/points", {
    params: categoryId ? { categoryId } : {}
  });
  return res.data;
}

export async function getGapRegions() {
  const res = await api.get("/gaps/regions");
  return res.data;
}

export async function getGapGrid(
  regionId, categoryId, cellSize
) {
  const res = await api.get("/gaps/grid", {
    params: { regionId, categoryId, cellSize }
  });
  return res.data;
}
