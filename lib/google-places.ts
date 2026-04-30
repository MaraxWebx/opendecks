declare global {
  interface Window {
    google?: any;
    __googleMapsPlacesPromise?: Promise<void>;
  }
}

export type CityAutocompleteOption = {
  code: string;
  city: string;
  province: string;
  provinceCode: string;
  region: string;
  label: string;
};

export function loadGoogleMapsPlaces(apiKey: string) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Window non disponibile."));
  }

  if (window.google?.maps?.places) {
    return Promise.resolve();
  }

  if (window.__googleMapsPlacesPromise) {
    return window.__googleMapsPlacesPromise;
  }

  window.__googleMapsPlacesPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Script Google Maps non caricato."));
    document.head.appendChild(script);
  });

  return window.__googleMapsPlacesPromise;
}

export function buildCityAutocompleteOptionFromPlace(
  place: any,
): CityAutocompleteOption | null {
  const components = Array.isArray(place?.address_components)
    ? place.address_components
    : [];

  const city =
    findAddressComponent(components, "locality")?.long_name ||
    findAddressComponent(components, "postal_code")?.long_name ||
    findAddressComponent(components, "postal_town")?.long_name ||
    findAddressComponent(components, "administrative_area_level_3")?.long_name ||
    findAddressComponent(components, "administrative_area_level_2")?.long_name ||
    safePlaceString(place?.formatted_address)?.split(",")[0]?.trim() ||
    safePlaceString(place?.name);

  const provinceCode =
    findAddressComponent(components, "administrative_area_level_2")?.short_name ||
    findAddressComponent(components, "administrative_area_level_1")?.short_name ||
    findAddressComponent(components, "country")?.short_name;

  const region =
    findAddressComponent(components, "administrative_area_level_1")?.long_name ||
    findAddressComponent(components, "administrative_area_level_2")?.long_name ||
    findAddressComponent(components, "country")?.long_name ||
    "";

  if (!city || !provinceCode) {
    return null;
  }

  return {
    code: safePlaceString(place?.place_id) || `${city}-${provinceCode}`,
    city,
    province: provinceCode,
    provinceCode,
    region,
    label: `${city} - (${provinceCode})`,
  };
}

function findAddressComponent(components: any[], type: string) {
  return components.find((component) =>
    Array.isArray(component?.types) ? component.types.includes(type) : false,
  );
}

function safePlaceString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}
