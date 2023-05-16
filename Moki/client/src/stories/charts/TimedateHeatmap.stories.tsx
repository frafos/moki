import type { Meta, StoryObj } from "@storybook/react";
import {
  RenderProps,
  TimedateHeatmapRender,
} from "@/js/charts/TimedateHeatmap";
import { timerangeProps } from "@/stories/utils/timerange";
import type { TimerangeProps } from "@/stories/utils/timerange";
import { genHeatmapData } from "@/data/charts/genHeatmapData";
import { DAY_TIME } from "@/data/utils/date";
import { parseDateHeatmap } from "@/es-response-parser";
import { ChartGeneratorProps } from "@/data/types";
import { ColorsGreen, ColorsRedGreen } from "@/gui";

type ColorScheme = "Green" | "RedGreen";
const COLOR_SCHEME = {
  "Green": ColorsGreen,
  "RedGreen": ColorsRedGreen,
};

const TYPES_SCHEME = {
  "Green": [
    "error",
    "auth-failed",
    "call-attempt",
    "reg-new",
    "notice",
    "reg-del",
    "reg-expired",
    "call-start",
    "call-end",
  ],
  "RedGreen": ["backend-proxy", "public-users"],
};

type StoryProps =
  & {
    colorScheme: ColorScheme;
  }
  & RenderProps
  & TimerangeProps
  & ChartGeneratorProps;

const meta: Meta<StoryProps> = {
  title: "charts/TimedateHeatmap",
  tags: ["autodocs"],
  argTypes: {
    colorScheme: {
      options: ["Green", "RedGreen"],
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
    colorScheme: "Green",
    startDate: Date.now(),
    endDate: Date.now() + DAY_TIME * 15,
    valueMod: 10,
    marginLeft: 150,
  },
  render: (args) => {
    const colorOneShade = COLOR_SCHEME[args.colorScheme];
    const types = TYPES_SCHEME[args.colorScheme];
    const data = genHeatmapData({ ...args, types });
    const parsedData = parseDateHeatmap(data);
    return (
      <TimedateHeatmapRender
        {...{ ...timerangeProps(args), data: parsedData, colorOneShade }}
      />
    );
  },
};

export default meta;
type Story = StoryObj<StoryProps>;

export const Primary: Story = {
  args: {
    sample: 50,
    name: "TYPE DATE HEATMAP",
    field: "attrs.type",
    units: "count",
  },
};

export const ZoomedIn: Story = {
  args: {
    ...Primary.args,
    startDate: 1684288472208,
    endDate: 1684419331200,
  },
};

export const RedGreenScheme: Story = {
  args: {
    ...Primary.args,
    valueMod: 500,
    units: "AVG",
    colorScheme: "RedGreen",
  },
};
