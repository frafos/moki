import { formatDuration } from "@/js/helpers/formatTime";
import { formatValueISO } from "../helpers/formatValue";

export type ChartColors = "" | "zerogreen";

export interface Props {
  name: string;
  data: number;
  color: ChartColors;
  biggerFont?: string;
}

export default function Value({ biggerFont, name, color, data }: Props) {
  let chartColor = "grey";
  if (color === "zerogreen") {
    if (data === 0) chartColor = "green";
    else chartColor = "red";
  }

  // TODO: should be a parameter
  const niceNumber = (name: string) => {
    return (nmb: number) => {
      if (name.includes("DURATION")) return formatDuration(nmb);
      if (nmb) return formatValueISO(nmb);
      return 0;
    };
  };

  return (
    <div
      id={name}
      className="chart valueChart"
      style={{ "float": "inherit" }}
    >
      <h3 className="alignLeft title" style={{ "float": "inherit" }}>
        {name}
      </h3>
      <h4
        className={"alignLeft " + biggerFont}
        style={{ "color": chartColor }}
      >
        {niceNumber(name)(data)}
      </h4>
    </div>
  );
}
