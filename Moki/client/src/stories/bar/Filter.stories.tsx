import type { Meta, StoryObj } from "@storybook/react";
import Filter from "@/js/bars/Filter";

interface FilterProps {
    state: string,
    title: string,
    id: string,
    deleteFilter: () => void,
    disableFilter: () => void,
    enableFilter: () => void,
    pinFilter: () => void,
    negationFilter: () => void,
    unpinFilter: () => void,
    editFilter: () => void,
}

const meta: Meta<FilterProps> = {
  title: "bar/Filter",
  component: Filter,
  tags: ["autodocs"],
  args: {
    state: "enable",
    title: 'attrs.type: "notice"',
    id: "filter1",
    deleteFilter: undefined,
    disableFilter:  undefined,
    enableFilter: undefined,
    pinFilter: undefined,
    negationFilter: undefined,
    unpinFilter: undefined,
    editFilter: undefined,
  },
};

export default meta;
type Story = StoryObj<FilterProps>;

export const Primary: Story = {
};
