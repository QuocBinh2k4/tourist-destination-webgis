
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  MapPin,
  Building2,
  RefreshCw,
  Search,
  Layers,
  Crosshair
} from "lucide-react";

import TourismMap from "../components/TourismMap";

import {
  getMapDiemDuLich,
  getMapCoSoDichVu,
  getApiError
} from "../api/client";

import "../styles/webgis.css";

export default function WebGISPage() {
  const [destinations, setDestinations] = useState(null);
  const [services, setServices] = useState(null);

  const [showDestinations, setShowDestinations] = useState(true);
  const [showServices, setShowServices] = useState(true);

  const [search, setSearch] = useState("");
  const [focusPosition, setFocusPosition] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMapData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [destinationData, serviceData] = await Promise.all([
        getMapDiemDuLich(),
        getMapCoSoDichVu()
      ]);

      if (
        destinationData?.type !== "FeatureCollection" ||
        serviceData?.type !== "FeatureCollection"
      ) {
        throw new Error("Dữ liệu GeoJSON không hợp lệ");
      }

      setDestinations(destinationData);
      setServices(serviceData);
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMapData();
  }, [loadMapData]);

  const destinationFeatures = destinations?.features || [];
  const serviceFeatures = services?.features || [];

  const searchResults = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");

    return destinationFeatures.filter((feature) => {
      const props = feature.properties || {};

      return (
        !keyword ||
        [props.ma, props.ten, props.dia_chi].some((value) =>
          String(value || "")
            .toLocaleLowerCase("vi")
            .includes(keyword)
        )
      );
    });
  }, [destinationFeatures, search]);

  function focusFeature(feature) {
    const coordinates = feature.geometry?.coordinates;

    if (!coordinates) return;

    setFocusPosition({
      longitude: Number(coordinates[0]),
      latitude: Number(coordinates[1])
    });

    setShowDestinations(true);
  }

  return (
    <div className="webgis-page">
      <div className="webgis-page-heading">
        <div>
          <h2>Bản đồ du lịch WebGIS</h2>
          <p>
            Hiển thị và khai thác dữ liệu không gian
            từ PostgreSQL/PostGIS.
          </p>
        </div>

        <button
          className="dm-btn dm-btn-secondary"
          onClick={loadMapData}
          disabled={loading}
        >
          <RefreshCw size={17} />
          {loading ? "Đang tải..." : "Tải lại bản đồ"}
        </button>
      </div>

      {error && (
        <div className="dm-alert error" role="alert">
          {error}
        </div>
      )}

      <div className="webgis-workspace">
        <aside className="webgis-tools">
          <div className="webgis-tool-section">
            <h3><Layers size={18} /> Lớp dữ liệu</h3>

            <label className="webgis-layer-row">
              <input
                type="checkbox"
                checked={showDestinations}
                onChange={(e) =>
                  setShowDestinations(e.target.checked)
                }
              />
              <span className="legend-dot destination" />
              <span>Điểm du lịch</span>
              <strong>{destinationFeatures.length}</strong>
            </label>

            <label className="webgis-layer-row">
              <input
                type="checkbox"
                checked={showServices}
                onChange={(e) =>
                  setShowServices(e.target.checked)
                }
              />
              <span className="legend-dot service" />
              <span>Cơ sở dịch vụ</span>
              <strong>{serviceFeatures.length}</strong>
            </label>
          </div>

          <div className="webgis-tool-section">
            <h3><Search size={18} /> Tìm điểm du lịch</h3>

            <input
              className="webgis-search"
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Nhập mã, tên, địa chỉ..."
            />

            <p className="webgis-subtext">
              {searchResults.length} kết quả
            </p>

            <div className="webgis-result-list">
              {searchResults.map((feature) => (
                <button
                  key={feature.id}
                  className="webgis-result"
                  onClick={() => focusFeature(feature)}
                >
                  <MapPin size={17} />
                  <span>
                    <strong>{feature.properties?.ten}</strong>
                    <small>{feature.properties?.ma}</small>
                  </span>
                </button>
              ))}

              {searchResults.length === 0 && (
                <p className="webgis-subtext">
                  Không có điểm phù hợp.
                </p>
              )}
            </div>
          </div>

          <div className="webgis-tool-section">
            <h3><Crosshair size={18} /> Tọa độ đã chọn</h3>

            {selectedPosition ? (
              <div className="webgis-coordinates">
                <p>
                  Kinh độ:{" "}
                  <strong>
                    {selectedPosition.longitude.toFixed(6)}
                  </strong>
                </p>
                <p>
                  Vĩ độ:{" "}
                  <strong>
                    {selectedPosition.latitude.toFixed(6)}
                  </strong>
                </p>
              </div>
            ) : (
              <p className="webgis-subtext">
                Nhấn vào một vị trí trên bản đồ.
              </p>
            )}
          </div>
        </aside>

        <div className="webgis-map-panel">
          <TourismMap
            destinations={destinations}
            services={services}
            showDestinations={showDestinations}
            showServices={showServices}
            selectedPosition={selectedPosition}
            onSelectPosition={setSelectedPosition}
            focusPosition={focusPosition}
            height="650px"
          />

          <div className="webgis-map-footer">
            <span>
              <MapPin size={15} />
              {showDestinations ? destinationFeatures.length : 0}
              {" "}điểm du lịch
            </span>

            <span>
              <Building2 size={15} />
              {showServices ? serviceFeatures.length : 0}
              {" "}cơ sở dịch vụ
            </span>

            <span>Hệ tọa độ EPSG:4326</span>
          </div>
        </div>
      </div>
    </div>
  );
}
