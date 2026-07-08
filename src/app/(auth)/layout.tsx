import { Logo } from "@/components/Logo";
import { Suspense } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="mb-8">
        <Logo href="/" size={64} priority />
      </div>
      <div className="card w-full max-w-md p-8">
        <Suspense>{children}</Suspense>
      </div>
      <p className="mt-8 max-w-md text-center text-xs leading-relaxed text-charcoal-soft">
        Phapano is a companion for your psychology journey, not a counselling or
        crisis service.
      </p>
    </div>
  );
}
