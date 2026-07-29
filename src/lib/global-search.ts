export type GlobalSearchKind =
  | "people"
  | "organisations"
  | "posts"
  | "programmes"
  | "funding"
  | "resources";

export type GlobalSearchResult = {
  id: string;
  kind: GlobalSearchKind;
  title: string;
  description: string | null;
  href: string;
  avatarUrl: string | null;
  verified: boolean;
};

export const GLOBAL_SEARCH_GROUP_LABELS: Record<GlobalSearchKind, string> = {
  people: "People",
  organisations: "Organisation pages",
  posts: "Community posts",
  programmes: "Universities and programmes",
  funding: "Funding",
  resources: "Learning resources",
};

export const GLOBAL_SEARCH_KIND_ORDER: GlobalSearchKind[] = [
  "people",
  "organisations",
  "posts",
  "programmes",
  "funding",
  "resources",
];

export function cleanSearchTerm(value: string): string {
  return value
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}
