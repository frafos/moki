/**
 * special parse function for dateheatmap chart
 * @return {Array<{ attr1: number, attr2: string, value: number }>} value
*/
function parseDateHeatmap(response) {
    if (response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets) {
        var heatmapDataParse = response.aggregations.agg.buckets;
        var heatmapDataFinal = [];
        for (var i = 0; i < heatmapDataParse.length; i++) {
            for (var j = 0; j < heatmapDataParse[i].agg.buckets.length; j++) {
                heatmapDataFinal.push({
                    attr1: heatmapDataParse[i].key,
                    attr2: heatmapDataParse[i].agg.buckets[j].key,
                    value: heatmapDataParse[i].agg.buckets[j].doc_count
                });

            }
        }
        return heatmapDataFinal;
    }
    return "";
}

function parseDateHeatmapDecrypt(response){
    parseDateHeatmap(response);
}

export {
    parseDateHeatmap,
    parseDateHeatmapDecrypt
};

