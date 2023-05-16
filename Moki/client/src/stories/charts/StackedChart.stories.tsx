import type { Meta, StoryObj } from "@storybook/react";
import { StackedChartRender, RenderProps } from "@/js/charts/StackedChart";
import { genStackedData, GeneratorProps } from "@/data/charts/genStackedData";
import { parseStackedbarData } from "@/es-response-parser";

type StoryProps = RenderProps & GeneratorProps;

const meta: Meta<StoryProps> = {
  title: "charts/StackedChart",
  tags: ["autodocs"],
  argTypes: {},
  args: {
    seed: 0,
    valueMod: 1000,
  },
  render: ({ ...args }) => {
    const res = genStackedData(args);
    const data = parseStackedbarData(res);
    return <StackedChartRender {...{ ...args, data }} />;
  },
};

export default meta;
type Story = StoryObj<StoryProps>;

export const Default: Story = {
  args: {
    units: "count",
    keys: [
      "auth-failed",
      "notice",
      "error",
      "call-attempt",
      "reg-new",
      "reg-del",
      "reg-expired",
      "call-end",
      "call-start",
    ],
    name: "TOTAL EVENTS IN INTERVAL",
  },
};
