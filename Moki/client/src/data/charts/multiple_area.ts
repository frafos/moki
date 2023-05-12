import { randomLcg, randomLogNormal } from "d3";
import { faker } from "@faker-js/faker";
import { dateBetween } from "../utils/date";

interface DataBucket {
  agg2: { value: number };
}

type GeneratorProps = {
  interval: number;
  dateOffset?: number;
} & ChartGeneratorProps;

function generateMultiLineData(
  { seed, startDate, endDate, sample, valueMod, dateOffset = 0, interval }:
    GeneratorProps,
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

export { generateMultiLineData };
