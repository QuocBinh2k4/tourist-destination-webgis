import { useCallback, useEffect, useState } from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import ModulePlaceholder from "./pages/ModulePlaceholder";

import DiemDuLichPage from "./pages/DiemDuLichPage";
import WebGISPage from "./pages/WebGISPage";

import { getDiemDuLich, getLoaiHinh, checkHealth } from "./api/client";
import PhanTichPage from "./pages/PhanTichPage";
import CoSoDichVuPage from "./pages/CoSoDichVuPage";
import LoaiDichVuPage from "./pages/LoaiDichVuPage";
import ThongKePage from "./pages/ThongKePage";
import ThieuDichVuPage from "./pages/ThieuDichVuPage";

// Thông tin các trang
const pageInfo = {
  dashboard: {
    title: "Tổng quan",
    subtitle: "Bảng điều khiển hệ thống TourismGIS",
  },
  destinations: {
    title: "Quản lý điểm du lịch",
    subtitle: "Quản lý thông tin và vị trí điểm du lịch",
  },
  categories: {
    title: "Loại hình du lịch",
    subtitle: "Danh mục phân loại điểm du lịch",
  },
  services: {
    title: "Cơ sở dịch vụ",
    subtitle: "Quản lý các cơ sở phục vụ du lịch",
  },
  map: {
    title: "Bản đồ WebGIS",
    subtitle: "Trực quan hóa dữ liệu không gian",
  },
  analysis: {
    title: "Phân tích không gian",
    subtitle: "Phân tích vùng đệm và khả năng tiếp cận",
  },

  "service-types": {
    title: "Quản lý loại dịch vụ",
    subtitle: "Danh mục phân loại các cơ sở dịch vụ",
  },
  statistics: {
    title: "Thống kê và biểu đồ",
    subtitle: "Phân tích dữ liệu thống kê du lịch",
  },
  "service-gaps": {
    title: "Khu vực thiếu dịch vụ",
    subtitle: "Phân tích sự phân bố và thiếu hụt dịch vụ",
  },
};

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [destinations, setDestinations] = useState([]);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [connected, setConnected] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Hàm tải dữ liệu từ Backend
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Kiểm tra kết nối Backend
      const health = await checkHealth();

      if (!health.success) {
        throw new Error("Không kết nối được Backend");
      }

      setConnected(true);

      // Lấy dữ liệu điểm và loại hình
      const [diemResponse, loaiResponse] = await Promise.all([
        getDiemDuLich(),
        getLoaiHinh(),
      ]);

      if (!diemResponse.success || !loaiResponse.success) {
        throw new Error("API trả về dữ liệu không hợp lệ");
      }

      if (
        !Array.isArray(diemResponse.data) ||
        !Array.isArray(loaiResponse.data)
      ) {
        throw new Error("Dữ liệu API không phải danh sách");
      }

      setDestinations(diemResponse.data);
      setCategories(loaiResponse.data);
    } catch (err) {
      console.error("TourismGIS API:", err);

      setConnected(false);
      setDestinations([]);
      setCategories([]);

      setError(
        "Không thể tải dữ liệu. Hãy kiểm tra Backend " +
          "ở cổng 5000 và kết nối PostgreSQL.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Tải dữ liệu khi mở trang
  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentPage = pageInfo[activePage] || pageInfo.dashboard;

  function changePage(page) {
    setActivePage(page);

    // Tự động xóa từ khóa khi chuyển trang
    setSearch("");
  }

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        onChangePage={changePage}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="main-layout">
        <Header
          title={currentPage.title}
          subtitle={currentPage.subtitle}
          onOpenMenu={() => setMobileOpen(true)}
          connected={connected}
          search={search}
          onSearchChange={setSearch}
          onRefresh={loadData}
          refreshing={loading}
          showSearch={activePage === "dashboard"}
        />

        <main className="main-content">
          {activePage === "dashboard" ? (
            <Dashboard
              destinations={destinations}
              categories={categories}
              search={search}
              loading={loading}
              error={error}
              onRefresh={loadData}
              onNavigate={changePage}
            />
          ) : activePage === "destinations" ? (
            <DiemDuLichPage onDataChanged={loadData} />
          ) : activePage === "services" ? (
            <CoSoDichVuPage />
          ) : activePage === "service-types" ? (
            <LoaiDichVuPage />
          ) : activePage === "map" ? (
            <WebGISPage />
          ) : activePage === "analysis" ? (
            <PhanTichPage />
          ) : activePage === "statistics" ? (
            <ThongKePage />
          ) : activePage === "service-gaps" ? (
            <ThieuDichVuPage />
          ) : (
            <ModulePlaceholder
              title={currentPage.title}
              description={currentPage.subtitle}
              onBack={() => changePage("dashboard")}
            />
          )}
        </main>

        <footer className="app-footer">
          TourismGIS · Hệ thống quản lý và phân tích không gian
        </footer>
      </div>
    </div>
  );
}
