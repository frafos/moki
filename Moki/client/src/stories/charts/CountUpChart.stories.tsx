import type { Meta, StoryObj } from "@storybook/react";
import CountUp, { Props } from "@/js/charts/CountUp";

const meta: Meta<Props> = {
  title: "metrics/CountUp",
  component: CountUp,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<Props>;

export const Primary: Story = {
  args: {
    data: 999,
    name: "ACTUAL REGS",
    dataAgo: 123,
  },
};

export const Duration: Story = {
  args: {
    data: 80000,
    name: "DURATION",
    dataAgo: 70000,
  }
}

