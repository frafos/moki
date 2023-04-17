
/*
share filters - add filters, timerange, types to url
*/

export async function shareFilters(store, storePersistent) {
  let href = window.location.origin + window.location.pathname + "?from=" + store.getState().timerange[0] + "&to=" + store.getState().timerange[1];
  let filters = store.getState().filters;

  if (filters) {
    for (const filter of filters) {
      if (filter.state === "enable") {
          href = href + "&filter=" + filter.title;
      }
    }
  }

  let types = store.getState().types;

  if (types) {
    for (const type of types) {
      if (types.state === "enable") {
        href = href + "&type=" + types.id;
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
;