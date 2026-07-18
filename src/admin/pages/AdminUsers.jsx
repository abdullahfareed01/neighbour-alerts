import { Users } from "lucide-react";
import AdminPlaceholder from "../components/AdminPlaceholder";

export default function AdminUsers() {
  return (
    <AdminPlaceholder
      icon={Users}
      title="User Management"
      description="User list, search, filters, and account actions will be implemented in a later phase."
    />
  );
}
