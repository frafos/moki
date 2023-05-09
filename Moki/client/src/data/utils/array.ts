import { faker } from "@faker-js/faker";

export function arrayMaybeRemove(
  array: any[],
  probability: number,
  maxRemove: number,
) {
  return faker.helpers.maybe(() => {
    const removeNb = faker.datatype.number({ min: 1, max: maxRemove });
    return faker.helpers.shuffle(array).slice(0, -removeNb);
  }, { probability }) ?? array;
}
