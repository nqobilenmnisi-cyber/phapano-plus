import type { University, FundingOpportunity, Programme } from "@/types/database";

const d = (offsetDays: number) => {
  const x = new Date();
  x.setDate(x.getDate() + offsetDays);
  return x.toISOString().slice(0, 10);
};
const verified = (ago: number) => {
  const x = new Date();
  x.setDate(x.getDate() - ago);
  return x.toISOString().slice(0, 10);
};

function uni(
  id: string,
  name: string,
  short: string,
  province: string,
  about: string
): University {
  return {
    id,
    name,
    short_name: short,
    province,
    logo_url: null,
    website_url: "https://example.ac.za",
    about,
    source: "Official university postgraduate page",
    source_url: "https://example.ac.za",
    status: "verified",
    last_verified_at: verified(2),
    next_review_due_at: d(7),
    owner: "Applications",
    is_published: true,
    created_at: verified(30),
    updated_at: verified(2),
  };
}

export const DEMO_UNIVERSITIES: University[] = [
  uni("u-uct", "University of Cape Town", "UCT", "Western Cape", "Offers Clinical and Counselling Master's programmes with a strong research focus."),
  uni("u-wits", "University of the Witwatersrand", "Wits", "Gauteng", "Clinical, Counselling and Community-based Master's streams."),
  uni("u-up", "University of Pretoria", "UP", "Gauteng", "Counselling, Clinical and Research Psychology programmes."),
  uni("u-uj", "University of Johannesburg", "UJ", "Gauteng", "Counselling and Community Psychology with applied training."),
  uni("u-su", "Stellenbosch University", "SU", "Western Cape", "Clinical and Research Psychology Master's programmes."),
  uni("u-ukzn", "University of KwaZulu-Natal", "UKZN", "KwaZulu-Natal", "Clinical, Counselling and Research streams."),
  uni("u-ufs", "University of the Free State", "UFS", "Free State", "Clinical and Counselling Psychology programmes."),
  uni("u-ru", "Rhodes University", "Rhodes", "Eastern Cape", "Clinical and Counselling Psychology with a community emphasis."),
];

export function demoProgrammes(universityId: string): Programme[] {
  const base = (
    stream: Programme["stream"],
    title: string,
    closeOffset: number
  ): Programme => ({
    id: `${universityId}-${stream}`,
    university_id: universityId,
    stream,
    title,
    qualification: title,
    duration: "2 years (incl. internship)",
    overview:
      "A professional Master's programme accredited for registration with the HPCSA.",
    opening_date: d(-20),
    closing_date: d(closeOffset),
    selection_week: "Mid to late August",
    interview_process:
      "Shortlisted candidates are invited to a selection week including interviews and group tasks.",
    required_documents:
      "Academic transcripts, CV, motivation letter, two academic references.",
    minimum_requirements:
      "An Honours degree in Psychology with a strong academic record.",
    referee_requirements: "Two academic referees who can speak to your research and clinical potential.",
    application_link: "https://example.ac.za/apply",
    programme_link: "https://example.ac.za/programme",
    source: "Official programme page",
    source_url: "https://example.ac.za/programme",
    status: "verified",
    last_verified_at: verified(2),
    next_review_due_at: d(7),
    owner: "Applications",
    is_published: true,
    created_at: verified(30),
    updated_at: verified(2),
  });

  return [
    base("clinical", "MA Clinical Psychology", 6),
    base("counselling", "MA Counselling Psychology", 18),
  ];
}

function fund(
  id: string,
  title: string,
  provider: string,
  type: FundingOpportunity["type"],
  amount: string,
  closeOffset: number,
  eligibility: string
): FundingOpportunity {
  return {
    id,
    title,
    provider,
    type,
    amount_description: amount,
    eligibility,
    description:
      "A funding opportunity for postgraduate psychology students in South Africa. Sample data for demonstration.",
    closing_date: d(closeOffset),
    link: "https://example.org/funding",
    relevant_streams: ["clinical", "counselling", "research"],
    relevant_stages: ["masters_applicant", "masters_student"],
    source: "Official funding provider",
    source_url: "https://example.org",
    status: "verified",
    last_verified_at: verified(3),
    next_review_due_at: d(7),
    owner: "Funding",
    is_published: true,
    created_at: verified(30),
    updated_at: verified(3),
  };
}

export const DEMO_FUNDING: FundingOpportunity[] = [
  fund("f-nrf", "NRF Postgraduate Scholarship", "National Research Foundation", "scholarship", "Full cost of study", 12, "South African citizens with a strong academic record pursuing a Master's."),
  fund("f-nsfas", "NSFAS Postgraduate Support", "NSFAS", "bursary", "Tuition and allowance", 30, "Students from households meeting the means test."),
  fund("f-firstrand", "FirstRand Foundation Bursary", "FirstRand Foundation", "bursary", "Tuition + stipend", 21, "Postgraduate students in priority fields including psychology."),
  fund("f-conf", "Conference Travel Grant", "NRF KIC", "travel_grant", "Varies", 45, "Postgraduates presenting research at an accredited conference."),
  fund("f-research", "Mental Health Research Grant", "SAMRC", "research_funding", "Project-based", 60, "Research-focused Master's students in mental health."),
];
