
function errorHandler(err, req, res, next) {
  console.error("API Error:", err);

  // Trùng mã hoặc giá trị UNIQUE
  if (err.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "Mã hoặc thông tin đã tồn tại"
    });
  }

  // Vi phạm khóa ngoại
  if (err.code === "23503") {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu tham chiếu không tồn tại hoặc đang được sử dụng"
    });
  }

  // Vi phạm ràng buộc CHECK
  if (err.code === "23514") {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu không đáp ứng ràng buộc CSDL"
    });
  }

  // Giá trị không đúng kiểu dữ liệu PostgreSQL
  if (["22P02", "22003", "22007", "22008"].includes(err.code)) {
    return res.status(400).json({
      success: false,
      message: "Kiểu hoặc giá trị dữ liệu không hợp lệ"
    });
  }

  const status = err.status || 500;

  res.status(status).json({
    success: false,
    message: status === 500
      ? "Lỗi máy chủ"
      : err.message
  });
}

module.exports = errorHandler;
