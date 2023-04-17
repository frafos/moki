import { ColorType } from '../style/ColorType';
import { Types } from '../style/Types';
import storePersistent from "../../../js/store/indexPersistent";


export function getExceededTypes() {
  let array = storePersistent.getState().layout.types.exceeded;
  if (array) {
    var types = []
    for (let hit of array) {
      types.push({
        id: hit,
        name: getExceededName(hit),
        state: "enable",
        key: hit
      });
    }

    return types;
  }
  return [];
}

/*
return color based on exceeded name
*/
export function getExceededColor(name) {
  if (ColorType[name]) return ColorType[name];
  return name;
}

/*
return human-readable name based on id
*/
export function getExceededName(id) {
  if (Types[id]) return Types[id];
  return id;
}

