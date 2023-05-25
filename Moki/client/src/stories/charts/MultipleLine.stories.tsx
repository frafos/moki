
import type { Meta, StoryObj } from "@storybook/react";
import { RenderProps, MultipleLineRender } from "@charts/MultipleLine";
import { timerangeProps } from "@/stories/utils/timerange";
import type { TimerangeProps } from "@/stories/utils/timerange";
import { ChartGeneratorProps } from "@/data/types";
import { DAY_TIME } from "@/data/utils/date";
import { genMultipleLineData } from "@/data/charts/genMultipleLineData";
import { parseMultipleLineData } from "@/es-response-parser";

type StoryProps =
  & RenderProps
  & TimerangeProps
  & ChartGeneratorProps;

const meta: Meta<StoryProps> = {
  title: "charts/MultipleValue",
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
    startDate: Date.now() - DAY_TIME / 4,
    endDate: Date.now(),
  },
  render: (args) => {
    const data = genMultipleLineData();
    console.log(data);
    const parsedData = parseMultipleLineData(data);
    return (
      <MultipleLineRender
        {...{
          ...timerangeProps(args),
          data: parsedData,
        }}
      />
    );
  },
};

export default meta;
type Story = StoryObj<StoryProps>;

export const Primary: Story = {
  args: {
    sample: 50,
    name: "SUM DURATION OVER TIME",
  },
};

