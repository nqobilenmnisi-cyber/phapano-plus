import Link from "next/link";
import Image from "next/image";

/**
 * The Phapano brand mark. Uses the official asset (public/phapano-logo.png) at
 * its true 1:1 aspect ratio with object-contain — never stretched, cropped or
 * squashed. The blue field is part of the official artwork. A bronze "+"
 * denotes the Phapano+ product.
 */
export function Logo({
  href = "/",
  className = "",
  size = 44,
  showPlus = true,
  priority = false,
}: {
  href?: string | null;
  className?: string;
  size?: number;
  showPlus?: boolean;
  priority?: boolean;
}) {
  const inner = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        className="relative inline-block overflow-hidden rounded-[18%]"
        style={{ width: size, height: size }}
      >
        <Image
          src="/phapano-logo.png"
          alt="Phapano"
          width={size}
          height={size}
          priority={priority}
          sizes={`${size}px`}
          className="h-full w-full object-contain"
        />
      </span>
      {showPlus && (
        <span
          aria-hidden="true"
          className="select-none font-sora font-semibold leading-none text-bronze"
          style={{ fontSize: Math.round(size * 0.44) }}
        >
          +
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} aria-label="Phapano+ home" className="inline-flex">
        {inner}
      </Link>
    );
  }
  return inner;
}
