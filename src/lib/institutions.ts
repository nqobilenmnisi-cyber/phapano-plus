/**
 * South African higher education institutions — public universities and
 * private/independent institutions. Used by the institution autocomplete.
 *
 * Each entry has a canonical `name` and a set of `keywords` (lowercased) used
 * for matching, so typing "wits", "witwatersrand" or "wi" all surface Wits.
 * Free text is still allowed if a user's institution isn't listed.
 */

export interface Institution {
  name: string;
  keywords: string[];
}

export const INSTITUTIONS: Institution[] = [
  // ---- Public universities ----
  { name: "University of the Witwatersrand (Wits)", keywords: ["wits", "witwatersrand", "wi"] },
  { name: "University of Johannesburg (UJ)", keywords: ["uj", "johannesburg"] },
  { name: "University of Pretoria (UP)", keywords: ["up", "pretoria", "tuks"] },
  { name: "University of South Africa (UNISA)", keywords: ["unisa", "south africa", "distance"] },
  { name: "University of Cape Town (UCT)", keywords: ["uct", "cape town"] },
  { name: "Stellenbosch University", keywords: ["stellenbosch", "maties", "su"] },
  { name: "University of the Western Cape (UWC)", keywords: ["uwc", "western cape"] },
  { name: "University of KwaZulu-Natal (UKZN)", keywords: ["ukzn", "kwazulu", "natal", "kzn"] },
  { name: "University of the Free State (UFS)", keywords: ["ufs", "free state", "kovsies"] },
  { name: "North-West University (NWU)", keywords: ["nwu", "north-west", "north west", "potch"] },
  { name: "Rhodes University", keywords: ["rhodes", "ru", "grahamstown", "makhanda"] },
  { name: "Nelson Mandela University", keywords: ["nelson", "mandela", "nmu", "nmmu", "port elizabeth", "gqeberha"] },
  { name: "University of Limpopo", keywords: ["limpopo", "ul", "turfloop"] },
  { name: "University of Venda", keywords: ["venda", "univen"] },
  { name: "University of Zululand", keywords: ["zululand", "unizulu"] },
  { name: "Walter Sisulu University", keywords: ["walter sisulu", "wsu"] },
  { name: "Sefako Makgatho Health Sciences University", keywords: ["sefako", "makgatho", "smu", "medunsa"] },
  { name: "Sol Plaatje University", keywords: ["sol plaatje", "spu", "kimberley"] },
  { name: "University of Mpumalanga", keywords: ["mpumalanga", "ump"] },
  { name: "Durban University of Technology (DUT)", keywords: ["dut", "durban"] },
  { name: "Tshwane University of Technology (TUT)", keywords: ["tut", "tshwane"] },
  { name: "Cape Peninsula University of Technology (CPUT)", keywords: ["cput", "cape peninsula", "peninsula"] },
  { name: "Vaal University of Technology (VUT)", keywords: ["vut", "vaal"] },
  { name: "Central University of Technology (CUT)", keywords: ["cut", "central", "bloemfontein"] },
  { name: "Mangosuthu University of Technology (MUT)", keywords: ["mut", "mangosuthu"] },

  // ---- Private / independent higher education ----
  { name: "IIE Varsity College", keywords: ["varsity", "varsity college", "iie"] },
  { name: "IIE MSA", keywords: ["msa", "monash", "iie msa", "iie"] },
  { name: "IIE Rosebank College", keywords: ["rosebank", "iie rosebank", "iie"] },
  { name: "IIE Vega School", keywords: ["vega", "iie vega", "iie"] },
  { name: "SACAP", keywords: ["sacap", "applied psychology"] },
  { name: "STADIO Higher Education", keywords: ["stadio"] },
  { name: "Eduvos", keywords: ["eduvos"] },
  { name: "Boston City Campus", keywords: ["boston", "boston city"] },
  { name: "Regent Business School", keywords: ["regent"] },
  { name: "Milpark Education", keywords: ["milpark"] },
  { name: "Mancosa", keywords: ["mancosa"] },
  { name: "Regenesys Business School", keywords: ["regenesys"] },
  { name: "Richfield Graduate Institute of Technology", keywords: ["richfield"] },
  { name: "Cornerstone Institute", keywords: ["cornerstone"] },
  { name: "Akademia", keywords: ["akademia"] },
  { name: "Helderberg College of Higher Education", keywords: ["helderberg"] },
  { name: "Lyceum College", keywords: ["lyceum"] },
  { name: "Damelin", keywords: ["damelin"] },
  { name: "IMM Graduate School", keywords: ["imm"] },
  { name: "AFDA", keywords: ["afda"] },
  { name: "Open Window", keywords: ["open window"] },
  { name: "Inscape Education Group", keywords: ["inscape"] },
];

/** Returns up to `limit` institutions matching the query (min 2 chars). */
export function searchInstitutions(query: string, limit = 8): Institution[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const scored: { inst: Institution; score: number }[] = [];
  for (const inst of INSTITUTIONS) {
    const name = inst.name.toLowerCase();
    let score = -1;

    if (name.startsWith(q)) score = 0;
    else if (inst.keywords.some((k) => k.startsWith(q))) score = 1;
    else if (name.includes(q)) score = 2;
    else if (inst.keywords.some((k) => k.includes(q))) score = 3;

    if (score >= 0) scored.push({ inst, score });
  }

  scored.sort((a, b) => a.score - b.score || a.inst.name.localeCompare(b.inst.name));
  return scored.slice(0, limit).map((s) => s.inst);
}
