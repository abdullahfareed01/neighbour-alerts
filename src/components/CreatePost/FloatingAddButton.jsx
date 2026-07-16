import { Plus } from "lucide-react";

export default function FloatingAddButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Report an incident"
      className="fixed bottom-6 right-6 z-[998] w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 group"
      style={{ animation: "fabIn 0.4s cubic-bezier(.22,.68,0,1.3) both" }}
    >
      <Plus size={26} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-200" />
      <span className="absolute inset-0 rounded-full bg-blue-400 opacity-20 animate-ping" />
      <style>{`
        @keyframes fabIn {
          from { opacity:0; transform:scale(0.4) rotate(-45deg); }
          to   { opacity:1; transform:scale(1)   rotate(0deg); }
        }
      `}</style>
    </button>
  );
}