import frafosMonLogo from "/logo_full.png";

const style: React.CSSProperties = {
  display: "flex",
  gap: 5,
  alignItems: "center",
  height: "2rem",
}

const imgStyle: React.CSSProperties = {
  height: "70%",
  marginTop: 1,
}

interface Props {
  version: string;
}

function LogoVersion({ version }: Props) {
  return (
    <div style={style}>
      <img src={frafosMonLogo} alt="monitor-logo" style={imgStyle} />
      <div>{version}</div>
    </div>
  );
}

export default LogoVersion;
