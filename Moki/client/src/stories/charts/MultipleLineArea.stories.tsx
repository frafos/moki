import type { Meta, StoryObj } from "@storybook/react";
import type { TimerangeProps } from "@/stories/utils/timerange";
import { timerangeProps } from "@/stories/utils/timerange";
import { MultipleLineRender, RenderProps } from "@charts/MultipleLine";
import { DAY_TIME } from "@/data/utils/date";
import { genMultiLineData } from "@/data/charts/genMultipleLineArea";
import { parseMultipleLineDataShareAxis } from "@/es-response-parser";
import { getTimeBucketInt } from "@/js/helpers/getTimeBucket";
import { ChartGeneratorProps } from "@/data/types";
import { Colors } from "@/gui";

type ColorScheme = "Default" | "Registrations" | "Incidents";

const COLOR_SCHEME = {
  "Default": Colors,
  "Registrations": ["#caa547", "#A5CA47"],
  "Incidents": ["#caa547", "#69307F"],
};

type FakeDataProps = {
  colorScheme: ColorScheme;
  dataName: string;
  dataDayName: string;
} & ChartGeneratorProps;

type StoryProps = RenderProps & TimerangeProps & FakeDataProps;

const meta: Meta<StoryProps> = {
  title: "charts/MultipleLines/Area",
  tags: ["autodocs"],
  argTypes: {
    colorScheme: {
      options: ["Default", "Registrations", "Incidents"],
      control: { type: "select" },
    },
    sample: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
    startDate: { control: "date" },
    endDate: { control: "date" },
  },
  args: {
    area: true,
    seed: 0,
    colorScheme: "Default",
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
      <MultipleLineRender
        {...{ ...timerangeProps(args), data: parsedData, color }}
      />
    );
  },
};

export default meta;
type Story = StoryObj<StoryProps>;

export const Calls: Story = {
  args: {
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
