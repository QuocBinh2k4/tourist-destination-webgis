
import { useMemo } from "react";

import {
  MapPin,
  Tags,
  Activity,
  CirclePause,
  ArrowRight,
  ListFilter,
  Database
} from "lucide-react";

import StatCard from "../components/StatCard";

// Định dạng tiền Việt Nam
const formatCurrency = (value) => {
  if (value === null || value === undefined) {
    return "Chưa cập nhật";
  }

  return new Intl.NumberFormat("vi-VN").format(
    Number(value)
  ) + " đ";
};

// Hiển thị trạng thái
function StatusBadge({ status }) {
  const labels = {
    dang_hoat_dong: "Đang hoạt động",
    tam_dong: "Tạm đóng",
    ngung_hoat_dong: "Ngừng hoạt động"
  };

  return (
    <span className={`status-badge ${status}`}>
      {labels[status] || status || "Chưa rõ"}
    </span>
  );
}

export default function Dashboard({
  destinations,
  categories,
  search,
  loading,
  error,
  onNavigate,
  onRefresh
}) {
  // Thống kê dựa trên dữ liệu API
  const stats = useMemo(() => {
    return {
      total: destinations.length,

      active: destinations.filter(
        (item) => item.trang_thai === "dang_hoat_dong"
      ).length,

      paused: destinations.filter(
        (item) => item.trang_thai === "tam_dong"
      ).length,

      categories: categories.length
    };
  }, [destinations, categories]);

  // Tính phân bố theo loại hình du lịch
  const distribution = useMemo(() => {
    return categories.map((category) => {
      const count = destinations.filter((item) => {
        return (item.loai_hinh || []).some(
          (type) => String(type.id) === String(category.id)
        );
      }).length;

      return {
        id: category.id,
        name: category.ten,
        count
      };
    }).sort((a, b) => b.count - a.count);
  }, [destinations, categories]);

  const maxCount = Math.max(
    1,
    ...distribution.map((item) => item.count)
  );

  // Lọc bảng theo từ khóa trong Header
  const filteredDestinations = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase("vi");

    if (!keyword) return destinations;

    return destinations.filter((item) => {
      return [
        item.ma,
        item.ten,
        item.dia_chi
      ].some((value) =>
        String(value || "")
          .toLocaleLowerCase("vi")
          .includes(keyword)
      );
    });
  }, [destinations, search]);

  const visibleDestinations = filteredDestinations.slice(0, 10);

  return (
    <div className="dashboard-page">
      <div className="welcome-banner">
        <div>
          <span className="eyebrow">
            HỆ THỐNG THÔNG TIN ĐỊA LÝ DU LỊCH
          </span>

          <h2>Quản lý du lịch thông minh</h2>

          <p>
            Theo dõi dữ liệu điểm du lịch và chuẩn bị
            cho các chức năng phân tích không gian WebGIS.
          </p>

          <button
            className="primary-button"
            onClick={() => onNavigate("destinations")}
          >
            Quản lý điểm du lịch
            <ArrowRight size={17} />
          </button>
        </div>

        <div className="welcome-decoration">
          <MapPin size={68} strokeWidth={1.3} />
        </div>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          <span>{error}</span>

          <button onClick={onRefresh}>
            Thử lại
          </button>
        </div>
      )}

      <div className="section-heading">
        <div>
          <h3>Thống kê tổng quan</h3>
          <p>Số liệu lấy từ cơ sở dữ liệu TourismGIS</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Tổng điểm du lịch"
          value={loading ? "..." : stats.total}
          icon={MapPin}
          color="blue"
          description="Tổng số bản ghi"
        />

        <StatCard
          title="Đang hoạt động"
          value={loading ? "..." : stats.active}
          icon={Activity}
          color="green"
          description="Điểm có trạng thái hoạt động"
        />

        <StatCard
          title="Tạm đóng"
          value={loading ? "..." : stats.paused}
          icon={CirclePause}
          color="orange"
          description="Điểm tạm ngừng phục vụ"
        />

        <StatCard
          title="Loại hình du lịch"
          value={loading ? "..." : stats.categories}
          icon={Tags}
          color="purple"
          description="Danh mục đang hoạt động"
        />
      </div>

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h3>Phân bố theo loại hình</h3>
              <p>Số điểm thuộc từng loại hình du lịch</p>
            </div>
            <ListFilter size={20} className="muted-icon" />
          </div>

          <div className="chart-list">
            {!loading && distribution.length === 0 && (
              <div className="empty-state">
                Chưa có dữ liệu loại hình du lịch.
              </div>
            )}

            {distribution.map((item) => (
              <div className="chart-row" key={item.id}>
                <div className="chart-labels">
                  <span>{item.name}</span>
                  <strong>{item.count}</strong>
                </div>

                <div className="chart-track">
                  <div
                    className="chart-fill"
                    style={{
                      width: `${item.count / maxCount * 100}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <p className="panel-note">
            Một điểm du lịch có thể thuộc nhiều loại hình,
            vì vậy tổng các cột có thể lớn hơn số điểm du lịch.
          </p>
        </section>

        <section className="panel info-panel">
          <div className="panel-header">
            <div>
              <h3>Thông tin hệ thống</h3>
              <p>Nguồn dữ liệu đang sử dụng</p>
            </div>

            <Database size={20} className="muted-icon" />
          </div>

          <div className="info-list">
            <div>
              <span>Hệ quản trị CSDL</span>
              <strong>PostgreSQL</strong>
            </div>

            <div>
              <span>Phần mở rộng không gian</span>
              <strong>PostGIS</strong>
            </div>

            <div>
              <span>Database</span>
              <strong>tourismgis</strong>
            </div>

            <div>
              <span>Schema</span>
              <strong>tourism</strong>
            </div>

            <div>
              <span>Hệ tọa độ</span>
              <strong>EPSG:4326</strong>
            </div>
          </div>

          <p className="panel-note">
            Các thông tin trên là cấu hình của dự án,
            không phải số liệu kiểm tra thời gian thực.
          </p>
        </section>
      </div>

      <section className="panel table-panel">
        <div className="panel-header">
          <div>
            <h3>Danh sách điểm du lịch</h3>
            <p>
              {search
                ? `Tìm được ${filteredDestinations.length} kết quả`
                : "Hiển thị tối đa 10 điểm du lịch"}
            </p>
          </div>

          <button
            className="text-button"
            onClick={() => onNavigate("destinations")}
          >
            Xem module quản lý
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Mã điểm</th>
                <th>Tên điểm du lịch</th>
                <th>Địa chỉ</th>
                <th>Giá vé</th>
                <th>Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {!loading && visibleDestinations.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-cell">
                    {error
                      ? "Không thể tải dữ liệu từ API."
                      : "Không tìm thấy điểm du lịch phù hợp."}
                  </td>
                </tr>
              )}

              {visibleDestinations.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className="code-label">
                      {item.ma}
                    </span>
                  </td>

                  <td>
                    <strong>{item.ten}</strong>
                  </td>

                  <td>{item.dia_chi || "Chưa cập nhật"}</td>

                  <td>{formatCurrency(item.gia_ve_vnd)}</td>

                  <td>
                    <StatusBadge status={item.trang_thai} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
