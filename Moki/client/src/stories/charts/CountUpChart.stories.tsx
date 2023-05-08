import type { Meta, StoryObj } from "@storybook/react";
import CountUpChart from "@/js/charts/count_chart";

const meta: Meta<typeof CountUpChart> = {
  title: "charts/CountUp",
  component: CountUpChart,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CountUpChart>;

export const Primary: Story = {
  args: {
    data: 999,
    name: "ACTUAL REGS",
    biggerFont: "biggerFont",
    dataAgo: 123,
  },
};

