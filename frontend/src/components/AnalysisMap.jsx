
import { useEffect, useMemo } from "react";

import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Popup,
  useMap,
  useMapEvents
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";


const DEFAULT_CENTER = [21.03, 105.85];

// Di chuyển bản đồ theo kết quả phân tích
function FitAnalysis({ layers }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds([]);

    for (const layer of layers) {
      if (!layer) continue;

      const geoLayer = L.geoJSON(layer);
      const layerBounds = geoLayer.getBounds();

      if (layerBounds.isValid()) {
        bounds.extend(layerBounds);
      }
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, {
        padding: [35, 35],
        maxZoom: 15
      });
    }
  }, [map, layers]);

  return null;
}

// Nhấn lên bản đồ để lấy tâm phân tích
function ClickHandler({ onPickCenter }) {
  useMapEvents({
    click(event) {
      if (onPickCenter) {
        onPickCenter({
          longitude: event.latlng.lng,
          latitude: event.latlng.lat
        });
      }
    }
  });

  return null;
}

const pointStyle = {
  radius: 8,
  color: "#ffffff",
  weight: 2,
  fillColor: "#0d9488",
  fillOpacity: 0.95
};

export default function AnalysisMap({
  points,
  buffer,
  line,
  origin,
  onPickCenter
}) {
  // Tạo mảng lớp cho FitBounds
  const layers = useMemo(
    () => [points, buffer, line, origin],
    [points, buffer, line, origin]
    );

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={12}
      style={{
        height: "100%",
        minHeight: "480px",
        width: "100%"
      }}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      <ClickHandler onPickCenter={onPickCenter} />

      <FitAnalysis layers={layers} />

      {/* Vùng đệm */}
      {buffer && (
        <GeoJSON
          key={`buffer-${JSON.stringify(buffer)}`}
          data={buffer}
          style={{
            color: "#2563eb",
            weight: 2,
            fillColor: "#60a5fa",
            fillOpacity: 0.2
          }}
        />
      )}

      {/* Đường khoảng cách */}
      {line && (
        <GeoJSON
          key={`line-${JSON.stringify(line)}`}
          data={line}
          style={{
            color: "#e11d48",
            weight: 3,
            dashArray: "8 6"
          }}
        />
      )}

      {/* Kết quả phân tích */}
      {points && (
        <GeoJSON
          key={`points-${JSON.stringify(points)}`}
          data={points}
          pointToLayer={(feature, latlng) => {
            const score = feature.properties?.score;

            return L.circleMarker(latlng, {
              ...pointStyle,
              fillColor:
                score === undefined
                  ? "#0d9488"
                  : score >= 80
                    ? "#16a34a"
                    : score >= 50
                      ? "#f59e0b"
                      : "#dc2626"
            });
          }}
          onEachFeature={(feature, layer) => {
            const props = feature.properties || {};

            // React Leaflet quản lý Popup cho GeoJSON
            const container = document.createElement("div");
            const name = document.createElement("strong");
            name.textContent =
              props.ten || props.name || "Điểm phân tích";
            container.appendChild(name);

            if (props.score !== undefined) {
              const score = document.createElement("p");
              score.textContent =
                `Điểm tiếp cận: ${props.score}/100`;
              container.appendChild(score);
            }

            if (props.distanceM !== undefined) {
              const distance = document.createElement("p");
              distance.textContent =
                `Khoảng cách: ${Number(props.distanceM).toFixed(2)} m`;
              container.appendChild(distance);
            }

            layer.bindPopup(container);
          }}
        />
      )}

      {/* Tâm phân tích */}
      {origin?.geometry?.type === "Point" && (
        <CircleMarker
          center={[
            origin.geometry.coordinates[1],
            origin.geometry.coordinates[0]
          ]}
          radius={11}
          pathOptions={{
            color: "#ffffff",
            weight: 3,
            fillColor: "#7c3aed",
            fillOpacity: 1
          }}
        >
          <Popup>
            Tâm phân tích
          </Popup>
        </CircleMarker>
      )}
    </MapContainer>
  );
}
