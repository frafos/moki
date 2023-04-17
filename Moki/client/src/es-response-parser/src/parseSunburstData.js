/*
special parse function for sunburst chart
*/

export default function parseSunburstData(response) {
    if (response && response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets) {
        var sunburstDataParse = response.aggregations.agg.buckets;
        var innerData = [];
        var sunburstData = [];
        console.log( JSON.stringify(sunburstDataParse));
        for (var i = 0; i < sunburstDataParse.length; i++) {
            for (var j = 0; j < sunburstDataParse[i].agg.buckets.length; j++) {
                innerData.push({
                    key: sunburstDataParse[i].agg.buckets[j].key,
                    value: sunburstDataParse[i].agg.buckets[j].doc_count
                });

            }
            sunburstData.push({
                key: sunburstDataParse[i].key,
                value: sunburstDataParse[i].doc_count,
                children: innerData
            });
            innerData = [];
        }

        sunburstData = {
            key: "data",
            children: sunburstData
        };
        return sunburstData;
    }
    return "";
}
