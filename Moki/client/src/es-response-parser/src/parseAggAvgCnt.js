/*
return avg_count of the aggregations
*/

export default function parseAggAvgCnt(response) {
  if (response &&
          response.aggregations &&
          response.aggregations["avg_count"] &&
          response.aggregations["avg_count"].value) {
    return response.aggregations["avg_count"].value;
  }
  return 0;
}
