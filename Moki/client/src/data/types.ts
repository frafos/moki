interface ESResponse<InnerHits, InnerAggregation> {
  hits?: {
    total: number;
    hits: Array<InnerHits>;
  };
  aggregations?: {
    agg: {
      buckets: Array<{
        key: number;
        agg: {
          buckets: Array<InnerAggregation>;
        };
      }>;
    };
  };
}

interface ChartGeneratorProps {
  seed: number;
  startDate: number;
  endDate: number;
  sample: number;
  valueMod: number;
  dateOffset?: number;
  interval?: number;
}
