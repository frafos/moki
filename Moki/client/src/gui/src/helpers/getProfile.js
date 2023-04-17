import storePersistent from "../../../js/store/indexPersistent";
import { setProfile } from "../../../js/actions/index";


/**
*Get profile from ES and store it in redux
* @return {string}  error or "ok"
* */
export async function getProfile() {
  storePersistent.dispatch(setProfile(
    [{ "tls-cn": "default", "userprefs": {} },
    { "domain": "default", "userprefs": {} }]
  ));

  return "ok";
}