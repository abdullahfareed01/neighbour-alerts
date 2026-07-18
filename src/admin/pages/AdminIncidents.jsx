import { AlertTriangle } from "lucide-react";
import AdminPlaceholder from "../components/AdminPlaceholder";

export default function AdminIncidents() {
  return (
    <AdminPlaceholder
      icon={AlertTriangle}
      title="Incident Management"
      description="Incident list, filters, and status actions will be implemented in a later phase."
    />
  );
}
