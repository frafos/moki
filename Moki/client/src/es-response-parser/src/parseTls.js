/*
return avg_count of the aggregations
*/

export default function parseTls(response) {
  var tls_cn = [];
  if (response && response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets.length > 0) {
      tls_cn = response.aggregations.agg.buckets.map(key => key.key);
  }

  return tls_cn;
}
