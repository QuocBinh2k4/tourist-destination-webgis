
import { useEffect } from "react";

import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Tâm bản đồ mặc định: khu vực Hà Nội
const DEFAULT_CENTER = [21.03, 105.85];

function validFeatures(collection) {
  return (collection?.features || []).filter((feature) => {
    const coords = feature?.geometry?.coordinates;

    return (
      feature?.geometry?.type === "Point" &&
      Array.isArray(coords) &&
      coords.length >= 2 &&
      Number.isFinite(Number(coords[0])) &&
      Number.isFinite(Number(coords[1])) &&
      Math.abs(Number(coords[0])) <= 180 &&
      Math.abs(Number(coords[1])) <= 90
    );
  });
}

// Đưa bản đồ đến phạm vi các đối tượng
function FitDataBounds({ destinations, services }) {
  const map = useMap();

  useEffect(() => {
    const features = [
      ...validFeatures(destinations),
      ...validFeatures(services)
    ];

    if (features.length === 0) return;

    const bounds = L.latLngBounds(
      features.map((feature) => {
        const [lon, lat] = feature.geometry.coordinates;
        return [lat, lon];
      })
    );

    map.fitBounds(bounds, {
      padding: [40, 40],
      maxZoom: 14
    });
  }, [map, destinations, services]);

  return null;
}

// Xử lý click khi cần chọn tọa độ
function MapClickHandler({ onSelectPosition }) {
  useMapEvents({
    click(event) {
      if (onSelectPosition) {
        onSelectPosition({
          latitude: event.latlng.lat,
          longitude: event.latlng.lng
        });
      }
    }
  });

  return null;
}

// Đưa bản đồ đến một vị trí cụ thể
function FlyToPosition({ position }) {
  const map = useMap();

  useEffect(() => {
    if (!position) return;

    map.flyTo(
      [position.latitude, position.longitude],
      15,
      { duration: 0.8 }
    );
  }, [map, position]);

  return null;
}

export default function TourismMap({
  destinations,
  services,
  showDestinations = true,
  showServices = true,
  onSelectPosition,
  selectedPosition,
  focusPosition,
  initialCenter,
  fitData = true,
  height = "540px"
}) {
  const destinationFeatures = validFeatures(destinations);
  const serviceFeatures = validFeatures(services);

  return (
    <MapContainer
      center={initialCenter || DEFAULT_CENTER}
      zoom={12}
      scrollWheelZoom={true}
      style={{ width: "100%", height }}
      className="tourism-leaflet-map"
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      {fitData && (
        <FitDataBounds
          destinations={showDestinations ? destinations : null}
          services={showServices ? services : null}
        />
      )}

      <MapClickHandler
        onSelectPosition={onSelectPosition}
      />

      <FlyToPosition position={focusPosition} />

      {/* Lớp điểm du lịch */}
      {showDestinations &&
        destinationFeatures.map((feature) => {
          const [lon, lat] = feature.geometry.coordinates;
          const props = feature.properties || {};

          return (
            <CircleMarker
              key={`destination-${feature.id}`}
              center={[lat, lon]}
              radius={9}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: "#0f9d81",
                fillOpacity: 0.95
              }}
            >
              <Popup>
                <div className="webgis-popup">
                  <span className="webgis-popup-type">
                    Điểm du lịch
                  </span>

                  <h3>{props.ten}</h3>

                  <p><strong>Mã:</strong> {props.ma}</p>
                  <p>
                    <strong>Địa chỉ:</strong>{" "}
                    {props.dia_chi || "Chưa cập nhật"}
                  </p>
                  <p>
                    <strong>Trạng thái:</strong>{" "}
                    {props.trang_thai || "Chưa rõ"}
                  </p>
                  <p>
                    <strong>Giá vé:</strong>{" "}
                    {props.gia_ve_vnd == null
                      ? "Chưa cập nhật"
                      : `${Number(props.gia_ve_vnd).toLocaleString("vi-VN")} đ`}
                  </p>

                  <p className="webgis-popup-coords">
                    {Number(lat).toFixed(6)},{" "}
                    {Number(lon).toFixed(6)}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

      {/* Lớp cơ sở dịch vụ */}
      {showServices &&
        serviceFeatures.map((feature) => {
          const [lon, lat] = feature.geometry.coordinates;
          const props = feature.properties || {};

          return (
            <CircleMarker
              key={`service-${feature.id}`}
              center={[lat, lon]}
              radius={8}
              pathOptions={{
                color: "#ffffff",
                weight: 2,
                fillColor: "#f59e0b",
                fillOpacity: 0.95
              }}
            >
              <Popup>
                <div className="webgis-popup">
                  <span className="webgis-popup-type service">
                    Cơ sở dịch vụ
                  </span>

                  <h3>{props.ten}</h3>

                  <p><strong>Mã:</strong> {props.ma}</p>
                  <p>
                    <strong>Địa chỉ:</strong>{" "}
                    {props.dia_chi || "Chưa cập nhật"}
                  </p>
                  <p>
                    <strong>Điện thoại:</strong>{" "}
                    {props.so_dien_thoai || "Chưa cập nhật"}
                  </p>
                  <p>
                    <strong>Trạng thái:</strong>{" "}
                    {props.trang_thai || "Chưa rõ"}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

      {/* Vị trí được chọn trên bản đồ */}
      {selectedPosition && (
        <CircleMarker
          center={[
            selectedPosition.latitude,
            selectedPosition.longitude
          ]}
          radius={11}
          pathOptions={{
            color: "#1d4ed8",
            weight: 3,
            fillColor: "#93c5fd",
            fillOpacity: 0.85
          }}
        >
          <Popup>Vị trí đang được chọn</Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
