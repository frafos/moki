/*
Get timestamp bucket for timelines charts
!the same settings in server side
*/

const SEC = 1000;
const MN = 60 * SEC;
const HOUR = 60 * MN;
const DAY = 24 * HOUR;

interface Bucket {
  threshold: number;
  value: number;
  name: string;
  format: string;
}

// ordered increasingly by thresholds
const TIME_BUCKETS: Bucket[] = [
  { threshold: 15 * MN, value: 15 * SEC, name: "15s", format: "%H:%M:%S" },
  { threshold: 1 * HOUR, value: MN, name: "1m", format: "%H:%M" },
  { threshold: 6 * HOUR, value: 5 * MN, name: "5m", format: "%H:%M" },
  { threshold: 12 * HOUR, value: 10 * MN, name: "10m", format: "%H:%M" },
  { threshold: 1 * DAY, value: 30 * MN, name: "30m", format: "%d %b %H:%M" },
  { threshold: 3 * DAY, value: 1 * HOUR, name: "1h", format: "%d %b %H:%M" },
  { threshold: 7 * DAY, value: 3 * HOUR, name: "3h", format: "%d %b %H:%M" },
  { threshold: 30 * DAY, value: 12 * HOUR, name: "12h", format: "%d %b" },
];

function getTimeBucketData<T extends keyof Bucket>(
  timerange: [number, number],
  property: T,
): Bucket[T] {
  const interval = timerange[1] - timerange[0];
  for (const bucket of TIME_BUCKETS) {
    if (interval <= bucket.threshold) {
      return bucket[property];
    }
  }
  return TIME_BUCKETS[TIME_BUCKETS.length - 1][property];
}

export function getTimeBucket(timerange: [number, number]) {
  return getTimeBucketData(timerange, "name");
}

export function getTimeBucketInt(timerange: [number, number]) {
  return getTimeBucketData(timerange, "value");
}

export function getTimeBucketFormat(timerange: [number, number]) {
  return getTimeBucketData(timerange, "format");
}
