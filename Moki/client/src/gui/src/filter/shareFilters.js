
/*
share filters - add filters, timerange, types to url
*/

export async function shareFilters(store ) {
  let href = window.location.origin + window.location.pathname + "?from=" + store.getState().filter.timerange[0] + "&to=" + store.getState().filter.timerange[1];
  let filters = store.getState().filter.filters;

  if (filters) {
    for (const filter of filters) {
      if (filter.state === "enable") {
          href = href + "&filter=" + filter.title;
      }
    }
  }

  let types = store.getState().filter.types;

  if (types) {
    for (const type of types) {
      if (type.state === "enable") {
        href = href + "&type=" + type.id;
      }
    }
  } //put it into clipboard


  let dummy = document.createElement("textarea");
  document.body.appendChild(dummy);
  dummy.value = href;
  dummy.select();
  document.execCommand("copy");
  document.body.removeChild(dummy);
  document.getElementById("tooltipshare").style.display = "inline";
  setTimeout(function () {
    document.getElementById("tooltipshare").style.display = "none";
  }, 1000);
}
