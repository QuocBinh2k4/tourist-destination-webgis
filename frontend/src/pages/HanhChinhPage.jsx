
import { useEffect, useState } from "react";

import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Popup,
  useMap
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import {
  getDanhSachTinh,
  getXaTheoTinh,
  getDuLieuHanhChinh
} from "../api/client";

import "../styles/hanhChinh.css";

// Đưa bản đồ tới tỉnh hoặc xã đang chọn
function FitKhuVuc({ geojson }) {
  const map = useMap();

  useEffect(() => {
    if (!geojson) return;

    const bounds = L.geoJSON(geojson).getBounds();

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [25, 25],
        maxZoom: geojson.type === "FeatureCollection" ? 7 : 14
      });
    }
  }, [map, geojson]);

  return null;
}

// Popup an toàn với chuỗi lấy từ CSDL
function safePopup(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div;
}

const EMPTY = {
  type: "FeatureCollection",
  features: []
};

export default function HanhChinhPage() {
  const [tinhGeoJSON, setTinhGeoJSON] = useState(null);
  const [xaData, setXaData] = useState(null);
  const [areaData, setAreaData] = useState(null);

  const [tinhId, setTinhId] = useState("");
  const [xaId, setXaId] = useState("");

  const [showTinh, setShowTinh] = useState(true);
  const [showXa, setShowXa] = useState(true);
  const [showDiem, setShowDiem] = useState(true);
  const [showDichVu, setShowDichVu] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tải ranh giới 34 tỉnh lần đầu
  useEffect(() => {
    let active = true;
    setLoading(true);

    getDanhSachTinh()
      .then(response => {
        if (!active) return;

        if (!response.success) {
          throw new Error("Không tải được 34 tỉnh");
        }

        setTinhGeoJSON(response.geojson);
      })
      .catch(err => {
        if (active) {
          setError(
            err.response?.data?.message || err.message
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Khi chọn tỉnh: tải các xã/phường thuộc tỉnh
  useEffect(() => {
    let active = true;

    setXaData(null);

    if (!tinhId) return;

    getXaTheoTinh(tinhId)
      .then(response => {
        if (!active) return;

        if (!response.success) {
          throw new Error("Không tải được xã/phường");
        }

        setXaData(response);
      })
      .catch(err => {
        if (active) {
          setError(
            err.response?.data?.message || err.message
          );
        }
      });

    return () => {
      active = false;
    };
  }, [tinhId]);

  // Chọn xã thì phân tích xã, chưa chọn xã thì phân tích tỉnh
  const areaId = xaId || tinhId;

  useEffect(() => {
    let active = true;

    setAreaData(null);

    if (!areaId) return;

    getDuLieuHanhChinh(areaId)
      .then(response => {
        if (!active) return;

        if (!response.success) {
          throw new Error(
            "Không tải được dữ liệu khu vực"
          );
        }

        setAreaData(response);
      })
      .catch(err => {
        if (active) {
          setError(
            err.response?.data?.message || err.message
          );
        }
      });

    return () => {
      active = false;
    };
  }, [areaId]);

  // Thay đổi tỉnh
  function chonTinh(id) {
    setTinhId(String(id));
    setXaId("");
    setXaData(null);
    setAreaData(null);
    setError("");
  }

  // Thay đổi xã/phường
  function chonXa(id) {
    setXaId(String(id));
    setAreaData(null);
    setError("");
  }

  const tinhFeatures = tinhGeoJSON?.features || [];
  const xaFeatures = xaData?.geojson?.features || [];

  const selectedTinh = tinhFeatures.find(
    f => String(f.properties?.id) === tinhId
  );

  const selectedXa = xaFeatures.find(
    f => String(f.properties?.id) === xaId
  );

  const currentBoundary =
    selectedXa || selectedTinh || tinhGeoJSON;

  const destinations = areaData?.destinations || EMPTY;
  const services = areaData?.services || EMPTY;

  return (
    <div className="hc-page">
      <div className="hc-heading">
        <h2>Ranh giới hành chính và phân bố du lịch</h2>
        <p>
          Chọn tỉnh, xã/phường để xem dữ liệu
          không gian trong PostGIS.
        </p>
      </div>

      {error && (
        <div className="hc-error" role="alert">
          {error}
        </div>
      )}

      <div className="hc-layout">
        <aside className="hc-panel hc-sidebar">
          <h3>Bộ lọc hành chính</h3>

          <label htmlFor="hc-tinh">
            Tỉnh/thành phố
          </label>

          <select
            id="hc-tinh"
            value={tinhId}
            onChange={e => chonTinh(e.target.value)}
          >
            <option value="">Toàn quốc</option>

            {tinhFeatures.map(f => (
              <option
                key={f.properties.id}
                value={f.properties.id}
              >
                {f.properties.ten}
              </option>
            ))}
          </select>

          <label htmlFor="hc-xa">Xã/phường</label>

          <select
            id="hc-xa"
            value={xaId}
            disabled={!tinhId}
            onChange={e => chonXa(e.target.value)}
          >
            <option value="">Toàn tỉnh</option>

            {(xaData?.list || []).map(x => (
              <option key={x.id} value={x.id}>
                {x.ten}
              </option>
            ))}
          </select>

          <p className="hc-note">
            {loading
              ? "Đang tải ranh giới..."
              : `${tinhFeatures.length} tỉnh/thành`}

            {tinhId &&
              ` · ${xaData?.total ?? "..."} xã/phường`}
          </p>

          <h3>Hiển thị lớp</h3>

          <label className="hc-check">
            <input
              type="checkbox"
              checked={showTinh}
              onChange={e => setShowTinh(e.target.checked)}
            />
            Ranh giới tỉnh
          </label>

          <label className="hc-check">
            <input
              type="checkbox"
              checked={showXa}
              onChange={e => setShowXa(e.target.checked)}
            />
            Ranh giới xã/phường
          </label>

          <label className="hc-check">
            <input
              type="checkbox"
              checked={showDiem}
              onChange={e => setShowDiem(e.target.checked)}
            />
            Điểm du lịch (xanh ngọc)
          </label>

          <label className="hc-check">
            <input
              type="checkbox"
              checked={showDichVu}
              onChange={e => setShowDichVu(e.target.checked)}
            />
            Cơ sở dịch vụ (cam)
          </label>

          <h3>Thống kê khu vực</h3>

          <div className="hc-stats">
            <div>
              <strong>
                {areaData?.totalDestinations ?? "—"}
              </strong>
              <span>Điểm du lịch</span>
            </div>

            <div>
              <strong>
                {areaData?.totalServices ?? "—"}
              </strong>
              <span>Cơ sở dịch vụ</span>
            </div>
          </div>

          <p className="hc-note">
            {areaData?.area?.ten ||
              "Chọn một tỉnh để xem thống kê."}
          </p>
        </aside>

        <section className="hc-panel hc-map-wrap">
          <MapContainer
            center={[16.3, 106.4]}
            zoom={6}
            style={{
              height: 620,
              width: "100%"
            }}
          >
            <TileLayer
              url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />

            <FitKhuVuc geojson={currentBoundary} />

            {/* Lớp ranh giới tỉnh */}
            {showTinh && tinhGeoJSON && (
              <GeoJSON
                key={`tinh-${tinhId}`}
                data={tinhGeoJSON}
                style={f => ({
                  color:
                    String(f.properties?.id) === tinhId
                      ? "#c2410c"
                      : "#2563eb",
                  weight:
                    String(f.properties?.id) === tinhId
                      ? 3
                      : 1.2,
                  fillOpacity:
                    String(f.properties?.id) === tinhId
                      ? 0.10
                      : 0.03
                })}
                onEachFeature={(f, layer) => {
                  layer.bindPopup(
                    safePopup(f.properties?.ten || "Tỉnh")
                  );

                  layer.on("click", () =>
                    chonTinh(f.properties?.id)
                  );
                }}
              />
            )}

            {/* Lớp ranh giới xã/phường */}
            {showXa && xaData?.geojson && (
              <GeoJSON
                key={`xa-${tinhId}-${xaId}`}
                data={xaData.geojson}
                style={f => ({
                  color:
                    String(f.properties?.id) === xaId
                      ? "#dc2626"
                      : "#10b981",
                  weight:
                    String(f.properties?.id) === xaId
                      ? 3
                      : 1,
                  fillOpacity:
                    String(f.properties?.id) === xaId
                      ? 0.22
                      : 0.06
                })}
                onEachFeature={(f, layer) => {
                  layer.bindPopup(
                    safePopup(
                      f.properties?.ten || "Xã/phường"
                    )
                  );

                  layer.on("click", () =>
                    chonXa(f.properties?.id)
                  );
                }}
              />
            )}

            {/* Các điểm du lịch */}
            {showDiem &&
              destinations.features.map(f => {
                const [lon, lat] =
                  f.geometry.coordinates;

                return (
                  <CircleMarker
                    key={`d-${f.id}`}
                    center={[lat, lon]}
                    radius={7}
                    pathOptions={{
                      color: "white",
                      weight: 2,
                      fillColor: "#0d9488",
                      fillOpacity: 1
                    }}
                  >
                    <Popup>
                      <strong>{f.properties.ten}</strong>
                      <p>
                        {f.properties.dia_chi ||
                          "Chưa có địa chỉ"}
                      </p>
                    </Popup>
                  </CircleMarker>
                );
              })}

            {/* Các cơ sở dịch vụ */}
            {showDichVu &&
              services.features.map(f => {
                const [lon, lat] =
                  f.geometry.coordinates;

                return (
                  <CircleMarker
                    key={`s-${f.id}`}
                    center={[lat, lon]}
                    radius={6}
                    pathOptions={{
                      color: "white",
                      weight: 2,
                      fillColor: "#f59e0b",
                      fillOpacity: 1
                    }}
                  >
                    <Popup>
                      <strong>{f.properties.ten}</strong>
                      <p>
                        {f.properties.dia_chi ||
                          "Chưa có địa chỉ"}
                      </p>
                    </Popup>
                  </CircleMarker>
                );
              })}
          </MapContainer>
        </section>
      </div>

      {/* Bảng thống kê điểm du lịch */}
      {areaData && (
        <div className="hc-panel hc-tables">
          <h3>
            Điểm du lịch trong {areaData.area.ten}
          </h3>

          <div className="hc-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Tên điểm</th>
                  <th>Địa chỉ</th>
                </tr>
              </thead>

              <tbody>
                {destinations.features.map(f => (
                  <tr key={f.id}>
                    <td>{f.properties.ma}</td>
                    <td>{f.properties.ten}</td>
                    <td>
                      {f.properties.dia_chi ||
                        "Chưa cập nhật"}
                    </td>
                  </tr>
                ))}

                {destinations.features.length === 0 && (
                  <tr>
                    <td colSpan={3}>
                      Chưa có điểm du lịch
                      trong phạm vi này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
