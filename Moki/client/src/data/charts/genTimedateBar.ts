import { randomLcg, randomNormal } from "d3";
import { faker } from "@faker-js/faker";
import { ChartGeneratorProps, ESResponse } from "../types";
import { getTimeBucketInt } from "@/js/helpers/getTimeBucket";
import { dateBetween } from "../utils/date";

interface DataBucket {
  key: number;
  agg: {
    value: number;
  };
}

type GeneratorProps = {
  seed: number;
  valueMod: number;
} & ChartGeneratorProps;

function genTimedateBarData(
  { seed, startDate, endDate, sample, valueMod }: GeneratorProps,
): ESResponse<never, DataBucket> | [] {
  if (sample === 0) return [];

  const randomValue = randomNormal.source(randomLcg(seed))(1, 0.3);
  faker.seed(seed);

  const interval = getTimeBucketInt([startDate, endDate]);
  const dates = dateBetween(seed, startDate, endDate, interval, sample);

  const data = dates.map((date: number) => {
    return ({
      key: date,
      agg: { value: randomValue() * valueMod },
    });
  });

  return { aggregations: { agg: { buckets: data } } };
}

export type { GeneratorProps };
export { genTimedateBarData };
