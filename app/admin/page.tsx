import { redirect } from "next/navigation";

/** "Admin" è solo un gruppo di menu: porta alla prima sottovoce. */
export default function AdminIndex() {
  redirect("/admin/users");
}
