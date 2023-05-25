import { randomLcg, randomLogNormal } from "d3";
import { faker } from "@faker-js/faker";
import { dateBetween } from "../utils/date";
import { ChartGeneratorProps, ESResponse } from "../types";
import { getTimeBucketInt } from "@/js/helpers/getTimeBucket";

interface DataBucket {
  key: string;
  "2": {
    buckets: Array<{
      key: number;
      "1": { value: number };
    }>;
  };
}

type GeneratorProps =
  & { keys: string[]; packed?: number; increaseRate?: number }
  & ChartGeneratorProps;

function genMultipleLineData(
  {
    seed,
    startDate,
    endDate,
    sample,
    keys,
    valueMod,
    packed = 4,
    increaseRate = 0.5,
  }: GeneratorProps,
): ESResponse<never, DataBucket> | [] {
  if (sample === 0) return [];

  const randomValue = randomLogNormal.source(randomLcg(seed))(1, 0.01);
  faker.seed(seed);
  const interval = getTimeBucketInt([startDate, endDate]) / packed;
  const dates = dateBetween(seed, startDate, endDate, interval, sample);

  const data = keys.map((name: string) => {
    let value = randomValue() * valueMod;
    const incrMod = faker.helpers.maybe(() => randomValue() * 1.3, {
      probability: 0.3,
    }) ?? 1;

    const buckets = dates.map((date: number) => {
      let incr = randomValue() * 0.1 * incrMod;
      incr = faker.helpers.maybe(() =>
        incr * randomValue() * 3 * increaseRate, { probability: 0.4 }) ??
        incr;
      incr = faker.helpers.maybe(() =>
        -incr, { probability: 0.3 }) ?? incr;
      value += incr;

      return {
        key: date,
        "1": { value: Math.floor(value) },
      };
    });
    return ({ key: name, "2": { buckets } });
  });

  return { aggregations: { agg: { buckets: data } } };
}

export type { GeneratorProps };
export { genMultipleLineData };
