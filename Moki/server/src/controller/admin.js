const { connectToES } = require('../modules/elastic');
const { parseBase64 } = require('../modules/jwt');
//const { isRequireJWT } = require('../modules/config');
const { exec } = require("child_process");
const fs = require('fs');
const https = require("https");
const axios = require("axios");
const { cfg } = require('../modules/config');
const SettingController = require('./setting');

let oldJti = "";
const hfName = 'x-amzn-oidc-data';
const index = "lastlog-" + new Date().getFullYear() + "." + (new Date().getMonth() + 1);


/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administative management
 */


class AdminController {
  /**
   * @swagger
   * /api/user/sip:
   *   get:
   *     description: Get a JWT for a sip user
   *     tags: [Admin]
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: pretty
   *         description: Return a pretty json
   *         in: query
   *         required: false
   *         type: bool
   *     responses:
   *       200:
   *         description: Sip user
   *       500:
   *         description: internal error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/Error'
   *             example:
   *               error: "bash: not found"
   */
  static async getSipUser(req, res) {
    /**
     * Add login to ES database
     * index: lastlog-YYYY.MM, rotate every month
     * events: {timestamp, userID, domain, level} type=login
     */
    async function storeLoginInES(domain, userID, jwtbit, email, sourceIP) {
      const client = connectToES();
      const now = new Date();
      const existIndex = await client.indices.exists({ index: index });

      if (!existIndex) {
        if (cfg.debug) console.info(index + " index doesn't exists. Creating new one.");
        await client.indices.create({
          index: index,
          body: {
            mappings: {
              properties: {
                "@timestamp": { "type": "date", "index": "true" },
                "sub": { "type": "keyword", "index": "true" },
                "domain": { "type": "keyword", "index": "true" },
                "email": { "type": "keyword", "index": "true" },
                "source": { "type": "keyword", "index": "true" },
                "level": { "type": "integer", "index": "true" },
                "type": { "type": "keyword", "index": "true" }
              }
            }
          }
        }, function (err, resp, respcode) {
          console.error(err, resp, respcode);
        });
      }

      await client.index({
        index: index,
        refresh: true,
        body: {
          "@timestamp": now,
          "sub": userID,
          "domain": domain,
          "email": email,
          "level": jwtbit,
          "source": sourceIP,
          "type": "lastLogin"
        }
      }, function (err, resp) {
        if (err) {
          console.error(resp);
          if (cfg.debug) console.info("Problem to insert new login: " + resp);
        } else {
          if (cfg.debug) console.info("Inserted new login: " + userID + " " + domain);
        }
      });
    }

    if (process.env.NODE_ENV === "dev") {
      // TODO: hack to bypass auth, should be handled in a config file
      console.info("ACCESS web user - jwtbit undefined");
      return res.json({
        aws: false, 
        domainID: "foo-bar", 
        jwt: 0, 
        sub: "foo-bar",
        user: "USER", 
        userbackend: "DB",
        username: "foo-bar-user"
      });
    }

    // check config if JWT required, UPDATE: WE ALWAYS NEED JWT TOKEN NOW
    /*
    let isAccept;
    try {
      isAccept = cfg.JWT_required ||  await isRequireJWT();
    } catch (e) {
      // error in config processing:
      console.log("ACCESS getJWTsipUserFilter: error in config processing: ", JSON.stringify(e));
      // this will return a promise reject
      //  https://stackoverflow.com/questions/42453683/how-to-reject-in-async-await-syntax
      return res.json({ redirect: "errorInConfigProcessing" });
    }


    // WE DON¨T HAVE THIS OPTION ANYMORE
    // JWT not required -- open up
    if (!isAccept) {
      console.log(`ACCESS getJWTsipUserFilter: * permitted because no JWT required`);
      return res.json({ user: `ADMIN`, aws: false });
    }*/

    // JWT required -- parse it and validate it

    let parsedHeader;
    try {
      parsedHeader = parseBase64(req.headers[hfName]);
    } catch (e) {
      console.log("admin ACCESS getJWTsipUserFilter: JWT parsing failed");
      return res.json({ redirect: "JWTparsingError" });
    }

    //F first login option
    const isFirstLogin = parsedHeader['custom:isFrafos'];
    if (isFirstLogin) {
      return res.json({ user: `ADMIN`, aws: false });
    }

    let parsedHeaderAccessToken;
    let IPs;

    const username = parsedHeader['username'];
    const email = parsedHeader['email'];

    const sip = parsedHeader['custom:sip'];
    let jwtbit = parsedHeader['custom:adminlevel'];
    const domainID = parsedHeader['custom:domainid'];
    const subId = parsedHeader['sub'];

    // SPECIAL CASE: report
    if (username === "report") {
      return res.json({ user: 'report', aws: true, domainID: domainID, jwt: jwtbit, "sub": subId });
    }


    if (jwtbit === undefined) {
      //default user for web dashboard
      console.info("ACCESS web user - jwtbit undefined");
      return res.json({ user: `DEFAULT`, aws: true });
    }

    try {

      parsedHeaderAccessToken = parseBase64(req.headers['x-amzn-oidc-accesstoken']);
      //split x-forwarded-for by comma and take first IP
      IPs = req.headers['x-forwarded-for'].split(",");
    } catch (e) {
      console.error("ACCESS getJWTsipUserFilter: JTI parsing failed");
      return res.json({ redirect: "JTIparsingError" });
    }

    const jti = parsedHeaderAccessToken['jti'];
    const sourceIP = IPs[0];
    const userbackend = parsedHeader['custom:userbackend'];

    if (jwtbit === undefined) {
      // TODO: hack to bypass auth, should be handled in a config file
      console.info("ACCESS web user - jwtbit undefined");
      return res.json({
        aws: false, 
        domainID: "foo-bar", 
        jwt: 0, 
        sub: "foo-bar",
        user: "USER", 
        userbackend: "DB",
        username: "foo-bar-user"
      });
    }

    //store login to ES
    if (oldJti !== jti) {
      storeLoginInES(domainID, subId, jwtbit, email, sourceIP);
    }

    oldJti = jti;

    // subscriber id and admin level must be always set
    if (subId === undefined) {
      console.error("ACCESS getJWTsipUserFilter: no sub defined ");
      return res.json({ redirect: "noSubID" });
    }

    jwtbit = parseInt(jwtbit);

    //F option
    if (userbackend) {
      return res.json({ user: `ADMIN`, aws: false, email: email, domainID: domainID, jwt: jwtbit, "sub": subId, userbackend: userbackend });
    }

    // Root SuperAdmin Level
    if (jwtbit === 0) {
      console.log(`ACCESS: JWT admin level 0, NO FILTERS for user ${subId}`);
      return res.json({ user: `ADMIN`, aws: true, email: email, domainID: domainID, jwt: jwtbit, "sub": subId });
    }
    // less privileged users must belong to a domain
    if (domainID === undefined) {
      console.log(`ACCESS getJWTsipUserFilter: no domain defined for user ${subId}`);
      return res.json({ redirect: "nodomainID" });
    }
    // Site-Admin level or site-owner level
    if (jwtbit === 1) {
      if (domainID === subId) {
        console.log(`ACCESS: USER LEVEL 1 - site owner, Domain Filter Applied: ${domainID} for user ${subId}`);
        return res.json({ user: `SITE OWNER`, aws: true, email: email, domainID: domainID, jwt: jwtbit, "sub": subId });
      }
      else {
        console.log(`ACCESS: USER LEVEL 1, Domain Filter Applied: ${domainID} for user ${subId}`);
        return res.json({ user: `SITE ADMIN`, aws: true, email: email, domainID: domainID, jwt: jwtbit, "sub": subId });
      }
    }
    // End-User level
    if (jwtbit === 2) {
      if (sip === undefined) {
        console.log(`ACCESS getJWTsipUserFilter: no SIP URI for an end-user: ${subId}`);
        return res.json({ redirect: "nosipattr" });
      }
      if (sip === 'redirect') {
        console.log(`ACCESS getJWTsipUserFilter: no valid SIP URI for an end-user: ${subId}`);
        return res.json({ redirect: "nosipattr" });
      }
      //create user filter
      const colon = sip.indexOf(':');
      const user = [sip.substr(0, colon), String.fromCharCode(92), sip.substr(colon)].join('');
      console.log(`ACCESS: User Level 2, Activating Domain -${domainID}- and SIP -${user}- Filter for user ${subId}`);
      return res.json({ user: `USER`, aws: true, name: sip, email: email, domainID: domainID, jwt: jwtbit, "sub": subId });
    }
    // no well-known admin-level found exit with error
    console.log(`ACCESS getJWTsipUserFilter: unexpected admin level ${jwtbit} for user ${subId}`);
    return res.json({ redirect: "unexcpectedAdminLevel" });
  }

