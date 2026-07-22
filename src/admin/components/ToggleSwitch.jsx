/**
 * admin/components/ToggleSwitch.jsx
 * Small controlled boolean switch for Settings-style preference rows.
 * No admin surface has needed a plain on/off control before now (every
 * other admin input is a <select>, button, or badge), so this is a new,
 * minimal, self-contained primitive rather than reaching for a UI library.
 */
export default function ToggleSwitch({ checked, onChange, disabled = false, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${checked ? "bg-blue-600" : "bg-gray-200 dark:bg-na-hover"}`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition-transform duration-200
          ${checked ? "translate-x-6" : "translate-x-1"}`}
        style={{ height: 18, width: 18 }}
      />
    </button>
  );
}