import type { Meta, StoryObj } from "@storybook/react";
import ValueChart, { Props } from "@/js/charts/ValueChart";

const meta: Meta<Props> = {
  title: "charts/Value",
  component: ValueChart,
  argTypes: {
    color: {
      options: ["default", "zerogreen"],
      control: { type: "select" }
    }
    
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<Props>;

export const Number: Story = {
  args: {
    data: 0,
    name: "# CALLS",
    color: "zerogreen",
  },
};

export const Duration: Story = {
  args: {
    data: 100000,
    name: "SUM DURATION",
  },
};

export const Percent: Story = {
  args: {
    data: 5.36,
    name: "ASR (%)",
  },
};