  //store mode change
  static async storeModeChange(req, res) {
    const client = connectToES();
    if (cfg.debug) console.info("Storing new mode change in lastlog index");
    const now = new Date();

    // JWT required -- parse it and validate it
    let parsedHeader;
    try {
      parsedHeader = parseBase64(req.headers[hfName]);
    } catch (e) {
      console.log("ACCESS getJWTsipUserFilter: JWT parsing failed");
      return res.json({ redirect: "JWTparsingError" });
    }

    let parsedHeaderAccessToken;
    let IPs;
    try {
      parsedHeaderAccessToken = parseBase64(req.headers['x-amzn-oidc-accesstoken']);
      //split x-forwarded-for by comma and take first IP
      IPs = req.headers['x-forwarded-for'].split(",");
    } catch (e) {
      console.log("ACCESS getJWTsipUserFilter: JTI parsing failed");
      return res.json({ msg: "JTIparsingError" });
    }
    let jwtbit = parsedHeader['custom:adminlevel'];
    const userID = parsedHeader['sub'];
    const domain = parsedHeader['custom:domainid'];
    const email = parsedHeader['email'];
    const sourceIP = IPs[0];
    const mode = req.body.mode;

    let insert = await client.index({
      index: index,
      refresh: true,
      document: {
        "@timestamp": now,
        "sub": userID,
        "domain": domain,
        "email": email,
        "level": jwtbit,
        "source": sourceIP,
        "mode": mode,
        "type": "modeChanged"
      }
    });
    if (insert.result === "created") {
      if (cfg.debug) console.info("Inserted new login: " + userID + " " + domain + " mode: " + mode);
      return res.json({ msg: "ok" });
    }
    else {
      console.error(resp);
      return res.json({ msg: "Problem to store mode change in ES index " + err });
    }
  }


