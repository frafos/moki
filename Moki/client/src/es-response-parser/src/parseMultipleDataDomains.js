/*
response2 is events rate that is from collectd index and can't be in one query

*/
export default function parseMultipleDataDomains(response, response2, countEvents, hours) {
    if (response && response.aggregations && response.aggregations.agg && response.aggregations.agg.buckets && response2 && response2.aggregations && response2.aggregations.agg && response2.aggregations.agg.buckets) {
        var dataParse = response.aggregations.agg.buckets;
        var dataParse2 = response2.aggregations.agg.buckets;
        var dataFinal = [];
        var rate = 0;

        for (var j = 0; j < dataParse.length; j++) {
            for (var i = 0; i < dataParse2.length; i++) {
                if (dataParse[j].key === dataParse2[i].key) {
                    if (countEvents.hits && countEvents.hits.total && countEvents.hits.total.value && dataParse2[i].agg && dataParse2[i].agg.value) {

                        let total = countEvents.hits.total.value;
                        let contacts = dataParse2[i].agg.value;
                        hours = Math.round(hours * 100) / 100;
                        rate = (total / contacts) / hours;
                    }
                }
            }
            var values = {};
            values.value1 = rate;
            if (dataParse[j].agg3.value) {
                values.value2 = dataParse[j].agg3.value;
            }
            if (dataParse[j].agg4.value) {
                values.value3 = dataParse[j].agg4.value;
            }
            if (dataParse[j].agg5.value) {
                values.value4 = dataParse[j].agg5.value;
            }
            if (dataParse[j].agg6.value) {
                values.value5 = dataParse[j].agg6.value;
            }
            dataFinal.push({
                name: dataParse[j].key,
                values: values
            });
            values = [];
        }
        return dataFinal;
    }
    return "";
}


