import type { Meta, StoryObj } from "@storybook/react";
import { TimedateHeatmapRender } from "@/js/charts/timedate_heatmap";
import { timerangeProps } from "@/stories/utils/timerange";
import type { TimerangeProps } from "@/stories/utils/timerange";
import { genHeatmapData } from "@/data/charts/genHeatmapData";
import { DAY_TIME } from "@/data/utils/date";
import { parseDateHeatmap } from "@/es-response-parser";
import { ChartGeneratorProps } from "@/data/types";

type TimedateProps = {
  timerange: [number, number];
  setTimerange: (timerange: number[]) => void;
  data: [];
  id: string;
  field: string;
  width: number;
  name: string;
  units: string;
};

type StoryProps = TimedateProps & TimerangeProps & ChartGeneratorProps;

const meta: Meta<StoryProps> = {
  title: "charts/TimedateHeatmap",
  component: TimedateHeatmapRender,
  tags: ["autodocs"],
  argTypes: {
    width: {
      control: { type: "range", min: 50, max: 2000, step: 5 },
    },
    sample: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
    startDate: { control: "date" },
    endDate: { control: "date" },
  },
  args: {
    seed: 0,
    startDate: Date.now(),
    endDate: Date.now() + DAY_TIME * 15,
    valueMod: 10,
    width: 800,
  },
  render: (args) => {
    const data = genHeatmapData(args);
    const parsedData = parseDateHeatmap(data);
    return (
      <TimedateHeatmapRender
        {...{ ...timerangeProps(args), data: parsedData }}
      />
    );
  },
};

export default meta;
type Story = StoryObj<StoryProps>;

export const Primary: Story = {
  args: {
    sample: 50,
    id: "dateHeatmap",
    name: "TYPE DATE HEATMAP",
    field: "attrs.type",
    units: "AVG",
  },
};

export const ZoomedIn: Story = {
  args: {
    ...Primary.args,
    startDate: 1684288472208,
    endDate: 1684419331200,
  },
};
