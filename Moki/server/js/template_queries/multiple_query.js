var getTemplate = function (field1, field2, field3, field4, field5, field6, field7, queries, supress, order="_count") {
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
                }
            }
        },

        "aggs": {
            "agg": {
                "terms": {
                    "field": field1,
                    "size": 100,
                    "order": {
                        [order]: "desc"
                    }
                },
                "aggs": {
                    "agg": {
                        "sum_bucket": {
                            "buckets_path": "agg5>1-metric"
                        }
                    },
                    "agg2": {
                        "sum": {
                            "field": field2
                        }
                    },
                    "agg3": {
                        "sum": {
                            "field": field3
                        }
                    },
                    "agg4": {
                        "sum": {
                            "field": field4
                        }
                    },
                    "agg5": {
                        "terms": {
                            "field": field5,
                            "size": 50,
                            "order": {
                                "_key": "desc"
                            }
                        },
                        "aggs": {
                            "1-metric": {
                                "avg": {
                                    "field": field6
                                }
                            }
                        }
                    },
                    "agg6": {
                        "sum": {
                            "field": field7
                        }
                    }
                }
            }
        }


    }
    return template;
}

module.exports = {
    getTemplate: getTemplate
};
