
export default function StatCard({
  title,
  value,
  icon: Icon,
  color = "blue",
  description
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${color}`}>
          <Icon size={23} />
        </span>
      </div>

      <div className="stat-content">
        <p className="stat-title">{title}</p>

        <h2 className="stat-value">
          {value}
        </h2>

        <p className="stat-description">
          {description}
        </p>
      </div>
    </div>
  );
}
