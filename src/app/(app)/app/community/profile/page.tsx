import { redirect } from "next/navigation";

export const metadata = { title: "My Community profile | Phapano+" };

export default async function MyCommunityProfilePage() {
  redirect("/app/profile?section=community");
}
