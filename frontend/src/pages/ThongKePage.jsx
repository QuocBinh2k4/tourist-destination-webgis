
import { useEffect, useState } from "react";

import {
  MapPin, Building2, Tags,
  Activity, RefreshCw
} from "lucide-react";

import { getDashboardStats } from "../api/client";
import "../styles/phan8.css";

function BarChart({ title, items, labelKey, valueKey }) {
  const maxValue = Math.max(
    1, ...items.map(x => Number(x[valueKey]) || 0)
  );

  return (
    <div className="p8-panel p8-chart-panel">
      <h3>{title}</h3>

      {items.length === 0 ? (
        <p>Chưa có dữ liệu.</p>
      ) : items.map(item => {
        const count = Number(item[valueKey]) || 0;

        return (
          <div key={item.id} className="p8-bar-row">
            <div>
              <span>{item[labelKey]}</span>
              <strong>{count}</strong>
            </div>

            <div className="p8-bar-track">
              <div
                style={{
                  width: `${count / maxValue * 100}%`
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ThongKePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError("");

    try {
      const response = await getDashboardStats();

      if (!response.success) {
        throw new Error("Không thể tải thống kê");
      }

      setData(response);
    } catch (error) {
      setError(
        error.response?.data?.message || error.message
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const stats = data?.summary || {};

  const cards = [
    {
      label: "Điểm du lịch",
      value: stats.so_diem,
      icon: MapPin
    },
    {
      label: "Cơ sở dịch vụ",
      value: stats.so_co_so,
      icon: Building2
    },
    {
      label: "Loại hình du lịch",
      value: stats.so_loai_hinh,
      icon: Tags
    },
    {
      label: "Loại dịch vụ",
      value: stats.so_loai_dich_vu,
      icon: Activity
    }
  ];

  return (
    <div className="p8-page">
      <div className="p8-heading">
        <div>
          <h2>Thống kê và phân bố du lịch</h2>
          <p>Dữ liệu tổng hợp trực tiếp từ PostgreSQL/PostGIS</p>
        </div>

        <button
          className="p8-secondary"
          onClick={load}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Làm mới
        </button>
      </div>

      {error && <div className="p8-message">{error}</div>}

      <div className="p8-stats-grid">
        {cards.map(card => {
          const Icon = card.icon;

          return (
            <div className="p8-stat" key={card.label}>
              <Icon size={24} />
              <strong>
                {loading ? "..." : card.value ?? 0}
              </strong>
              <span>{card.label}</span>
            </div>
          );
        })}
      </div>

      <div className="p8-two-columns">
        <BarChart
          title="Phân bố điểm theo loại hình du lịch"
          items={data?.tourismCategories || []}
          labelKey="ten"
          valueKey="so_diem"
        />

        <BarChart
          title="Phân bố cơ sở theo loại dịch vụ"
          items={data?.serviceCategories || []}
          labelKey="ten"
          valueKey="so_co_so"
        />
      </div>

      <div className="p8-panel p8-access-summary">
        <h3>Đánh giá tiếp cận dịch vụ</h3>

        <div className="p8-stats-grid">
          <div>
            <strong>
              {data?.accessibility?.so_diem_da_danh_gia ?? 0}
            </strong>
            <span>Điểm đã đánh giá</span>
          </div>

          <div>
            <strong>
              {data?.accessibility?.so_diem_dat ?? 0}
            </strong>
            <span>Đạt tất cả tiêu chí</span>
          </div>

          <div>
            <strong>
              {data?.accessibility?.diem_trung_binh ?? "—"}
            </strong>
            <span>Điểm tiếp cận trung bình / 100</span>
          </div>
        </div>

        <p className="p8-note">
          Các thống kê phản ánh dữ liệu hiện có trong CSDL.
          Kết quả tiếp cận phụ thuộc các tiêu chí đang hoạt động.
        </p>
      </div>
    </div>
  );
}
