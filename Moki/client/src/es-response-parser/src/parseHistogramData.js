/*
USE FOR:
histogram

*/
export default function parseHistogramData(response) {
    if (response && response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets) {
        var dataParse = response.aggregations.agg.buckets;
        var dataFinal = [];

        //was agg.value for doc_count
        for (var j = 0; j < dataParse.length; j++) {
            dataFinal.push({
                key: dataParse[j].key,
                doc_count: dataParse[j].doc_count
            });

        }
        return dataFinal;
    }
    return "";
}


