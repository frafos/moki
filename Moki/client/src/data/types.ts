interface ESResponse<InnerHits, InnerAggregation> {
  hits?: {
    total: number;
    hits: Array<InnerHits>;
  };
  aggregations?: {
    agg: {
      buckets: Array<InnerAggregation>
    };
  };
}

interface ChartGeneratorProps {
  startDate: number;
  endDate: number;
  seed: number;
  valueMod: number;
  sample: number;
}

export type { ESResponse, ChartGeneratorProps }
