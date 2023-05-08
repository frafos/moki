import type { Meta, StoryObj } from "@storybook/react";
import ValueChart from "@/js/charts/value_chart";

const meta: Meta<typeof ValueChart> = {
  title: "charts/Value",
  component: ValueChart,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ValueChart>;

export const Number: Story = {
  args: {
    data: 42,
    name: "# CALLS",
  },
};

export const Duration: Story = {
  args: {
    data: 100000,
    name: "SUM DURATION"
  }
}
