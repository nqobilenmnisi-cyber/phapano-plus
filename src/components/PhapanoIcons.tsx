import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  title?: string;
};

function IconFrame({
  title,
  children,
  ...props
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

const line = {
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function HeartIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M12 20.2 4.8 13.4C1.2 10 3.1 4.5 7.5 4.5c2 0 3.6 1.1 4.5 2.5.9-1.4 2.5-2.5 4.5-2.5 4.4 0 6.3 5.5 2.7 8.9L12 20.2Z"
        {...line}
      />
    </IconFrame>
  );
}

export function LightbulbIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="M8.2 14.7A6 6 0 1 1 15.8 14.7c-.9.7-1.3 1.5-1.3 2.3h-5c0-.8-.4-1.6-1.3-2.3Z"
        {...line}
      />
      <path d="M9.6 20h4.8M10 17h4" {...line} />
      <path d="M12 1.8V.8M4.9 4.9l-.8-.8M19.1 4.9l.8-.8M2 11H.9M23.1 11H22" {...line} />
    </IconFrame>
  );
}

export function CelebrateIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <g transform="rotate(-8 7.5 13)">
        <path d="M10.7 19.7c-2.8-.5-4.7-2.2-5.4-4.8l-1-3.8a1.15 1.15 0 0 1 2.2-.6l.7 2.4" {...line} />
        <path d="m7.2 12.9-1.4-5a1.15 1.15 0 0 1 2.2-.6l1.2 4.5" {...line} />
        <path d="m9.2 11.8-.9-5.3a1.15 1.15 0 0 1 2.3-.4l.8 4.8" {...line} />
        <path d="m11.4 10.9-.2-3.8a1.15 1.15 0 0 1 2.3-.1l.3 5.8c.2 3.5-1 5.8-3.1 6.9Z" {...line} />
      </g>
      <g transform="translate(24 0) scale(-1 1) rotate(-8 7.5 13)">
        <path d="M10.7 19.7c-2.8-.5-4.7-2.2-5.4-4.8l-1-3.8a1.15 1.15 0 0 1 2.2-.6l.7 2.4" {...line} />
        <path d="m7.2 12.9-1.4-5a1.15 1.15 0 0 1 2.2-.6l1.2 4.5" {...line} />
        <path d="m9.2 11.8-.9-5.3a1.15 1.15 0 0 1 2.3-.4l.8 4.8" {...line} />
        <path d="m11.4 10.9-.2-3.8a1.15 1.15 0 0 1 2.3-.1l.3 5.8c.2 3.5-1 5.8-3.1 6.9Z" {...line} />
      </g>
      <path d="M12 3V1M8.8 3.8 7.6 2.2M15.2 3.8l1.2-1.6" {...line} />
    </IconFrame>
  );
}

export function CommentIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M20 11.4a7.7 7.7 0 0 1-8 7.4 8.8 8.8 0 0 1-3.1-.6L4 20l1.3-4A7 7 0 0 1 4 11.9C4 7.6 7.6 4 12 4s8 3.3 8 7.4Z" {...line} />
    </IconFrame>
  );
}

export function PassOnIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M18.7 9A7 7 0 0 0 6.5 5.8L4.6 8" {...line} />
      <path d="M4.7 4.5 4.6 8l3.5.1" {...line} />
      <path d="M5.3 15A7 7 0 0 0 17.5 18.2l1.9-2.2" {...line} />
      <path d="m19.3 19.5.1-3.5-3.5-.1" {...line} />
    </IconFrame>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M12 15V4M7.5 8.5 12 4l4.5 4.5" {...line} />
      <path d="M5 13v6h14v-6" {...line} />
    </IconFrame>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="10.8" cy="10.8" r="6.4" {...line} />
      <path d="m15.6 15.6 4 4" {...line} />
    </IconFrame>
  );
}

export function PostIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <circle cx="12" cy="12" r="8.5" {...line} />
      <path d="M12 8v8M8 12h8" {...line} />
    </IconFrame>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" {...line} />
      <path d="M10 20a2 2 0 0 0 4 0" {...line} />
    </IconFrame>
  );
}

export function BookmarkIcon({ filled = false, ...props }: IconProps & { filled?: boolean }) {
  return (
    <IconFrame {...props}>
      <path
        d="M6.5 4.2h11v15.6L12 16.4l-5.5 3.4V4.2Z"
        fill={filled ? "currentColor" : "none"}
        {...line}
      />
    </IconFrame>
  );
}

export function VerifiedIcon(props: IconProps) {
  return (
    <IconFrame {...props}>
      <path
        d="m12 2 2.2 1.5 2.7-.1.8 2.5 2.2 1.6-.9 2.5.9 2.5-2.2 1.6-.8 2.5-2.7-.1L12 18l-2.2-1.5-2.7.1-.8-2.5-2.2-1.6L5 10l-.9-2.5 2.2-1.6.8-2.5 2.7.1L12 2Z"
        fill="currentColor"
      />
      <path d="m8.8 10.1 2 2 4.3-4.4" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </IconFrame>
  );
}
