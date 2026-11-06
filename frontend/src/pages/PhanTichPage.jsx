
import { useEffect, useState } from "react";

import {
  Ruler,
  LocateFixed,
  CircleDot,
  Scan,
  ChartNoAxesCombined,
  Play,
  RefreshCw
} from "lucide-react";

import AnalysisMap from "../components/AnalysisMap";

import {
  getDiemDuLich,
  getDistance,
  getNearest,
  getRadiusSearch,
  getBuffer,
  getAccessibility,
  getApiError
} from "../api/client";

import "../styles/phanTich.css";

const analysisTypes = [
  { id: "distance", label: "Tính khoảng cách", icon: Ruler },
  { id: "nearest", label: "Tìm điểm gần nhất", icon: LocateFixed },
  { id: "radius", label: "Tìm trong bán kính", icon: CircleDot },
  { id: "buffer", label: "Tạo vùng đệm Buffer", icon: Scan },
  { id: "access", label: "Đánh giá tiếp cận", icon: ChartNoAxesCombined }
];

const emptyLayers = {
  points: null,
  buffer: null,
  line: null,
  origin: null
};

function pointFeature(geometry, name = "Điểm") {
  return {
    type: "Feature",
    geometry,
    properties: { name }
  };
}

function formatDistance(value) {
  const m = Number(value);
  if (!Number.isFinite(m)) return "—";

  return m >= 1000
    ? `${(m / 1000).toFixed(3)} km`
    : `${m.toFixed(2)} m`;
}

