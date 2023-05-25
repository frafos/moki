import { formatDuration } from "@/js/helpers/formatTime";
import { useEffect, useRef } from "react";
import { useCountUp } from "react-countup";

export interface Props {
  name: string;
  type: string;
  data: number;
  dataAgo: number;
}

export default function CountUpChart({ name, data, dataAgo }: Props) {
  const valueAgo = Math.ceil(data - dataAgo);

  // TODO: should be a parameter
  const niceNumber = (name: string) => {
    return (nmb: number) => {
      if (name.includes("DURATION")) return formatDuration(nmb);
      if (nmb) return nmb.toLocaleString();
      return "0";
    };
  };

  const countUpRef = useRef(null);
  const { start } = useCountUp({
    ref: countUpRef,
    startOnMount: false,
    start: dataAgo,
    end: data,
    formattingFn: niceNumber(name),
  });

  useEffect(() => {
    start();
  }, [data])

  return (
    <div
      style={{ "minWidth": 180 }}
      id={name}
      className={"chart valueChartHeight"}
    >
      <h3 className="alignLeft title" style={{ "float": "inherit" }}>
        {name}
      </h3>
      <div
        className={"alignLeft count-chart-counter"}
        ref={countUpRef}
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
            {`(${valueAgo > 0 ? "+" : ""}${niceNumber(name)(valueAgo)})`}
          </span>
        </h4>
      )}
    </div>
  );
}
