export default function parseDistinctDataAnimation(response) {
    if (response && response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets) {
        var result = [];

        for (var i = 0; i < response.aggregations.agg.buckets.length; i++) {
            // agg.value for doc_count
            var dataParse = response.aggregations.agg.buckets[i];
            result.push({
                time: response.aggregations.agg.buckets[i].key,
                data: dataParse.distinct.value
            });
        }
        return result;
    }
    return "";
}


