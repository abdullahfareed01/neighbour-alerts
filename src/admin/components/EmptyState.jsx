/**
 * admin/components/EmptyState.jsx
 * Generic "nothing to show" placeholder for embedding INSIDE an admin
 * card/section (recent incidents, summaries, future incident table, etc).
 *
 * This is deliberately distinct from AdminPlaceholder.jsx, which is a
 * full-page "this section isn't built yet" placeholder used by whole
 * not-yet-implemented admin pages (Incidents, Map, Users, ...). EmptyState
 * is for a *built* section that simply has no data right now.
 */
export default function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-8">
      {Icon && (
        <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-na-hover flex items-center justify-center mb-1">
          <Icon size={20} className="text-gray-400 dark:text-slate-500" />
        </div>
      )}
      <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">
        {title}
      </p>
      {description && (
        <p className="text-xs text-gray-400 dark:text-slate-500 max-w-xs">
          {description}
        </p>
      )}
    </div>
  );
}
