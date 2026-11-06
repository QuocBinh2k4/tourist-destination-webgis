
import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  GeoJSON,
  useMap
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  getLoaiDichVu,
  getMissingServicePoints,
  getGapRegions,
  getGapGrid
} from "../api/client";

import "../styles/phan8.css";

// Tự điều chỉnh bản đồ theo kết quả
function FitResult({ geojson }) {
  const map = useMap();

  useEffect(() => {
    if (!geojson?.features?.length) return;

    const layer = L.geoJSON(geojson);
    const bounds = layer.getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [35, 35],
        maxZoom: 14
      });
    }
  }, [map, geojson]);

  return null;
}

function GapMap({ geojson, mode }) {
  return (
    <MapContainer
      center={[21.03, 105.85]}
      zoom={11}
      className="p8-gap-map"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />

      <FitResult geojson={geojson} />

      {geojson && (
        <GeoJSON
          key={JSON.stringify(geojson)}
          data={geojson}
          style={{
            color: "#dc2626",
            weight: 1.5,
            fillColor: "#ef4444",
            fillOpacity: 0.35
          }}
          pointToLayer={(feature, latlng) =>
            L.circleMarker(latlng, {
              radius: 9,
              color: "white",
              weight: 2,
              fillColor: "#dc2626",
              fillOpacity: 0.95
            })
          }
          onEachFeature={(feature, layer) => {
            const p = feature.properties || {};

            const container = document.createElement("div");
            const title = document.createElement("strong");

            title.textContent = mode === "points"
              ? p.ten
              : `Ô lưới ${p.cell_id}`;

            container.appendChild(title);

            const details = document.createElement("p");
            details.textContent =
              `Số cơ sở: ${p.so_co_so} / ${p.so_luong_toi_thieu}`;

            container.appendChild(details);
            layer.bindPopup(container);
          }}
        />
      )}
    </MapContainer>
  );
}

export default function ThieuDichVuPage() {
  const [mode, setMode] = useState("points");
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);

  const [categoryId, setCategoryId] = useState("");
  const [regionId, setRegionId] = useState("");
  const [cellSize, setCellSize] = useState("1000");

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOptions() {
      try {
        const [types, regionResponse] = await Promise.all([
          getLoaiDichVu(),
          getGapRegions()
        ]);

        setCategories(
          types.data.filter(x => x.is_active)
        );
        setRegions(regionResponse.data);
      } catch (error) {
        setError(
          error.response?.data?.message || error.message
        );
      }
    }

    loadOptions();
  }, []);

  async function analyze() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let response;

      if (mode === "points") {
        response = await getMissingServicePoints(categoryId);
      } else {
        if (!regionId || !categoryId) {
          throw new Error(
            "Hãy chọn vùng nghiên cứu và loại dịch vụ"
          );
        }

        const size = Number(cellSize);

        if (
          !Number.isSafeInteger(size) ||
          size < 100 || size > 5000
        ) {
          throw new Error(
            "Kích thước ô lưới phải từ 100 đến 5000 mét"
          );
        }

        response = await getGapGrid(
          regionId, categoryId, size
        );
      }

      if (!response.success) {
        throw new Error("Phân tích thất bại");
      }

      setResult(response);
    } catch (error) {
      setError(
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p8-page">
      <div className="p8-heading">
        <div>
          <h2>Phân tích khu vực thiếu dịch vụ</h2>
          <p>
            Phân tích khả năng tiếp cận dịch vụ
            dựa trên tiêu chí và dữ liệu không gian.
          </p>
        </div>
      </div>

      <div className="p8-gap-layout">
        <div className="p8-panel p8-gap-controls">
          <h3>Thiết lập phân tích</h3>

          <label>
            Phương pháp
            <select
              value={mode}
              onChange={e => {
                setMode(e.target.value);
                setResult(null);
              }}
            >
              <option value="points">
                Điểm du lịch thiếu dịch vụ
              </option>
              <option value="grid">
                Phân tích theo ô lưới
              </option>
            </select>
          </label>

          <label>
            Loại dịch vụ
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
            >
              <option value="">Tất cả loại dịch vụ</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.ten}
                </option>
              ))}
            </select>
          </label>

          {mode === "grid" && (
            <>
              <label>
                Khu vực nghiên cứu
                <select
                  value={regionId}
                  onChange={e => setRegionId(e.target.value)}
                >
                  <option value="">Chọn khu vực</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.ten}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Kích thước ô lưới (đơn vị phép chiếu)
                <input
                  type="number"
                  min="100"
                  max="5000"
                  step="100"
                  value={cellSize}
                  onChange={e => setCellSize(e.target.value)}
                />
              </label>

              <p className="p8-note">
                Ô lưới tạo trên EPSG:3857.
                Kích thước có sai lệch so với kích thước
                thực trên mặt đất.
              </p>
            </>
          )}

          <button
            className="p8-primary"
            disabled={loading}
            onClick={analyze}
          >
            {loading ? "Đang phân tích..." : "Thực hiện phân tích"}
          </button>

          {error && (
            <div className="p8-message" role="alert">
              {error}
            </div>
          )}

          {result && (
            <div className="p8-gap-summary">
              <h4>Kết quả phân tích</h4>

              {mode === "points" ? (
                <p>
                  Có <strong>{result.total}</strong> trường hợp
                  điểm du lịch chưa đạt tiêu chí dịch vụ.
                </p>
              ) : (
                <>
                  <p>
                    Ô được đánh giá thiếu:{" "}
                    <strong>{result.missingCells}</strong>
                  </p>
                  <p>
                    Loại dịch vụ: {result.serviceType}
                  </p>
                  <p>
                    Bán kính tiếp cận: {result.radiusM} m
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        <div className="p8-panel">
          <div className="p8-panel-title">
            <h3>Bản đồ các vị trí thiếu dịch vụ</h3>
            <span>PostGIS · Leaflet</span>
          </div>

          <GapMap
            geojson={result?.geojson || null}
            mode={mode}
          />

          <p className="p8-map-caption">
            Màu đỏ biểu diễn các điểm hoặc ô được đánh giá
            là thiếu dịch vụ theo tiêu chí đã chọn.
          </p>
        </div>
      </div>

      {result && mode === "points" && (
        <div className="p8-panel">
          <div className="p8-panel-title">
            <h3>Chi tiết các điểm chưa đạt</h3>
          </div>

          <div className="p8-table-wrap">
            <table className="p8-table">
              <thead>
                <tr>
                  <th>Điểm du lịch</th>
                  <th>Loại dịch vụ</th>
                  <th>Bán kính</th>
                  <th>Số cơ sở</th>
                  <th>Tối thiểu</th>
                  <th>Còn thiếu</th>
                </tr>
              </thead>
              <tbody>
                {result.data.map((item, index) => (
                  <tr key={`${item.diem_id}-${item.loai_dich_vu_id}-${index}`}>
                    <td>{item.ten_diem}</td>
                    <td>{item.ten_loai_dich_vu}</td>
                    <td>{item.ban_kinh_m} m</td>
                    <td>{item.so_co_so}</td>
                    <td>{item.so_luong_toi_thieu}</td>
                    <td>
                      {Math.max(
                        0,
                        item.so_luong_toi_thieu - item.so_co_so
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
