/*
USE FOR:
histogram

*/
export default function parseHistogramDataAnimation(response) {
    if (response && response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets) {
        var dataFinal = [];
        var result = [];

        for (var i = 0; i < response.aggregations.agg.buckets.length; i++) {
            // agg.value for doc_count
            var dataParse = response.aggregations.agg.buckets[i].agg.buckets;
            for (var j = 0; j < dataParse.length; j++) {
                dataFinal.push({
                    key: dataParse[j].key,
                    doc_count: dataParse[j].doc_count
                });

            }
            result.push({
                time: response.aggregations.agg.buckets[i].key,
                data: dataFinal
            });
            dataFinal = [];
        }
        return result;
    }
    return "";
}


