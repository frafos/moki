import { format } from "d3";

const MN = 60;

function parseDuration(duration: number) {
  let secDuration = Math.floor(duration);
  const minutes = Math.floor(secDuration / MN);
  const formattedMin = minutes < 10 ? minutes : format(".2s")(minutes);
  return `${formattedMin} min`;
}

export { parseDuration };
