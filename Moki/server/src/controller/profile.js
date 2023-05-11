
const {
  searchES,
  newIndexES,
  existsIndexES,
  insertES,
  updateES,
  deleteES
} = require('../utils/ES_queries');
const moment = require('moment-timezone');
const AdminController = require('./admin');
const { getDefaults, getUser } = require('../modules/config');
const indexName = "profiles";
const { cfg } = require('../modules/config');

class ProfileController {
  //store setings by user in ES
  //users index
  //req.body: {userprefs: {list of values}, type: user/domain} 
  ///profile/save
  static storeUserSettings(req, res, next) {
    async function search() {
      if (cfg.debug) console.info("Storing settings in user profile in ES");
      const user = getUser(req);
      let keys = Object.keys(req.body.userprefs);
      const field = req.body.userprefs[Object.keys(req.body.userprefs)[0]];

      var secret = user.sub;
      let secretField = "sub";

      if (req.body.type === "domain" && user.jwtbit !== 2) {
        secret = user["domain"];
        secretField = "domain";
      }
      //user level 2 wants to change domain settings - refuse
      else if (req.body.type === "domain" && user.jwtbit === 2) {
        return res.status(400).send({
          "msg": "User can't change domain settings."
        });
      }

      //check if event with same sub/domain exists, if so update it
      const update = await updateES(indexName, [
        { "query_string": { "query": "event." + secretField + ":" + secret } }
      ], "ctx._source.event.userprefs = params.userprefs",  {"userprefs": req.body.userprefs}, res);

      //event was updated
      if (update.updated !== 0) {
        return res.status(200).send(update);
      }
      //no such event create new one
      else {
        if (cfg.debug) console.info("No profile found, creating new one");
        const insert = await insertES(indexName, {
          [secretField]: secret,
          "userprefs": req.body.userprefs
        }, res);

        if (insert.result === "created") {
          return res.status(200).send({ insert });
        }
        else {
          return res.status(400).send({
            "msg": "Problem with saving profile ." + JSON.stringify(insert)
          });
        }
      }
    }

    if (cfg.debug) console.info("Profile was created");
    return search().catch((e) => {
      return next(e);
    });
  }

  //delete 
  //users index
  ///profile/delete
  static deleteUserSettings(req, res, next) {
    async function search() {
      if (cfg.debug) console.info("Deleting user profile " + secret);
      const user = getUser(req);
      const secret = user.sub;
      const deleted = await deleteES(indexName, { "query": { "match": { "event.sub": secret } } }, res);
      if (deleted !== 0) {
        return res.status(200).send(deleted);
      }
      else {
        return res.status(400).send({
          "msg": "Problem with deleting profile ." + deleted
        });
      }
    }

    return search().catch((e) => {
      return next(e);
    });
  }



