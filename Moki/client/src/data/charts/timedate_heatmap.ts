import { randomLcg, randomLogNormal } from "d3";
import { faker } from "@faker-js/faker";
import { dateBetween, HOUR_TIME } from "../utils/date";
import { getTimeBucketInt } from "@/js/helpers/getTimeBucket";
import { arrayMaybeRemove } from "../utils/array";

interface Response {
  aggregations: {
    agg: {
      buckets: {
        key: number;
        agg: {
          buckets: {
            key: string;
            doc_count: number;
          }[];
        };
      }[];
    };
  };
}

interface GeneratorProps {
  seed: number;
  startDate: number;
  endDate: number;
  sample: number;
  valueMod: number;
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

function generateHeatmapData(
  { seed, startDate, endDate, sample, valueMod }: GeneratorProps,
): Response {
  const randomValue = randomLogNormal.source(randomLcg(seed))(0, 0.8);
  faker.seed(seed);
  const interval = getTimeBucketInt([startDate, endDate]);
  const dates = dateBetween(seed, startDate, endDate, interval, sample);

  const data = dates.map((date: number) => {
    const types = interval <= HOUR_TIME
      ? arrayMaybeRemove(TYPES, 0.4, 4)
      : TYPES;
    const buckets = types.map((type) => ({
      key: type,
      doc_count: Math.floor(randomValue() * valueMod),
    }));
    return ({ key: date, agg: { buckets } });
  });

  return { aggregations: { agg: { buckets: data } } };
}

export { generateHeatmapData };
