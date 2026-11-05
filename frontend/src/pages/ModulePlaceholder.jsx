
import {
  Construction,
  ArrowLeft
} from "lucide-react";

export default function ModulePlaceholder({
  title,
  description,
  onBack
}) {
  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">
        <Construction size={36} />
      </div>

      <h2>{title}</h2>
      <p>{description}</p>

      <div className="placeholder-message">
        Giao diện chức năng này sẽ được xây dựng
        trong các phần tiếp theo của dự án TourismGIS.
      </div>

      <button
        className="primary-button"
        onClick={onBack}
      >
        <ArrowLeft size={17} />
        Quay lại Dashboard
      </button>
    </div>
  );
}
