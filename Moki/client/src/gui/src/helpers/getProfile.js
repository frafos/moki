import store from "@/js/store";
import { setProfile } from "@/js/slices";


/**
*Get profile from ES and store it in redux
* @return {string}  error or "ok"
* */
export async function getProfile() {
  store.dispatch(setProfile(
    [{ "tls-cn": "default", "userprefs": {} },
    { "domain": "default", "userprefs": {} }]
  ));

  return "ok";
}