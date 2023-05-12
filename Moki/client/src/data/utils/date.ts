import { randomLcg, randomLogNormal } from "d3";

export const MN_TIME = 1000 * 60;
export const HOUR_TIME = MN_TIME * 60;
export const DAY_TIME = HOUR_TIME * 24;

export function dateBetween(
  seed: number,
  start: number,
  end: number,
  interval: number,
  sample: number,
) {
  const randomInterval = randomLogNormal.source(randomLcg(seed))(0, 0.6);
  let date = start;
  const dates = [date];

  for (let i = 0; i < sample; i++) {
    const mod = Math.max(1, Math.floor(randomInterval()));
    date += interval * mod;
    if (date > end) break;
    dates.push(date);
  }

  return dates;
}