  //get setings from ES
  //users index
  //req.body: attribute 
  // /profile
  static getUserSettings(req, res, next) {
    async function search() {
      const user = getUser(req);
      const sub = user.sub;
      const domain = user["domain"];
      if (cfg.debug) console.info("--------------------------GETING USER PROFILE---------------------");
      if (cfg.debug) console.info("Getting user profile sub: " + sub + " domain: " + domain);

      let jsonDefaults = await getDefaults();
      //default user profile
      let userProfileDefault = {
        "sub": "default",
        "userprefs": jsonDefaults.userprefs
      };


      let defaultDomainProfile = {
        "domain": "default",
        "userprefs": jsonDefaults.domainprefs
      }

      //admin has only default profile
      if (user.jwtbit === "0") {
        res.status(200).send([userProfileDefault, defaultDomainProfile]);
      }
      else {
        let newIndex = false;

        //check if it is neccesary to create new index
        const existIndex = await existsIndexES(indexName, res);
        //if not, create new one
        if (!existIndex) {
          if (cfg.debug) console.info("Profile index doesn't exists, creating new one with defaults values");

          //mode: encrypt, plain, anonymous
          try {
            var response = await newIndexES(indexName, {
              "properties": {
                "event": {
                  "properties": {
                    "sub": { "type": "keyword", "index": "true" },
                    "domain": { "type": "keyword", "index": "true" },
                    "profile": { "type": "keyword", "index": "true" },
                    "userprefs": {
                      "properties": {
                        "monitor_name": { "type": "text", "index": "false" },
                        "timezone": { "type": "text", "index": "false" },
                        "time_format": { "type": "text", "index": "false" },
                        "date_format": { "type": "text", "index": "false" },
                        "mode": { "type": "text", "index": "false" },
                        "validation_code": { "type": "text", "index": "false" },
                        "anonymizableAttrs": { "type": "nested", "enabled": "false" }
                      }
                    }
                  }
                }
              }
            }, res);
          }
          catch (error) {
            console.error(error);
            res.status(400).send({
              "msg": "Problem with getting user profile."
            });
          }

          if (!response.acknowledged) {
            res.status(400).send({
              "msg": "Problem with creating profile index. " + JSON.stringify(response)
            });
            return;
          }
          else {
            newIndex = true;
          }
        }
        if (existIndex || newIndex) {
          try {
            //search for user settings
            var userProfile = await searchES(indexName, [{ query_string: { "query": "event.sub:" + sub } }], res);
            if (cfg.debug) console.info("Got profile from ES: " + JSON.stringify(userProfile));

          }
          catch (error) {
            console.error(error);
            res.status(400).send({
              "msg": "Problem with getting user profile."
            });
          }


          //no user profile, use default
          if (userProfile.hits.hits.length === 0) {
            userProfile = userProfileDefault;
          }
          //check if all parameters in default profile are also in user profile
          else {
            userProfile = userProfile.hits.hits[0]._source.event;
            let keys = Object.keys(userProfileDefault.userprefs);
            for (let i = 0; i < keys.length; i++) {
              //check if object type, parse it 
              if (typeof userProfileDefault.userprefs[keys[i]] === 'object') {
                let innerKeys = Object.keys(userProfileDefault.userprefs[keys[i]]);
                for (let j = 0; j < innerKeys.length; j++) {
                  if (!userProfile.userprefs[keys[i]]) userProfile.userprefs[keys[i]] = {};
                  if (!userProfile.userprefs[keys[i]][innerKeys[j]]) {
                    userProfile.userprefs[keys[i]][innerKeys[j]] = userProfileDefault.userprefs[keys[i]][innerKeys[j]];
                  }
                }
              }
              else {
                if (!userProfile.userprefs[keys[i]]) {
                  userProfile.userprefs[keys[i]] = userProfileDefault.userprefs[keys[i]];
                }
              }
            }
            if (cfg.debug) console.info("Updating user profile values from defauls. " + JSON.stringify(userProfile));
          }

          if (cfg.debug) console.info("Getting domain profile");
          let domainProfile;
          //domain is undefined for admin
          if (domain !== "N/A") {
            domainProfile = await searchES(indexName, [{ query_string: { "query": "event.domain:" + domain } }], res);
          }

          //if nothing, return default where domain and sub == "default"
          if (domain === "N/A" || domainProfile.hits.hits.length === 0) {
            /*
            //FIX: domain profile doesn't exists because site owner was created before
            var domainProfileSiteOwner = await searchES(indexName, [{ query_string: { "query": "event.sub:" + domain } }], res);

            if (domainProfileSiteOwner.hits.hits.length > 0) {
              domainProfile = {
                "domain": domain,
                "userprefs": domainProfileSiteOwner.hits.hits[0]._source.event.userprefs
              }

              if (cfg.debug) console.info("Got domain profile stored in ES " + JSON.stringify(domainProfile));
            }
            else {
              domainProfile = defaultDomainProfile;
              if (cfg.debug) console.info("Domain profile not stored in ES, using default one");
            }
*/

            domainProfile = defaultDomainProfile;
          } //check if all parameters in default profile are also in user profile
          else {
          domainProfile = domainProfile.hits.hits[0]._source.event;
            var keys = Object.keys(defaultDomainProfile.userprefs);
            for (var i = 0; i < keys.length; i++) {
              if (!domainProfile.userprefs[keys[i]]) {
                domainProfile.userprefs[keys[i]] = defaultDomainProfile.userprefs[keys[i]];
              }
            }
            
          }

          //set hmac in cookie
          let hmac = userProfile.userprefs.validation_code;
          if (userProfile.userprefs.mode === "anonymous") {
            hmac = userProfile.userprefs.validation_code;
          }
          if (hmac !== "plain") hmac = hmac.substring(0, hmac.indexOf(":"));
          req.cookie = "hmac=" + hmac;
          res.status(200).send([userProfile, domainProfile]);
        }
        else {
          res.status(400).send({
            "msg": "Problem with getting user profile."
          });
        }
      }
    }

    return search().catch((e) => {
      return next(e);
    });
  }
}

module.exports = ProfileController;
