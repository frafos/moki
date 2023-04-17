/*
special parse function for parsing states CA
*/
export default function parseStatesCA(response) {
    if (response && response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets) {
        var heatmapDataParse = response.aggregations.agg.buckets;
        var heatmapDataFinal = [];

        for (var i = 0; i < heatmapDataParse.length; i++) {
            for (var j = 0; j < heatmapDataParse[i].agg.buckets.length; j++) {
                let reachable = 0;
                let unreachable = 0;
                let partially = 0;
                let state = "";

                for (var k = 0; k < heatmapDataParse[i].agg.buckets[j].agg2.buckets.length; k++) {

                    if (heatmapDataParse[i].agg.buckets[j].agg2.buckets[k].key === "reachable" ) {
                        reachable = heatmapDataParse[i].agg.buckets[j].agg2.buckets[k].doc_count;
                    }
                    else if(heatmapDataParse[i].agg.buckets[j].agg2.buckets[k].key === "partially"){
                        partially = heatmapDataParse[i].agg.buckets[j].agg2.buckets[k].doc_count;
                    }
                    else if(heatmapDataParse[i].agg.buckets[j].agg2.buckets[k].key === "unreachable"){
                        unreachable = heatmapDataParse[i].agg.buckets[j].agg2.buckets[k].doc_count;
                    }
                }

                if(reachable !== 0 && unreachable === 0 && partially === 0 ){
                    state = "reachable";
                }
                else if (reachable === 0 && unreachable !== 0 && partially === 0 ){
                    state = "unreachable";
                }
                else if(reachable === 0 && unreachable === 0 && partially === 0){
                    state = "";
                }
                else {
                    state = "partially";
                }

                heatmapDataFinal.push({
                    attr1: heatmapDataParse[i].key,
                    attr2: heatmapDataParse[i].agg.buckets[j].key,
                    value: state
                });
            }
        }
        return heatmapDataFinal;
    }
    return "";
}


