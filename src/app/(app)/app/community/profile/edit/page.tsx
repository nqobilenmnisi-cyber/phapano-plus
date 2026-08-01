import { redirect } from "next/navigation";

export const metadata = { title: "Edit public profile | Phapano+" };

export default async function CommunityProfileEditPage() {
  redirect("/app/profile#community-settings");
}
