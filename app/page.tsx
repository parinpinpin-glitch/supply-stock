import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default function Home() {
  const session = getSession();
  if (!session) redirect("/login");
  redirect("/dashboard");
}
