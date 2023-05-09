import type { Meta, StoryObj } from "@storybook/react";
import { TimedateHeatmapRender } from "@/js/charts/timedate_heatmap";
import { timerangeProps } from "@/stories/utils/timerange";
import type { TimerangeProps } from "@/stories/utils/timerange";
import { generateHeatmapData } from "@/data/charts/timedate_heatmap";
import { DAY_TIME } from "@/data/utils/date";
import { parseDateHeatmap } from "@/es-response-parser";

type TimedateProps = {
  timerange: [number, number];
  setTimerange: Function;
  data: [];
  id: string;
  field: string;
  width: number;
  name: string;
  units: string;
};

type FakeDataProps = {
  seed: number;
  sample: number;
  valueMod: number;
};

type StoryProps = TimedateProps & TimerangeProps & FakeDataProps;

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
  },
  args: {
    seed: 0,
    startDate: Date.now(),
    endDate: Date.now() + DAY_TIME * 15,
    valueMod: 10,
  },
  render: (args) => {
    const data = generateHeatmapData(args);
    const parsedData = parseDateHeatmap(data);
    console.log(data);
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
    width: 800,
    units: "AVG",
  },
};

export const ZoomedIn: Story = {
  args: {
    startDate: 1684288472208,
    endDate: 1684419331200,
    sample: 50,
    id: "dateHeatmap",
    name: "TYPE DATE HEATMAP",
    field: "attrs.type",
    width: 800,
    units: "AVG",
  },
}
