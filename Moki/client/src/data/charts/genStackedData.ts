import { randomLcg, randomNormal } from "d3";
import { faker } from "@faker-js/faker";
import { ESResponse } from "../types";

interface DataBucket {
  key: string;
  doc_count: number;
}

interface GeneratorProps {
  seed: number;
  valueMod: number;
  keys: string[];
}

function genStackedData(
  { seed, valueMod, keys }: GeneratorProps,
): ESResponse<never, DataBucket> | [] {
  if (!keys) return [];
  const randomValue = randomNormal.source(randomLcg(seed))(1, 0.1);
  faker.seed(seed);

  const data = keys.map((key) => {
    const value = faker.helpers.maybe(
      () => faker.helpers.maybe(() => randomValue() * 10) ?? 0,
    ) ?? randomValue() * valueMod;
    return {
      key,
      doc_count: Math.floor(value),
    };
  });

  return { aggregations: { agg: { buckets: data } } };
}

export type { GeneratorProps };
export { genStackedData };
