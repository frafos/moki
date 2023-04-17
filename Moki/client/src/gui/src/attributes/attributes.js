import attributes_list from "./attributes_list.json";
export const getAttributes = () => {
  return attributes_list;
};

export function isEncryptedAttr(attr, encrypt) {
  return attr;
}

export function cipherAttr(attr, value, profile, mode) {
  return value;
}


/*
return array of searchable attributes
*/

export const getSearchableAttributes = () => {
  var attributes = getAttributes();
  var groups = Object.keys(attributes);
  var result = [];

  for (var i = 0; i < groups.length; i++) {
    var keys = Object.keys(attributes[groups[i]]);

    for (var j = 0; j < keys.length; j++) {
      if (attributes[groups[i]][keys[j]].includes("searchable")) {
        result.push(keys[j]);
      }
    }
  }

  return result;
};
/*
return array of displayed attributes
*/

export const getDisplayedAttributes = () => {
  var attributes = getAttributes();
  var groups = Object.keys(attributes);
  var result = [];

  for (var i = 0; i < groups.length; i++) {
    var keys = Object.keys(attributes[groups[i]]);

    for (var j = 0; j < keys.length; j++) {
      result.push(keys[j]);
    }
  }

  return result;
};
/*
get category for one attr
*/

export const getCategory = attr => {
  var attributes = getAttributes();
  var groups = Object.keys(attributes);

  for (var i = 0; i < groups.length; i++) {
    if (attributes[groups[i]][attr]) {
      return groups[i];
    }
  }

  return null;
};