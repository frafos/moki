import type { Meta, StoryObj } from "@storybook/react";
import CountUpChart, { Props } from "@/js/charts/CountUpChart";

const meta: Meta<Props> = {
  title: "charts/CountUp",
  component: CountUpChart,
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

