export default function Input({ label, textarea, ...props }) {
  return (
    <p>
      <labe>{label}</labe>
      {textarea ? <textarea {...props} /> : <input {...props} />}
    </p>
  );
}
