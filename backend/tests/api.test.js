
const test = require("node:test");
const assert = require("node:assert/strict");

const BASE_URL = "http://127.0.0.1:5000";

// Kiểm tra kết nối Backend
test("API Health", async () => {
  const response = await fetch(`${BASE_URL}/api/health`);

  assert.equal(response.status, 200);

  const data = await response.json();
  assert.equal(data.success, true);
});

// Kiểm tra danh sách điểm du lịch
test("API Diem du lich", async () => {
  const response = await fetch(
    `${BASE_URL}/api/diem-du-lich`
  );

  assert.equal(response.status, 200);

  const data = await response.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
});

// Kiểm tra danh sách cơ sở dịch vụ
test("API Co so dich vu", async () => {
  const response = await fetch(
    `${BASE_URL}/api/co-so-dich-vu`
  );

  assert.equal(response.status, 200);

  const data = await response.json();
  assert.equal(data.success, true);
  assert.ok(Array.isArray(data.data));
});

// Kiểm tra API thống kê
test("API Thong ke", async () => {
  const response = await fetch(
    `${BASE_URL}/api/stats/dashboard`
  );

  assert.equal(response.status, 200);

  const data = await response.json();

  assert.equal(data.success, true);
  assert.ok(data.summary);
});

// Kiểm tra GeoJSON
test("API Map GeoJSON", async () => {
  const response = await fetch(
    `${BASE_URL}/api/map/diem-du-lich`
  );

  assert.equal(response.status, 200);

  const data = await response.json();
  assert.equal(data.type, "FeatureCollection");
  assert.ok(Array.isArray(data.features));
});

// Kiểm tra API không tồn tại
test("API khong ton tai", async () => {
  const response = await fetch(
    `${BASE_URL}/api/khong-ton-tai`
  );

  assert.equal(response.status, 404);
});
