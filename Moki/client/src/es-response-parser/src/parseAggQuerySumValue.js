export default function parseAggQuerySumValue(response) {
    if (response && response.aggregations && response.aggregations.agg) {
        var value = 0;
        for (var i = 0; i < response.aggregations.agg.buckets.length; i++) {
            value = value + response.aggregations.agg.buckets[i].agg.value;
        }
        return value;
    }
    return 0;
}

