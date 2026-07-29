import Link from "next/link";
import { splitPostText } from "@/lib/community-posts";
import type { CommunityMention } from "@/types/database";

function linkedText(text: string, keyPrefix: string) {
  return splitPostText(text).map((part, index) =>
    part.url ? (
      <a
        key={`${keyPrefix}-url-${index}`}
        href={part.url}
        target="_blank"
        rel="noopener noreferrer"
        className="font-semibold text-blue-action underline decoration-blue-action/30 underline-offset-2"
      >
        {part.text}
      </a>
    ) : (
      <span key={`${keyPrefix}-text-${index}`}>{part.text}</span>
    )
  );
}

export function CommunityRichText({
  text,
  mentions = [],
}: {
  text: string;
  mentions?: CommunityMention[];
}) {
  const byToken = new Map(
    mentions.map((mention) => [`@${mention.label}`, mention.mentioned_user_id])
  );
  if (!byToken.size) return <>{linkedText(text, "plain")}</>;
  const escaped = [...byToken.keys()]
    .sort((a, b) => b.length - a.length)
    .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const pattern = new RegExp(`(${escaped})`, "g");
  return (
    <>
      {text.split(pattern).map((part, index) => {
        const memberId = byToken.get(part);
        return memberId ? (
          <Link
            key={`${part}-${index}`}
            href={`/app/community/member/${memberId}`}
            className="font-semibold text-blue-action hover:underline"
          >
            {part}
          </Link>
        ) : (
          linkedText(part, `part-${index}`)
        );
      })}
    </>
  );
}
