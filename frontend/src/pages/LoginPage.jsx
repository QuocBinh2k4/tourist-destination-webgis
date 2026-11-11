
import { useState } from "react";
import { LockKeyhole, MapPinned } from "lucide-react";
import { login, getApiError } from "../api/client";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await login(username, password);

      if (!result.success) {
        throw new Error("Đăng nhập thất bại");
      }

      onLogin(result.user);
    } catch (error) {
      setError(getApiError(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <MapPinned size={32} />
        </div>

        <h1>TourismGIS</h1>
        <p>Đăng nhập hệ thống quản lý du lịch</p>

        <label htmlFor="username">Tên đăng nhập</label>
        <input
          id="username"
          required
          autoComplete="username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />

        <label htmlFor="password">Mật khẩu</label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {error && (
          <p role="alert" className="login-error">
            {error}
          </p>
        )}

        <button disabled={loading} type="submit">
          <LockKeyhole size={18} />
          {loading ? "Đang xác thực..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}
