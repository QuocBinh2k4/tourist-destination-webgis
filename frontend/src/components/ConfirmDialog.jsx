
import { AlertTriangle, Trash2, X } from "lucide-react";

export default function ConfirmDialog({
  open,
  item,
  deleting,
  onCancel,
  onConfirm
}) {
  if (!open || !item) return null;

  return (
    <div className="modal-overlay">
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
      >
        <div className="confirm-icon">
          <AlertTriangle size={30} />
        </div>

        <button
          className="confirm-close"
          onClick={onCancel}
          disabled={deleting}
          aria-label="Đóng"
        >
          <X size={20} />
        </button>

        <h2 id="confirm-title">
          Xác nhận xóa điểm du lịch
        </h2>

        <p id="confirm-description">
          Bạn có chắc chắn muốn xóa điểm du lịch
          <strong> {item.ten}</strong> ({item.ma})?
        </p>

        <p className="confirm-warning">
          Thao tác này xóa dữ liệu vĩnh viễn, bao gồm
          các liên kết loại hình và bản ghi ảnh liên quan.
        </p>

        <div className="confirm-actions">
          <button
            className="dm-btn dm-btn-secondary"
            onClick={onCancel}
            disabled={deleting}
          >
            Hủy
          </button>

          <button
            className="dm-btn dm-btn-danger"
            onClick={onConfirm}
            disabled={deleting}
          >
            <Trash2 size={17} />
            {deleting ? "Đang xóa..." : "Xác nhận xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}
