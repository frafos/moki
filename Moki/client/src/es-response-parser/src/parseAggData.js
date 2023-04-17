export default function parseAggData(response) {
     if (response && response.aggregations && response.aggregations.agg && response.aggregations.agg.value) {
    var data = response.aggregations.agg.value;

    if(data){
        return Number((data).toFixed(2));
    }
    else{
        return 0;
    }
     } return 0;
}


