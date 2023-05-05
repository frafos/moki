var getTemplate = function ( field, field2, queries, supress) {
    var template = {
        "size": 0,
        track_total_hits: true,
        "query": {
            "bool": {
                "must": queries,
                "must_not": {
                    "exists": {
                        "field": supress
                    }
                },
                "filter": [
                    { "term": { "attrs.type": "conf-join"   }}
                  ]
            }
        },
        "aggs": {
            "count_bucket": {
                "terms": {
                    "field": field,
                    "size": 500,
                    "order": {
                        "_key": "desc"
                    }
                },
                 "aggs": {
                "type_count": {
                    "cardinality": {
                        "field": field2
                    }
                }
            }
            },
            "avg_count": {
                  "avg_bucket": {
                    "buckets_path": "count_bucket>type_count" 
                  }
            }
        }
    }
    return template;
}

module.exports = {
    getTemplate: getTemplate
};
