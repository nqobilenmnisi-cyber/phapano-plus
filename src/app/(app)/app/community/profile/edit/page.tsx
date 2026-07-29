import { redirect } from "next/navigation";

export const metadata = { title: "Edit Community profile | Phapano+" };

export default async function CommunityProfileEditPage() {
  redirect("/app/profile?section=community#community-settings");
}
