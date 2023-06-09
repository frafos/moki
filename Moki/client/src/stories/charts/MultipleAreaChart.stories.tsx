import type { Meta, StoryObj } from "@storybook/react";
import type { TimerangeProps } from "@/stories/utils/timerange";
import { timerangeProps } from "@/stories/utils/timerange";
import MultipleAreaChart, {
  MultipleAreaChartRender,
  MultipleAreaChartRenderProps,
} from "@charts/MultipleAreaChart";
import { DAY_TIME } from "@/data/utils/date";
import { scaleOrdinal } from "d3";
import { genMultiLineData } from "@/data/charts/genMultilineData";
import { parseMultipleLineDataShareAxis } from "@/es-response-parser";
import { getTimeBucketInt } from "@/js/helpers/getTimeBucket";
import { ChartGeneratorProps } from "@/data/types";

type ColorScheme = "Calls" | "Registrations" | "Incidents";

const COLOR_SCHEME = {
  "Calls": scaleOrdinal<string, string>().range(["#caa547", "#30427F"]),
  "Registrations": scaleOrdinal<string, string>().range(["#caa547", "#A5CA47"]),
  "Incidents": scaleOrdinal<string, string>().range(["#caa547", "#69307F"]),
};

type FakeDataProps = {
  colorScheme: ColorScheme;
  dataName: string;
  dataDayName: string;
} & ChartGeneratorProps;

type StoryProps = MultipleAreaChartRenderProps & TimerangeProps & FakeDataProps;


const meta: Meta<StoryProps> = {
  title: "charts/MultipleArea",
  component: MultipleAreaChart,
  tags: ["autodocs"],
  argTypes: {
    colorScheme: {
      options: ["Calls", "Registrations", "Incidents"],
      control: { type: "select" },
    },
    sample: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
    startDate: { control: "date" },
    endDate: { control: "date" },
  },
  args: {
    seed: 0,
    colorScheme: "Calls",
    startDate: Date.now(),
    endDate: Date.now() + DAY_TIME * 15,
    sample: 20,
    valueMod: 10,
  },
  render: ({ colorScheme, dataName, dataDayName, ...args }) => {
    const color = COLOR_SCHEME[colorScheme];
    const interval = getTimeBucketInt([args.startDate, args.endDate]);
    const data = genMultiLineData({ ...args, interval });
    const dataDay = genMultiLineData({
      ...args,
      interval,
      dateOffset: DAY_TIME,
      endDate: args.endDate - DAY_TIME,
    });
    const parsedData = parseMultipleLineDataShareAxis(
      dataName,
      data,
      dataDayName,
      dataDay,
    );
    return (
      <MultipleAreaChartRender
        {...{ ...timerangeProps(args), data: parsedData, color }}
      />
    );
  },
};

export default meta;
type Story = StoryObj<StoryProps>;

export const Calls: Story = {
  args: {
    colorScheme: "Calls",
    dataName: "Calls",
    dataDayName: "Calls-1d",
    name: "PARALLEL CALLS",
    units: "count",
  },
};

export const Registrations: Story = {
  args: {
    seed: 1,
    colorScheme: "Registrations",
    endDate: Date.now() + DAY_TIME * 8,
    dataName: "Regs",
    dataDayName: "Regs-1d",
    name: "PARALLEL REGS",
    units: "count",
  },
};

export const Incidents: Story = {
  args: {
    seed: 2,
    colorScheme: "Incidents",
    endDate: Date.now() + DAY_TIME * 5,
    dataName: "Incident",
    dataDayName: "Incident-1d",
    name: "INCIDENTS",
    units: "count",
  },
};
