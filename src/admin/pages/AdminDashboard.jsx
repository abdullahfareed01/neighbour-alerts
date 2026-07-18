import { LayoutDashboard } from "lucide-react";
import AdminPlaceholder from "../components/AdminPlaceholder";

export default function AdminDashboard() {
  return (
    <AdminPlaceholder
      icon={LayoutDashboard}
      title="Overview Dashboard"
      description="Stats, incident trends, and recent activity will appear here in the next phase."
    />
  );
}