  /*
create new user with password in htpasswd
*/
  static async createUser(req, res) {
    exec("sudo htpasswd -b -c " + cfg.htpasswd + " '" + req.body.name + "' '" + req.body.password + "'", (error, stdout, stderr) => {
      if (error) {
        console.error(`Can't create new user in nginx : ${error.message}`);
        return res.json({ "error": error.message });
      }

      //restart nginx
      exec("sudo abc-monitor-activate-config", (error, stdout, stderr) => {
        if (error) {
          console.error(`Can't create new user in nginx : ${error.message}`);
          //return res.json({ "error": error.message });
        }
      })

      console.log(`New nginx user created`);
      return res.json({ "msg": "User created" });

    });
  }

  /*
  Check if htpasswd file exists or if it's empty. Return true in that case (= no user)
  */
  static noNginxUser(req, res) {
    try {
      // Check if file exist
      fs.exists(cfg.htpasswd, function (file) {
        if (file) {
          //read file
          fs.readFile(cfg.htpasswd, 'utf8', function (err, data) {
            if (err) {
              res.json({ "msg": true });
            }
            if (data.length === 0) {
              res.json({ "msg": true });
            }
            else {
              res.json({ "msg": false });
            }
          });
        }
        else {
          res.json({ "msg": true });
        }
      });
    } catch (err) {
      return res.json({ "error": err });
    }
  }

