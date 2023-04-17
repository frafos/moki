export default function parseListDataSort(response) {
    if ( response.hits && response.hits.hits[0]  && response.hits.hits[0]._source.attrs  && response.hits.hits[0]._source.attrs.rooms ) {
        
        //rename fields to "key" and "doc_count"
        var result = [];
        var sum = 0;
        response.hits.hits[0]._source.attrs.rooms.sort((a, b) => (a.count < b.count) ? 1 : -1);
        for(var i =0; i < response.hits.hits[0]._source.attrs.rooms.length; i++){
            result.push({
                "key": response.hits.hits[0]._source.attrs.rooms[i].name,
                "doc_count": response.hits.hits[0]._source.attrs.rooms[i].count
            });
            sum = sum+response.hits.hits[0]._source.attrs.rooms[i].count;
        }
        return [result, sum];
    }
    return ["", ""];
}
