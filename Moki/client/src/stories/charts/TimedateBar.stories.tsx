import type { Meta, StoryObj } from "@storybook/react";
import { RenderProps, TimedateBarRender } from "@charts/TimedateBar";
import { timerangeProps } from "@/stories/utils/timerange";
import type { TimerangeProps } from "@/stories/utils/timerange";
import { ChartGeneratorProps } from "@/data/types";
import { DAY_TIME } from "@/data/utils/date";
import { genTimedateBarData } from "@/data/charts/genTimedateBarData";
import { parseBucketData } from "@/es-response-parser";
import { scaleOrdinal } from "d3";
import { Colors } from "@/gui";

type StoryProps =
  & RenderProps
  & TimerangeProps
  & ChartGeneratorProps;

const meta: Meta<StoryProps> = {
  title: "charts/TimedateBar",
  tags: ["autodocs"],
  argTypes: {
    startDate: { control: "date" },
    endDate: { control: "date" },
    sample: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
  },
  args: {
    seed: 0,
    valueMod: 1000,
    startDate: Date.now() - DAY_TIME * 15,
    endDate: Date.now(),
  },
  render: (args) => {
    const data = genTimedateBarData({ ...args });
    const parsedData = parseBucketData(data);
    return (
      <TimedateBarRender
        {...{
          ...timerangeProps(args),
          data: parsedData,
          mapColor: (_value: number) => (scaleOrdinal(Colors)("0")),
        }}
      />
    );
  },
};

export default meta;
type Story = StoryObj<StoryProps>;

export const Duration: Story = {
  args: {
    sample: 50,
    name: "SUM DURATION OVER TIME",
    duration: true,
  },
};

export const Value: Story = {
  args: {
    sample: 10,
    valueMod: 1000,
    name: "SUM VALUE OVER TIME",
    duration: false,
  },
};
