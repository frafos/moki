export default function parseListDataOrder(response) {
    if (response.hits.hits[0] && response.hits.hits[0]._source.attrs && response.hits.hits[0]._source.attrs.rooms) {
        var data = response.hits.hits[0]._source.attrs.rooms;
        data.sort((a, b) => (a.count > b.count) ? 1 : -1);

        return data.slice(0,10);
    }
    return ["", ""];
}
