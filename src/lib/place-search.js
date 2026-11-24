// I normalise text so searches ignore capital letters,
// accents and punctuation.
function normalise(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

// I recognise common plural names and alternative search terms.
const aliases = {
  hospitals: 'hospital',
  restaurants: 'restaurant',
  cafes: 'cafe',
  pharmacies: 'pharmacy',
  'police stations': 'police',
  'police station': 'police',
  'coffee shops': 'cafe',
  'coffee shop': 'cafe',
  chemist: 'pharmacy',
  chemists: 'pharmacy',
};

// I check whether a place is inside the selected map area.
export function isInRegion(place, region) {
  if (!region) return true;

  const longitudeDifference = Math.abs(
    ((place.longitude - region.longitude + 540) % 360) - 180
  );

  return (
    Math.abs(place.latitude - region.latitude) <=
      region.latitudeDelta / 2 &&
    longitudeDifference <= region.longitudeDelta / 2
  );
}

// I search the bundled places locally, without an API request.
export function filterPlaces(
  places,
  searchText = '',
  region = null
) {
  let term = normalise(searchText);

  for (const [from, to] of Object.entries(aliases)) {
    term = term.replace(
      new RegExp(`\\b${from}\\b`, 'g'),
      to
    );
  }

  const words = term.split(' ').filter(Boolean);

  return places.filter((place) => {
    const searchable = normalise(
      [
        place.name,
        place.category,
        place.type,
        place.address,
        place.description,
        ...(place.keywords || []),
      ].join(' ')
    );

    return (
      isInRegion(place, region) &&
      words.every((word) => searchable.includes(word))
    );
  });
}

// I calculate straight-line distance in kilometres.
// This is not a walking distance or a route calculation.
export function distanceKm(a, b) {
  const radians = (degrees) => degrees * Math.PI / 180;

  const latitudeDifference = radians(
    b.latitude - a.latitude
  );

  const longitudeDifference = radians(
    b.longitude - a.longitude
  );

  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(radians(a.latitude)) *
      Math.cos(radians(b.latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return (
    6371 *
    2 *
    Math.atan2(
      Math.sqrt(value),
      Math.sqrt(Math.max(0, 1 - value))
    )
  );
}