  //get username from authorization header that nginx pass
  static getUsername(req, res) {
    // TODO: hack to have a username, should be config file
    if (process.env.NODE_ENV === "dev") {
      return res.json({ username: "Dev" });
    }
    try {
      let parsedHeader = parseBase64(req.headers['x-amzn-oidc-data']);
      return res.json({ username: parsedHeader.username });
    } catch (e) {
      return res.json({ username: "Undefined" });
    }
  }


  static firstTimeLoginCheck(req, res) {

    let ccmAddr = null;
    const jsonData = JSON.parse(fs.readFileSync(cfg.fileMonitor));

    for (let i = 0; i < jsonData["general"]["global-config"].length; i++) {
      if (jsonData["general"]["global-config"][i]["app"] === "m_config") {

        for (let j = 0; j < jsonData["general"]["global-config"][i]["attrs"].length; j++) {
          if (jsonData["general"]["global-config"][i]["attrs"][j]["attribute"] === "ccmAddr") {
            ccmAddr = jsonData["general"]["global-config"][i]["attrs"][j]["value"];
            break;
          }
        }
        break;
      }
    }

    if (ccmAddr) {
      res.json({ "msg": false });
    }
    else {
      res.json({ "msg": true });
    }

  }

  static setJsonDataMConfig(jsonData, attrName, value) {
    let appExists = false;

    for (let i = 0; i < jsonData["general"]["global-config"].length; i++) {
      if (jsonData["general"]["global-config"][i]["app"] === "m_config") {

        let attrExists = false;
        for (let j = 0; j < jsonData["general"]["global-config"][i]["attrs"].length; j++) {
          if (jsonData["general"]["global-config"][i]["attrs"][j]["attribute"] === attrName) {
            jsonData["general"]["global-config"][i]["attrs"][j]["value"] = value;
            attrExists = true;
          }
        }
        if (!attrExists) {
          jsonData["general"]["global-config"][i]["attrs"].push({
            attribute: attrName,
            value: value
          });
        }

        appExists = true;
        break;
      }
    }

    if (!appExists) {
      jsonData["general"]["global-config"].push({
        app: "m_config",
        attrs: [{
          attribute: attrName,
          value: value
        }]
      });
    }
  }

  static async firstTimeLoginSave(req, res) {
    let ccmPubKey = null;

    try {
      if (!req.body.ccmAddr) {
        throw new Error('CCM address is not set');
      }

      const response = await axios({
        url: `https://${req.body.ccmAddr}/oauth/jwk.php`,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false
        })
      });

      if (!response.data.keys) {
        throw new Error('CCM did not provided its public key');
      }

      ccmPubKey = JSON.stringify(response.data);
    }
    catch (err) {
      // res.send({ "error": "fooobar" });
      res.send({ "error": err.toString() });
      return;
    }

    const jsonData = JSON.parse(fs.readFileSync(cfg.fileMonitor));

    console.debug('JSON config to be updated: %o', jsonData);

    AdminController.setJsonDataMConfig(jsonData, "ccmAddr", req.body.ccmAddr);
    AdminController.setJsonDataMConfig(jsonData, "ccmProxied", req.body.ccmProxied ? true : false);
    AdminController.setJsonDataMConfig(jsonData, "ccmPublicKey", ccmPubKey);

    console.debug('updated JSON: %o', jsonData);

    SettingController.saveSettings(jsonData)
      .then((msg) => {
        console.log(`Settings updated`);
        res.send({ "msg": "Settings updated" });
      })
      .catch((err) => {
        res.send({ "error": err });
      });
  }

}

module.exports = AdminController;


