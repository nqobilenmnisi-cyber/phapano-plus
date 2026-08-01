import { redirect } from "next/navigation";

export const metadata = { title: "My public profile | Phapano+" };

export default async function MyCommunityProfilePage() {
  redirect("/app/profile?section=community");
}
