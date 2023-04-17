/*
special parse function for geoip map
*/
export default function parseGeoipAnimation(response) {

    if (response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets && response.aggregations.agg.buckets) {
        var data = response.aggregations.agg.buckets;
        var dataFinal = [];
        //add real values
        for(var i = 0; i < data.length; i++) {
            if(data[i].key && data[i].agg.buckets.length >0){
                dataFinal.push({
                    time: data[i].key,
                    data: data[i].agg.buckets
                });   
            }            
        }
        return dataFinal;
    }
    return "";
}


