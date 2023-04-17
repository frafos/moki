/*
return distinct value of the aggregations
*/

export default function parseAggDistinct(response) {
  if (response &&
          response.aggregations &&
          response.aggregations.distinct &&
          response.aggregations.distinct.value) {
    return response.aggregations.distinct.value;
  }
  return 0;
}
