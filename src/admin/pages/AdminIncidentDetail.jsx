import { useParams } from "react-router-dom";
import { FileText } from "lucide-react";
import AdminPlaceholder from "../components/AdminPlaceholder";

export default function AdminIncidentDetail() {
  const { id } = useParams();
  return (
    <AdminPlaceholder
      icon={FileText}
      title={`Incident Details${id ? ` — ${id}` : ""}`}
      description="Full incident detail, reporter info, map, and admin actions will be implemented in a later phase."
    />
  );
}
