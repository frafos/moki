import { useArgs } from "@storybook/client-api";

type TimerangeProps = {
  startDate: number;
  endDate: number;
};

function timerangeHandler() {
  const [, updateArgs] = useArgs();
  return (timerange: [number, number]) => {
    updateArgs({
      startDate: timerange[0],
      endDate: timerange[1],
    });
  };
}

function timerangeProps<T>({ startDate, endDate, ...args }: T & TimerangeProps) {
  return {
    ...args,
    timerange: [startDate, endDate],
    setTimerange: timerangeHandler(),
  };
}

export type { TimerangeProps }
export { timerangeProps }
