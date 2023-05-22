import { parseDuration } from "../helpers/parseDuration";
import CountUp from "react-countup";

export interface Props {
  name: string,
  type: string,
  data: number,
  dataAgo: number,
}

export default function CountUpChart({ name, data, dataAgo }: Props) {
  const valueAgo = Math.ceil(data - dataAgo);

  // TODO: should be a parameter
  const niceNumber = (name: string) => {
    return (nmb: number) => {
      if (name.includes("DURATION")) return parseDuration(nmb);
      if (nmb) return nmb.toLocaleString();
      return "0";
    };
  }

  const getNumberLength = (number: number) => (number.toString().length);
  const digits = getNumberLength(data);

  let style = "";
  if (digits > 8) {
    style = "count-chart-counter-xs";
  } else if (digits > 5) {
    style = "count-chart-counter-sm";
  }

  return (
    <div
      style={{ "minWidth": 180 }}
      id={name}
      className={"chart valueChartHeight"}
    >
      <h3 className="alignLeft title" style={{ "float": "inherit" }}>
        {name}
      </h3>
      <CountUp
        className={"alignLeft count-chart-counter " + style}
        start={dataAgo}
        end={data}
        formattingFn={niceNumber(name)}
      />
      {!Number.isNaN(valueAgo) && (
        <h4 className={"alignLeft "} title={"difference to previous"}>
          <span
            style={{
              "color": valueAgo === 0
                ? "black"
                : valueAgo > 0
                ? "green"
                : "red",
            }}
          >
            {valueAgo > 0 ? "(+" + valueAgo + ")" : "(" + valueAgo + ")"}
          </span>
        </h4>
      )}
    </div>
  );
}
