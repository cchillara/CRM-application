export default function Status({ value }) {
  const label = value == null || value === "" ? "Not configured" : String(value);
  const className = label.toLowerCase().replaceAll(" ", "-");
  return <span className={`status ${className}`}>{label}</span>;
}
