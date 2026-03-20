export type BrewFormulaData = {
  name: string;
  desc: string;
  homepage: string;
  versions: { stable: string };
  urls: { stable: { url: string } };
};

export type BrewAnalyticsData = {
  formulae: Record<string, Array<{ formula: string; count: string }>>;
  total_items: number;
};

export async function fetchBrewFormula(name: string): Promise<BrewFormulaData | null> {
  try {
    const res = await fetch(`https://formulae.brew.sh/api/formula/${name}.json`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

let _analyticsCache: Map<string, number> | null = null;

export async function getBrewInstalls30d(): Promise<Map<string, number>> {
  if (_analyticsCache) return _analyticsCache;
  try {
    const res = await fetch("https://formulae.brew.sh/api/analytics/install/30d.json", {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return new Map();
    const data: BrewAnalyticsData = await res.json();
    const map = new Map<string, number>();
    for (const [formulaName, entries] of Object.entries(data.formulae)) {
      const total = entries.reduce((sum, e) => sum + parseInt(e.count.replace(/,/g, ""), 10), 0);
      map.set(formulaName, total);
    }
    _analyticsCache = map;
    return map;
  } catch {
    return new Map();
  }
}
