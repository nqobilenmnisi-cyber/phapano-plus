"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import {
  cleanSearchTerm,
  type GlobalSearchResult,
} from "@/lib/global-search";

const RESULT_LIMIT = 5;

export async function searchGlobal(
  input: string
): Promise<GlobalSearchResult[]> {
  const term = cleanSearchTerm(input);
  if (!isSupabaseConfigured || term.length < 2) return [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const pattern = `%${term}%`;
  const [
    peopleResult,
    organisationsResult,
    postsResult,
    programmesResult,
    fundingResult,
    resourcesResult,
  ] = await Promise.all([
    supabase
      .from("community_profiles")
      .select("user_id, display_name, headline, avatar_url")
      .neq("visibility", "hidden")
      .ilike("display_name", pattern)
      .limit(RESULT_LIMIT),
    supabase
      .from("organisation_pages")
      .select("id, name, tagline, avatar_url, is_official")
      .eq("status", "active")
      .or(`name.ilike.${pattern},tagline.ilike.${pattern}`)
      .limit(RESULT_LIMIT),
    supabase
      .from("community_posts")
      .select("id, body, author:community_profiles(display_name, avatar_url)")
      .eq("status", "published")
      .ilike("body", pattern)
      .order("created_at", { ascending: false })
      .limit(RESULT_LIMIT),
    supabase
      .from("programmes")
      .select("id, institution, qualification, stream")
      .or(`institution.ilike.${pattern},stream.ilike.${pattern}`)
      .limit(RESULT_LIMIT),
    supabase
      .from("funding_opportunities")
      .select("id, title, provider")
      .eq("is_published", true)
      .or(`title.ilike.${pattern},provider.ilike.${pattern}`)
      .limit(RESULT_LIMIT),
    supabase
      .from("articles")
      .select("id, title, excerpt")
      .eq("is_published", true)
      .or(`title.ilike.${pattern},excerpt.ilike.${pattern}`)
      .limit(RESULT_LIMIT),
  ]);

  const organisations = (organisationsResult.data ?? []) as {
    id: string;
    name: string;
    tagline: string | null;
    avatar_url: string | null;
    is_official: boolean;
  }[];
  const organisationIds = new Set(organisations.map((page) => page.id));
  const people = ((peopleResult.data ?? []) as {
    user_id: string;
    display_name: string;
    headline: string | null;
    avatar_url: string | null;
  }[]).filter((person) => !organisationIds.has(person.user_id));
  const peopleIds = people.map((person) => person.user_id);
  const { data: verifications } = peopleIds.length
    ? await supabase
        .from("profile_verifications")
        .select("user_id")
        .in("user_id", peopleIds)
    : { data: [] as { user_id: string }[] };
  const verifiedPeople = new Set(
    (verifications ?? []).map((row) => row.user_id as string)
  );

  const posts = (postsResult.data ?? []) as unknown as {
    id: string;
    body: string;
    author:
      | { display_name: string; avatar_url: string | null }
      | { display_name: string; avatar_url: string | null }[]
      | null;
  }[];

  return [
    ...people.map((person) => ({
      id: person.user_id,
      kind: "people" as const,
      title: person.display_name,
      description: person.headline,
      href: `/app/community/member/${person.user_id}`,
      avatarUrl: person.avatar_url,
      verified: verifiedPeople.has(person.user_id),
    })),
    ...organisations.map((page) => ({
      id: page.id,
      kind: "organisations" as const,
      title: page.name,
      description: page.tagline,
      href: `/app/community/member/${page.id}`,
      avatarUrl: page.avatar_url,
      verified: page.is_official,
    })),
    ...posts.map((post) => {
      const author = Array.isArray(post.author) ? post.author[0] : post.author;
      return {
        id: post.id,
        kind: "posts" as const,
        title: author?.display_name ?? "Community post",
        description: post.body.slice(0, 150),
        href: `/app/community/post/${post.id}`,
        avatarUrl: author?.avatar_url ?? null,
        verified: false,
      };
    }),
    ...((programmesResult.data ?? []) as {
      id: string;
      institution: string;
      qualification: string;
      stream: string | null;
    }[]).map((programme) => ({
      id: programme.id,
      kind: "programmes" as const,
      title: programme.institution,
      description: [programme.qualification, programme.stream]
        .filter(Boolean)
        .join(" · "),
      href: `/app/apply/programme/${programme.id}`,
      avatarUrl: null,
      verified: false,
    })),
    ...((fundingResult.data ?? []) as {
      id: string;
      title: string;
      provider: string | null;
    }[]).map((funding) => ({
      id: funding.id,
      kind: "funding" as const,
      title: funding.title,
      description: funding.provider,
      href: `/app/funding/${funding.id}`,
      avatarUrl: null,
      verified: false,
    })),
    ...((resourcesResult.data ?? []) as {
      id: string;
      title: string;
      excerpt: string | null;
    }[]).map((resource) => ({
      id: resource.id,
      kind: "resources" as const,
      title: resource.title,
      description: resource.excerpt,
      href: "/learn",
      avatarUrl: null,
      verified: false,
    })),
  ];
}