export default function PhanTichPage() {
  const [type, setType] = useState("radius");
  const [destinations, setDestinations] = useState([]);

  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [pointId, setPointId] = useState("");

  const [lon, setLon] = useState("105.82");
  const [lat, setLat] = useState("21.03");
  const [radius, setRadius] = useState("3000");
  const [limit, setLimit] = useState("5");

  const [layers, setLayers] = useState(emptyLayers);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mapPickMode, setMapPickMode] = useState(false);

  useEffect(() => {
    let active = true;

    getDiemDuLich()
      .then(response => {
        if (!active) return;
        if (!response.success) {
          throw new Error("Không tải được điểm du lịch");
        }

        const data = response.data || [];
        setDestinations(data);

        if (data.length > 0) {
          setFromId(String(data[0].id));
          setPointId(String(data[0].id));

          const second = data.find(
            d => String(d.id) !== String(data[0].id)
          );
          setToId(second ? String(second.id) : "");
        }
      })
      .catch(err => {
        if (active) setError(getApiError(err));
      });

    return () => {
      active = false;
    };
  }, []);

  // Đặt lại kết quả khi thay phép phân tích
  function changeType(value) {
    setType(value);
    setLayers(emptyLayers);
    setResult(null);
    setError("");
    setMapPickMode(false);
  }

  async function runAnalysis() {
    setLoading(true);
    setError("");
    setResult(null);
    setLayers(emptyLayers);

    try {
      let response;
      let newLayers = { ...emptyLayers };

      if (type === "distance") {
        if (!fromId || !toId || fromId === toId) {
          throw new Error("Hãy chọn hai điểm khác nhau");
        }

        response = await getDistance(fromId, toId);

        const data = response.data;
        const a = data.fromGeometry.coordinates;
        const b = data.toGeometry.coordinates;

        newLayers.origin = pointFeature(
          data.fromGeometry, data.fromName
        );

        newLayers.points = {
          type: "FeatureCollection",
          features: [
            pointFeature(data.toGeometry, data.toName)
          ]
        };

        newLayers.line = {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [a, b]
          },
          properties: {}
        };
      }

      if (type === "nearest") {
        if (!pointId) throw new Error("Chưa chọn điểm gốc");

        response = await getNearest(pointId, Number(limit));

        newLayers.origin = response.origin;
        newLayers.points = response.geojson;
      }

      if (type === "radius") {
        const longitude = Number(lon);
        const latitude = Number(lat);
        const distance = Number(radius);

        if (
          lon.trim() === "" || lat.trim() === "" ||
          radius.trim() === "" ||
          !Number.isFinite(longitude) ||
          !Number.isFinite(latitude) ||
          !Number.isFinite(distance) ||
          longitude < -180 || longitude > 180 ||
          latitude < -90 || latitude > 90 ||
          distance <= 0 || distance > 100000
        ) {
          throw new Error("Tọa độ hoặc bán kính không hợp lệ");
        }

        response = await getRadiusSearch(
          longitude, latitude, distance, 100
        );

        newLayers.origin = pointFeature({
          type: "Point",
          coordinates: [longitude, latitude]
        });

        newLayers.points = response.geojson;
        newLayers.buffer = response.buffer;
      }

      if (type === "buffer") {
        
        if (
        radius.trim() === "" ||
        !Number.isSafeInteger(Number(radius)) ||
        Number(radius) < 1 ||
        Number(radius) > 100000
        ) {
        throw new Error(
            "Bán kính Buffer phải là số nguyên từ 1 đến 100000 mét"
        );
        }

        if (!pointId) throw new Error("Chưa chọn điểm gốc");

        response = await getBuffer(
          pointId, Number(radius)
        );

        newLayers.origin = response.point;
        newLayers.buffer = response.buffer;
      }

      if (type === "access") {
        response = await getAccessibility(
          pointId || null
        );

        newLayers.points = response.geojson;
      }

      if (!response?.success) {
        throw new Error("Phân tích không thành công");
      }

      setLayers(newLayers);
      setResult(response);
      setMapPickMode(false);
    } catch (err) {
      setError(getApiError(err) ===
        "Không thể thực hiện thao tác. Kiểm tra kết nối Backend."
          ? err.message
          : getApiError(err)
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedPoint = destinations.find(
    d => String(d.id) === String(pointId)
  );

  function usePointCoordinates() {
    if (!selectedPoint) return;

    setLon(String(selectedPoint.longitude));
    setLat(String(selectedPoint.latitude));
  }

  function selectMapCenter(position) {
    if (!mapPickMode) return;

    setLon(position.longitude.toFixed(6));
    setLat(position.latitude.toFixed(6));
    setMapPickMode(false);
  }

  return (
    <div className="analysis-page">
      <div className="analysis-heading">
        <div>
          <h2>Phân tích không gian</h2>
          <p>
            Thực hiện các phép toán GIS trên dữ liệu PostGIS
            và trực quan hóa kết quả bằng Leaflet.
          </p>
        </div>
      </div>

      <div className="analysis-tabs">
        {analysisTypes.map(item => {
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              className={type === item.id ? "selected" : ""}
              onClick={() => changeType(item.id)}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="analysis-layout">
        <section className="analysis-control">
          <h3>Thiết lập tham số</h3>

          {type === "distance" && (
            <>
              <label>Điểm du lịch A</label>
              <select
                value={fromId}
                onChange={e => setFromId(e.target.value)}
              >
                <option value="">Chọn điểm A</option>
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.ma} – {d.ten}
                  </option>
                ))}
              </select>

              <label>Điểm du lịch B</label>
              <select
                value={toId}
                onChange={e => setToId(e.target.value)}
              >
                <option value="">Chọn điểm B</option>
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.ma} – {d.ten}
                  </option>
                ))}
              </select>
            </>
          )}

          {["nearest", "buffer", "access"].includes(type) && (
            <>
              <label>Điểm du lịch gốc</label>
              <select
                value={pointId}
                onChange={e => setPointId(e.target.value)}
              >
                <option value="">Chọn điểm du lịch</option>
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.ma} – {d.ten}
                  </option>
                ))}
              </select>
            </>
          )}

          {type === "radius" && (
            <>
              <label>Kinh độ</label>
              <input
                type="number"
                step="any"
                value={lon}
                onChange={e => setLon(e.target.value)}
              />

              <label>Vĩ độ</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={e => setLat(e.target.value)}
              />

              <label>Chọn tâm từ danh sách</label>
              <select
                value={pointId}
                onChange={e => setPointId(e.target.value)}
              >
                <option value="">Chọn điểm</option>
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.ma} – {d.ten}
                  </option>
                ))}
              </select>

              <button
                className="analysis-secondary"
                onClick={usePointCoordinates}
                type="button"
              >
                Lấy tọa độ điểm đã chọn
              </button>

              <button
                className="analysis-secondary"
                onClick={() => setMapPickMode(!mapPickMode)}
                type="button"
              >
                {mapPickMode
                  ? "Hủy chọn tâm trên bản đồ"
                  : "Nhấn bản đồ để chọn tâm"}
              </button>

              {mapPickMode && (
                <p className="analysis-hint">
                  Nhấn vào một vị trí trên bản đồ bên phải.
                </p>
              )}
            </>
          )}

          {["radius", "buffer"].includes(type) && (
            <>
              <label>Bán kính (mét)</label>
              <input
                type="number"
                min="1"
                max="100000"
                step="1"
                value={radius}
                onChange={e => setRadius(e.target.value)}
              />
            </>
          )}

          {type === "nearest" && (
            <>
              <label>Số điểm gần nhất</label>
              <input
                type="number"
                min="1"
                max="100"
                step="1"
                value={limit}
                onChange={e => setLimit(e.target.value)}
              />
            </>
          )}

          {type === "access" && (
            <p className="analysis-hint">
              Chọn một điểm du lịch để đánh giá theo các
              tiêu chí dịch vụ đã thiết lập trong CSDL.
            </p>
          )}

          <button
            className="analysis-run"
            onClick={runAnalysis}
            disabled={loading}
          >
            {loading
              ? <RefreshCw size={17} />
              : <Play size={17} />}
            {loading ? "Đang phân tích..." : "Thực hiện phân tích"}
          </button>

          {error && (
            <div className="analysis-error" role="alert">
              {error}
            </div>
          )}

          <p className="analysis-hint">
            Khoảng cách và bán kính được tính bằng mét
            trên dữ liệu geography của PostGIS.
          </p>
        </section>

        <section className="analysis-map-area">
          <div className="analysis-map-header">
            <strong>Bản đồ kết quả phân tích</strong>
            <span>EPSG:4326 · OpenStreetMap</span>
          </div>

          <div className="analysis-map-content">
            <AnalysisMap
              points={layers.points}
              buffer={layers.buffer}
              line={layers.line}
              origin={layers.origin}
              onPickCenter={
                mapPickMode ? selectMapCenter : undefined
              }
            />
          </div>

          <div className="analysis-map-legend">
            <span>🟣 Tâm phân tích</span>
            <span>🟢 Điểm kết quả</span>
            <span>🔵 Buffer</span>
            <span>🔴 Khoảng cách</span>
          </div>
        </section>
      </div>

      <section className="analysis-results">
        <h3>Kết quả phân tích</h3>

        {!result && (
          <p className="analysis-hint">
            Chọn phép phân tích và nhấn Thực hiện để xem kết quả.
          </p>
        )}

        {result && type === "distance" && (
          <div className="analysis-summary">
            <h4>{result.data.fromName} → {result.data.toName}</h4>
            <strong>
              {formatDistance(result.data.distanceM)}
            </strong>
            <p>Khoảng cách địa lý, không phải đường đi thực tế.</p>
          </div>
        )}

        {result && ["radius", "nearest"].includes(type) && (
          <>
            <p>Tìm được {result.total} điểm du lịch.</p>
            <div className="analysis-table-scroll">
              <table className="analysis-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Mã điểm</th>
                    <th>Tên điểm</th>
                    <th>Khoảng cách</th>
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((item, i) => (
                    <tr key={item.id}>
                      <td>{i + 1}</td>
                      <td>{item.ma}</td>
                      <td>{item.ten}</td>
                      <td>{formatDistance(item.distanceM)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {result && type === "buffer" && (
          <div className="analysis-summary">
            <h4>Vùng đệm đã tạo thành công</h4>
            <strong>{formatDistance(result.radiusM)}</strong>
            <p>
              Hình học Buffer được trả về từ hàm
              tourism.fn_buffer_diem và hiển thị trên bản đồ.
            </p>
          </div>
        )}

        {result && type === "access" && (
          <>
            {result.data.length === 0 && (
              <p>
                Chưa có kết quả. Kiểm tra tiêu chí tiếp cận
                đang hoạt động và trạng thái của điểm du lịch.
              </p>
            )}

            {result.data.map(item => (
              <div className="access-result" key={item.pointId}>
                <div className="access-result-heading">
                  <div>
                    <h4>{item.name}</h4>
                    <p>
                      {item.meetsAll
                        ? "Đạt tất cả tiêu chí"
                        : "Chưa đạt tất cả tiêu chí"}
                    </p>
                  </div>

                  <strong>{item.score}/100</strong>
                </div>

                <div className="access-progress">
                  <div style={{ width: `${item.score}%` }} />
                </div>

                <div className="analysis-table-scroll">
                  <table className="analysis-table">
                    <thead>
                      <tr>
                        <th>Dịch vụ</th>
                        <th>Bán kính</th>
                        <th>Thực tế</th>
                        <th>Tối thiểu</th>
                        <th>Kết quả</th>
                      </tr>
                    </thead>

                    <tbody>
                      {item.details.map(detail => (
                        <tr key={detail.loai_dich_vu_id}>
                          <td>{detail.ten_loai_dich_vu}</td>
                          <td>{detail.ban_kinh_m} m</td>
                          <td>{detail.so_co_so}</td>
                          <td>{detail.so_luong_toi_thieu}</td>
                          <td>
                            {detail.dat ? "Đạt" : "Thiếu"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </>
        )}
      </section>
    </div>
  );
}
