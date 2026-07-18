/**
 * admin/components/AdminPlaceholder.jsx
 * Shared "not built yet" placeholder for admin pages that only have
 * route scaffolding in this phase (Phase 1: foundation only).
 */
export default function AdminPlaceholder({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3 py-20">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/25 flex items-center justify-center mb-1">
          <Icon size={26} className="text-blue-600 dark:text-blue-400" />
        </div>
      )}
      <h2 className="text-lg font-bold text-gray-800 dark:text-slate-100">
        {title}
      </h2>
      <p className="text-sm text-gray-400 dark:text-slate-500 max-w-sm">
        {description ?? "This section will be implemented in a later phase."}
      </p>
    </div>
  );
}
