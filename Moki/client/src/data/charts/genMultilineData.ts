import { randomLcg, randomLogNormal } from "d3";
import { faker } from "@faker-js/faker";
import { dateBetween } from "../utils/date";
import { ChartGeneratorProps, ESResponse } from "../types";

interface DataBucket {
  key: number;
  agg: {
    buckets: Array<{
      agg2: { value: number };
    }>;
  };
}

type Props = {
  interval: number;
  dateOffset?: number;
} & ChartGeneratorProps;

function genMultiLineData(
  { seed, startDate, endDate, sample, valueMod, dateOffset = 0, interval }:
    Props,
): ESResponse<never, DataBucket> {
  const randomValue = randomLogNormal.source(randomLcg(seed))(0, 0.8);
  faker.seed(seed);
  const dates = dateBetween(
    seed,
    Math.max(startDate, startDate + dateOffset),
    Math.min(endDate, endDate + dateOffset),
    interval,
    sample,
  );

  const data = dates.map((date: number) => {
    const buckets = [{
      agg2: { value: Math.floor(randomValue() * valueMod) },
    }];
    return ({ key: date, agg: { buckets } });
  });

  return { aggregations: { agg: { buckets: data } } };
}

export { genMultiLineData };
