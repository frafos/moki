import { randomLcg, randomLogNormal } from "d3";
import { faker } from "@faker-js/faker";
import { dateBetween, HOUR_TIME } from "../utils/date";
import { getTimeBucketInt } from "@/js/helpers/getTimeBucket";
import { arrayMaybeRemove } from "../utils/array";
import { ChartGeneratorProps, ESResponse } from "../types";

interface DataBucket {
  key: number;
  agg: {
    buckets: Array<{
      key: string;
      doc_count: number;
    }>;
  };
}

const TYPES = [
  "error",
  "auth-failed",
  "call-attempt",
  "reg-new",
  "notice",
  "reg-del",
  "reg-expired",
  "call-start",
  "call-end",
];

type Props = {
  types: string[]
} & ChartGeneratorProps;

function genHeatmapData(
  { seed, startDate, endDate, sample, valueMod, types }: Props,
): ESResponse<never, DataBucket> | [] {
  if (sample === 0) return [];
  const randomValue = randomLogNormal.source(randomLcg(seed))(0, 0.8);
  faker.seed(seed);
  const interval = getTimeBucketInt([startDate, endDate]);
  const dates = dateBetween(seed, startDate, endDate, interval, sample);

  const data = dates.map((date: number) => {
    const modifiedTypes = interval <= HOUR_TIME
      ? arrayMaybeRemove(types, 0.4, 4)
      : types;
    const buckets = modifiedTypes.map((type) => ({
      key: type,
      doc_count: Math.floor(randomValue() * valueMod),
    }));
    return ({ key: date, agg: { buckets } });
  });

  return { aggregations: { agg: { buckets: data } } };
}

export { genHeatmapData };
