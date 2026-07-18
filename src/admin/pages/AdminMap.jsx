import { Map } from "lucide-react";
import AdminPlaceholder from "../components/AdminPlaceholder";

export default function AdminMap() {
  return (
    <AdminPlaceholder
      icon={Map}
      title="Admin Incident Map"
      description="A lightweight, filterable incident map (separate from the user-facing CrimeMap) will be implemented in a later phase."
    />
  );
}
