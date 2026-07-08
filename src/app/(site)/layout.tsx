import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { getAuthState } from "@/lib/queries";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { authed } = await getAuthState();
  return (
    <>
      <SiteHeader authed={authed} />
      <main>{children}</main>
      <SiteFooter authed={authed} />
    </>
  );
}
