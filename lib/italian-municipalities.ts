import municipalitiesData from "@/data/comuni_italiani_province_regioni_istat_2026.json";

type MunicipalitySource = {
  codice_comune_istat: string | null;
  comune: string | null;
  provincia: string | null;
  sigla_provincia: string | null;
  regione: string | null;
};

export type ItalianMunicipality = {
  code: string;
  city: string;
  province: string;
  provinceCode: string;
  region: string;
  label: string;
};

const italianMunicipalities = (municipalitiesData as MunicipalitySource[])
  .map((municipality) => {
    const code = safeMunicipalityString(municipality.codice_comune_istat);
    const city = safeMunicipalityString(municipality.comune);
    const province = safeMunicipalityString(municipality.provincia);
    const provinceCode = safeMunicipalityString(
      municipality.sigla_provincia,
    ).toUpperCase();
    const region = safeMunicipalityString(municipality.regione);

    if (!code || !city || !province || !provinceCode || !region) {
      return null;
    }

    return {
      code,
      city,
      province,
      provinceCode,
      region,
      label: `${city} - (${provinceCode})`,
    };
  })
  .filter((municipality): municipality is ItalianMunicipality => Boolean(municipality));

export function searchItalianMunicipalities(query: string, limit = 12) {
  const normalizedQuery = normalizeMunicipalityValue(query);

  if (!normalizedQuery) {
    return [];
  }

  return italianMunicipalities
    .filter((municipality) => {
      const city = normalizeMunicipalityValue(municipality.city);
      const label = normalizeMunicipalityValue(municipality.label);
      return city.includes(normalizedQuery) || label.includes(normalizedQuery);
    })
    .slice(0, limit);
}

function normalizeMunicipalityValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function safeMunicipalityString(value: string | null | undefined) {
  return typeof value === "string" ? value.trim() : "";
}
