import emptyIcon from "/icons/empty_small.png";

export default function NoData() {
  return (
    <div className="d-flex h-100">
      <img alt="nodata" className="m-auto" src={emptyIcon} />
    </div>
  );
}
