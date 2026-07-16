import { useState } from "react";
import { Eye, EyeOff, Check, AlertCircle } from "lucide-react";

export default function AuthInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  error,
  success,
  autoComplete,
  disabled = false,
}) {
  const [focused,  setFocused]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const isPass    = type === "password";
  const inputType = isPass ? (showPass ? "text" : "password") : type;
  const hasValue  = value && value.length > 0;
  const lifted    = focused || hasValue;

  const borderCls = error
    ? "border-red-400 dark:border-red-500"
    : success
    ? "border-emerald-400 dark:border-emerald-500"
    : focused
    ? "border-blue-500 dark:border-blue-400"
    : "border-gray-200 dark:border-na-border";

  const ringCls = error
    ? "ring-red-400/30"
    : success
    ? "ring-emerald-400/30"
    : "ring-blue-500/25";

  return (
    <div className="relative">
      <div className={`
        relative rounded-xl border-2 transition-all duration-200
        bg-white dark:bg-na-input
        ${borderCls}
        ${focused ? `ring-4 ${ringCls}` : ""}
      `}>
        {/* Floating label */}
        <label
          htmlFor={id}
          className={`
            absolute left-4 pointer-events-none select-none
            transition-all duration-200 font-medium
            ${lifted
              ? "top-2 text-[10px] tracking-wider uppercase"
              : "top-1/2 -translate-y-1/2 text-sm"
            }
            ${error
              ? "text-red-500 dark:text-red-400"
              : focused
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-400 dark:text-slate-500"
            }
          `}
        >
          {label}
        </label>

        {/* Input */}
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoComplete={autoComplete}
          disabled={disabled}
          className={`
            w-full bg-transparent outline-none
            text-gray-900 dark:text-slate-100
            text-sm font-medium
            px-4 ${lifted ? "pt-6 pb-2.5" : "py-4"}
            ${isPass ? "pr-11" : "pr-4"}
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />

        {/* Right icon: show/hide password or status */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isPass && (
            <button
              type="button"
              onClick={() => setShowPass((s) => !s)}
              tabIndex={-1}
              className="p-1 rounded-lg text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
          {!isPass && error   && <AlertCircle size={16} className="text-red-500 dark:text-red-400 shrink-0" />}
          {!isPass && success && <Check        size={16} className="text-emerald-500 shrink-0" />}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1.5 text-xs text-red-500 dark:text-red-400 flex items-center gap-1 ml-1">
          <AlertCircle size={11} />
          {error}
        </p>
      )}
    </div>
  );
}