
import { useState } from "react";

import { X, Check, MapPin } from "lucide-react";
import TourismMap from "./TourismMap";
import { createPortal } from "react-dom";
import "../styles/webgis.css";

export default function CoordinatePicker({
  initialLatitude,
  initialLongitude,
  onConfirm,
  onClose
}) {
  const lat = Number(initialLatitude);
  const lon = Number(initialLongitude);

  const initialPosition = (
    initialLatitude !== "" &&
    initialLongitude !== "" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180
  ) ? { latitude: lat, longitude: lon } : null;

  const [position, setPosition] = useState(initialPosition);

  return createPortal(
  <div 
    className="modal-overlay coordinate-picker-overlay"
    onMouseDown={(event) => event.stopPropagation()}
    >
      <div
        className="coordinate-picker"
        role="dialog"
        aria-modal="true"
        aria-label="Chọn tọa độ trên bản đồ"
      >
        <div className="coordinate-picker-header">
          <div>
            <h2><MapPin size={20} /> Chọn vị trí</h2>
            <p>Nhấn lên bản đồ để xác định tọa độ WGS84.</p>
          </div>

          <button
            type="button"
            className="dm-icon-button"
            onClick={onClose}
            aria-label="Đóng bản đồ"
          >
            <X size={21} />
          </button>
        </div>

        <TourismMap
          destinations={null}
          services={null}
          selectedPosition={position}
          onSelectPosition={setPosition}
          initialCenter={
            initialPosition
                ? [initialPosition.latitude, initialPosition.longitude]
                : undefined
          }
          fitData={false}
          height="440px"
        />

        <div className="coordinate-picker-footer">
          <div>
            {position ? (
              <>
                <strong>
                  Kinh độ: {position.longitude.toFixed(6)}
                </strong>
                <strong>
                  Vĩ độ: {position.latitude.toFixed(6)}
                </strong>
              </>
            ) : (
              <span>Chưa chọn vị trí</span>
            )}
          </div>

          <button
            type="button"
            className="dm-btn dm-btn-primary"
            disabled={!position}
            onClick={() => onConfirm(position)}
          >
            <Check size={17} />
            Xác nhận tọa độ
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
