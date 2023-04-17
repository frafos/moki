/*
return array of geoip data for cities
*/

export default function parseAggCities(response) {
  if (response && response.aggregations && response.aggregations.cities && response.aggregations.cities.buckets) {
    return response.aggregations.cities.buckets;
  }
  return [];
}
