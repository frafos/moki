import store from "../store/index";
import storePersistent from "../store/indexPersistent";
import { getExceededTypes } from '../../gui';

export const getTypes = () => {
    var types = store.getState().types;

    //check if correct types - changing dashboard from no type to types one
    var pathname = window.location.pathname.substring(1);
    var dashboardTypesChecked = storePersistent.getState().layout.types[pathname];
    if(window.location.pathname === "/exceeded" || window.location.pathname === "/alerts"){
        dashboardTypesChecked = getExceededTypes();
    }
    if (dashboardTypesChecked === undefined) {
        types = [];
    }

    var typesResult = [];
    var disableCount = 0;
    for (var i = 0; i < types.length; i++) {
        if (types[i].state !== 'disable') {
            typesResult.push(types[i]);
        }
        else {
            disableCount++;
        }
    }
    //all types are disabled = special NOT TYPE filter
    if (disableCount === types.length && types.length !== 0) {
        return "type:none";
    }
    return typesResult;
}