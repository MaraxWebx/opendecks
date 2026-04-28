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
    .map((municipality) => {
      const city = normalizeMunicipalityValue(municipality.city);
      const label = normalizeMunicipalityValue(municipality.label);

      return {
        municipality,
        city,
        label,
        score: municipalitySearchScore(city, label, normalizedQuery),
      };
    })
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (left.score !== right.score) {
        return right.score - left.score;
      }

      return left.city.localeCompare(right.city, "it");
    })
    .map((entry) => entry.municipality)
    .slice(0, limit);
}

export function findItalianMunicipalityByLabel(label: string) {
  const normalizedLabel = normalizeMunicipalityValue(label).replace(/\s*-\s*/g, " ");

  if (!normalizedLabel) {
    return null;
  }

  return (
    italianMunicipalities.find((municipality) => {
      const municipalityLabel = normalizeMunicipalityValue(municipality.label).replace(
        /\s*-\s*/g,
        " "
      );
      return municipalityLabel === normalizedLabel;
    }) || null
  );
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

function municipalitySearchScore(
  city: string,
  label: string,
  query: string,
) {
  if (city === query) {
    return 500;
  }

  if (label === query) {
    return 450;
  }

  if (city.startsWith(query)) {
    return 300;
  }

  if (label.startsWith(query)) {
    return 250;
  }

  if (city.includes(` ${query}`)) {
    return 150;
  }

  if (label.includes(` ${query}`)) {
    return 120;
  }

  if (city.includes(query) || label.includes(query)) {
    return 50;
  }

  return 0;
}
