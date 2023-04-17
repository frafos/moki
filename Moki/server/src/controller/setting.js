// setting.js hold the setting endpoints

const fs = require('fs');
const { exec } = require('child_process');
const { spawn } = require('child_process')
const { newHTTPError } = require('./index');
const { cfg, setMonitorVersion } = require('../modules/config');
const { connectToES } = require('../modules/elastic');
const distinct_query = require('../../js/template_queries/distinct_query');
const { getJWTsipUserFilter } = require('../modules/jwt');
const AdminController = require('./admin');
const elastic = require('../modules/elastic');

let domainFilter = "*";
let monitorVersion = "4.6";
/**
 * @swagger
 * tags:
 *   name: Setting
 *   description: Setting management
 */


/**
 * @swagger
 * definitions:
 *   Settings:
 *     type: "array"
 *     description: JSON settings file contains just global-config optios - general, sns and alarms setting
 *     example:
 *         [{app: "m_config", attrs: []},{app: "m_alarms", attrs: []},{app: "m_sns",attrs: []}]
 *   SettingFile:
 *     type: "array"
 *     description: JSON settings file contains whole stored settings
 *     example:
 *         [general: { global-config: [{app: "gconfig", attrs: []}, {app: "m_config",attrs: []}, {app: "m_alarms",attrs: []}, {app: "m_sns",attrs: []}], m_filters: [{id: "filterID",attribute: [ filters: [], name: "dashboard name", types: []]}]}, m_version: "4.5", version: "1.0"]
 */

class SettingController {
  /**
   * @swagger
   * /api/setting:
   *   get:
   *     description: Fetch settings
   *     tags: [Setting]
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: Return the json setting - if monitor.json available, value are merged to defaults.json
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/Settings'
   *       400:
   *         description: processing error
   *         content:
   *           application/json:
   *             example: { "error": "Problem reading data file: no such file or directory, open '/etc/abc-monitor/defaults.json'" }
   *       500:
   *         description: internal error
   *         content:
   *           application/json:
   *             example:
   *               error: "bash: not found"
   */
  static load(req, res, next) {
    return fs.readFile(cfg.fileDefaults, (err, defaults) => {
      if (err) {
        console.error(`Problem with reading default file. ${err}`);
        return next(newHTTPError(400, `Problem with reading data: ${err}`));
      }

      return fs.readFile(cfg.fileMonitor, (err2, data) => {
        if (err2) {
          console.error(`Problem with reading default file. ${err2}`);
          return next(newHTTPError(400, `Problem with reading data: ${err2}`));
        }

        console.info('Reading files and inserting default values.');
        // if value in monitor.json use this one, not default
        const jsonData = JSON.parse(data);
        const jsonDefaults = JSON.parse(defaults);
        if ('general' in jsonData && jsonData.general['global-config']) {
          jsonData.general['global-config'].forEach(data => {
            jsonDefaults.forEach(defaults => {
              if (data.app === defaults.app) {
                data.attrs.forEach(attrs => {
                  defaults.attrs.forEach(defaultsAttrs => {
                    if (attrs.attribute === defaultsAttrs.attribute) {
                      defaultsAttrs.value = attrs.value;
                      if (attrs.comments) {
                        defaultsAttrs.comments = attrs.comments;
                      }
                    }
                  });
                });
              }
            });
          });
        }

        return res.status(200).send(jsonDefaults);
      });
    });
  }

  /**
* @swagger
* /api/gui/setting:
*   get:
*     description: Fetch GUI settings (style and dashboard settings)
*     tags: [Setting]
*     produces:
*       - application/json
*     responses:
*       200:
*         description: Return monitor_layout.json
*         content:
*           application/json:
*             schema:
*               $ref: '#/definitions/Settings'
*       400:
*         description: processing error
*         content:
*           application/json:
*             example: { "error": "Problem reading data file: no such file or directory, open '/etc/abc-monitor/defaults.json'" }
*       500:
*         description: internal error
*         content:
*           application/json:
*             example:
*               error: "bash: not found"
*/
  static loadGUILayout(req, res) {
    fs.readFile(cfg.fileGUILayout, function (err, defaults) {
      if (err) {
        res.status(400).send({
          msg: "Problem with reading data: " + err
        });
        console.error("Problem with reading monitor layout file. " + err);
      }
      return res.status(200).send(defaults);

    });
  }

  /**
   * @swagger
   * /api/defaults:
   *   get:
   *     description: Return stored defaults values without merging it with user's one
   *     tags: [Setting]
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: Setting payload
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/Settings'
   *       500:
   *         description: internal error
   *         content:
   *           application/json:
   *             example:
   *               error: "bash: not found"
   */
  static defaults(request, respond) {
    fs.readFile(cfg.fileDefaults, function (err, defaults) {
      if (err) {
        respond.status(400).send({
          msg: "Problem with reading data: " + err
        });
        console.error("Problem with reading defaults file. " + err);
      }
      return respond.status(200).send(defaults);

    });
  }

  /**
   * @swagger
   * /api/filters:
   *   get:
   *     description: return stored filter in ES
   *     tags: [Setting]
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: Setting payload
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/SettingFile'
   *       500:
   *         description: internal error
   *         content:
   *           application/json:
   *             example:
   *               error: "bash: not found"
   */
  static loadFilters(req, res, next) {
    async function search(req) {
      //get user's right to load correct filters
      const user = AdminController.getUser(req);
      let condition;
      //admin, show everything
      if (user.jwtbit === 0) {
        condition = {
          index: 'filters'
        };
      }
      //site admin, show only domain and encrypt filter
      else if (user.jwtbit === 1) {
        condition = {
          index: 'filters',
          body: {
            query: {
              bool: {
                must: [
                  { query_string: { "query": "domain:" + user.domain } },
                  { query_string: { "query": 'encrypt:"' + req.body.validation_code + '"' } }
                ]
              }
            }
          }
        };
      }
      //user, show domain, encrypt and user filter
      else {
        condition = {
          index: 'filters',
          body: {
            query: {
              bool: {
                must: [
                  { query_string: { "query": "domain:" + user.domain } },
                  { query_string: { "query": "sub:" + user.sub } },
                  { query_string: { "query": 'encrypt:"' + req.body.validation_code + '"' } }
                ]
              }
            }
          }
        };
      }
      const client = connectToES(res);
      console.info("Getting filters for user level: " + user.jwtbit);
      var result = await client.search(condition);
      return res.json(200, result);

    }

    return search(req).catch((e) => {
      return next(e);
    });

  }

  /**
* @swagger
* /api/filters/save:
*   post:
*     description: save new filter in ES index
*     tags: [Setting]
*     consumes:
*       - application/json
*     parameters:
*       - in: body
*         name: filter
*         description: new filter to save
*         schema:
*           type: object
*           properties:
*             id:
*               type: string
*               example: {"id":"Myfilter"}
*             attribute:
*               type: array
*               description: array of filters
*               example: {"attribute":[]}
  *             name:
  *               type: string
  *               description: name of dashboard where filter was created
  *               example: {"name":"/connectivityCA"}
  *             types:
  *               type: array
  *               description: array of types
  *               example: {"types":[]}
  *             timerange:
  *               type: array
  *               description: timestamp from and to
  *               example: {"timerange":[1610683132626,1610683145434]}
*         required: true
*         type: application/json
*     responses:
*       200:
*         description: new settings file
*         content:
*           application/json:
*             schema:
*               $ref: '#/definitions/SettingFile'
*       400:
*         description: problem with writing data to file
*         content:
*           application/json:
*             example:
*               error: "Config checked failed. Writing old config back."
*/
  static saveFilter(req, res, next) {
    async function search() {
      const client = connectToES(res);
      const user = AdminController.getUser(req);
      const sub = user.sub;
      const indexName = "filters";
      let newIndex = false;

      //check if it is neccesary to create new index
      const existIndex = await client.indices.exists({ index: indexName });
      //if not, create new one
      if (!existIndex) {
        await client.indices.create({
          index: indexName,
          body: {
            mappings: {
              properties: {
                "encrypt": { "type": "keyword", "index": "true" },
                "sub": { "type": "keyword", "index": "true" },
                "domain": { "type": "keyword", "index": "true" },
                "id": { "type": "keyword", "index": "true" },
                "title": { "type": "keyword", "index": "false" },
                "attribute": { "type": "text", "index": "false" }
              }
            }
          }
        }, function (err, resp, respcode) {
          newIndex = false;
          console.error(err, resp, respcode);
        });
        newIndex = true;

      }

      if (newIndex || existIndex) {
        //add new event
        const response = await client.index({
          index: indexName,
          refresh: true,
          body: {
            "sub": sub,
            "id": req.body.id,
            "title": req.body.title,
            "domain": user.domain,
            "encrypt": req.body.validation_code,
            "attribute": JSON.stringify(req.body.attribute)
          }
        }, function (err, resp) {
          if (err) {
            console.error(resp);
          } else {
            console.info("Inserted new filter: " + sub + ": " + req.body.id);
          }
        });
        return res.json(response);
      }
      client.close();
      return res.status(400).send({
        "msg": "Problem with saving filter."
      });

    }

    return search().catch((e) => {
      return next(e);
    });

  }

  /**
   * @swagger
   * /api/filters/delete:
   *   get:
   *     description: delete filter
   *     tags: [Setting]
   *     consumes:
   *       - application/json
   *     parameters:
   *       - in: body
   *         name: filter
   *         description: new filter list
   *         schema:
   *           type: object
   *           properties:
   *             id:
   *               type: string
   *               example: {"id":"Myfilter"}
   *             attribute:
   *               type: array
   *               description: array of filters
   *               example: {"attribute":[]}
      *             name:
      *               type: string
      *               description: name of dashboard where filter was created
      *               example: {"name":"/connectivityCA"}
      *             types:
      *               type: array
      *               description: array of types
      *               example: {"types":[]}
      *             timerange:
      *               type: array
      *               description: timestamp from and to
      *               example: {"timerange":[1610683132626,1610683145434]}
   *         required: true
   *         type: application/json
   *     responses:
   *       200:
   *         description: Setting payload
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/SettingFile'
   *       400:
   *         description: Problem writing new filters to config file
   *         content:
   *           application/json:
   *             example:
   *               error: "Problem writing new filters to config file"
   */
  static deleteFilter(req, res) {
    const client = connectToES(res);
    console.info("Deleting filter " + req.body.id);
    client.deleteByQuery({
      index: 'filters',
      type: '_doc',
      refresh: true,
      body: {
        query: {
          match: { id: req.body.id }
        }
      }
    }, function (error) {
      if (error) {
        return res.status(400).send({
          "msg": "Problem with deleting filter. " + error
        });
      }
      else {
        return res.status(200).send({
          "msg": "Filter deleted."
        });
      }
    });
  }

  static parseOpenSSLCertificate(req, res, next) {
    let params = ["x509", "-text", "-noout"];
    if (req.body.type === "key") {
      params = ["rsa", "-text", "-noout"];
    }
    const command = spawn('openssl', params);
    command.stdin.write(req.body.cert);
    command.stdin.end();

    command.stdout.on('data', output => {
      return res.status(200).send({
        "msg": output.toString()
      });
    })

    command.stderr.on('data', output => {
      res.status(400).send({
        "msg": "Problem to parse certificate. " + output.toString()
      });
    })
  }


  /**
   * @swagger
   * /api/save:
   *   post:
   *     description: save data
   *     tags: [Setting]
   *     consumes:
   *       - application/json
   *     parameters:
   *       - in: body
   *         name: filter
   *         description: new data to save
   *         schema:
   *           type: object
   *           properties:
   *             id:
   *               type: string
   *               example: {"id":"Myfilter"}
   *             attribute:
   *               type: array
   *               description: array of filters
   *               example: {"attribute":[]}
      *             name:
      *               type: string
      *               description: name of dashboard where filter was created
      *               example: {"name":"/connectivityCA"}
      *             types:
      *               type: array
      *               description: array of types
      *               example: {"types":[]}
      *             timerange:
      *               type: array
      *               description: timestamp from and to
      *               example: {"timerange":[1610683132626,1610683145434]}
   *         required: true
   *         type: application/json
   *     responses:
   *       200:
   *         description: new settings file
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/SettingFile'
   *       400:
   *         description: problem with writing data to file
   *         content:
   *           application/json:
   *             example:
   *               error: "Config checked failed. Writing old config back."
   */
  static async save(request, respond) {

    //read from config file
    const jsonData = JSON.parse(fs.readFileSync(cfg.fileMonitor));
    let m_config = [];
    //if filters paste it on top layer
    if (request.body.app === "m_filters") {
      let filters = [];
      //old
      if (jsonData["general"]["m_filters"]) {
        filters = jsonData["general"]["m_filters"];
      } else {
        jsonData["general"]["m_filters"] = [];
      }

      //add new
      filters.push(request.body.attrs);
      jsonData["general"]["m_filters"] = filters;
      console.info("Writing new filters to file. " + JSON.stringify(filters));
    } else {
      //the rest of m_config
      let isConfigGroupThere = false;

      for (let i = 0; i < jsonData["general"]["global-config"].length; i++) {
        if (jsonData["general"]["global-config"][i]["app"] === "m_config") {
          m_config = request.body.attrs;
        }

        if (jsonData["general"]["global-config"][i]["app"] === request.body.app) {

          jsonData["general"]["global-config"][i]["attrs"] = request.body.attrs;
          isConfigGroupThere = true;
        }
      }

      //no m_sns or m_m_config or m_alarms
      if (isConfigGroupThere === false) {
        jsonData["general"]["global-config"].push(request.body);
      }
    }
    //write also monitor version
    //remove breaks from the string
    monitorVersion.replace(/(\r\n|\n|\r)/gm, "");
    jsonData["m_version"] = monitorVersion;

    //check cert and keys validation
    async function checkCertificate(m_config, respond) {
      return new Promise((resolve, reject) => {
        fs.readFile(cfg.fileDefaults, async function (err, defaults) {
          if (err) {
            console.error("Problem with reading defaults file. " + err);
            resolve(false);
          }
          else {
            let defaultsValues = JSON.parse(defaults);
            defaultsValues = defaultsValues[0].attrs;
            var key = "";
            var cert = "";
            var keyFormat = "";
            var resolving = true;

            //find if cert field is filled
            for (let hit of m_config) {
              if (hit.attribute.includes("cert") && hit.value !== "") {
                cert = JSON.parse(JSON.stringify(hit.value));
                // check format settings
                for (let def of defaultsValues) {
                  if (def.attribute === hit.attribute) {
                    if (def.type !== "file") {
                      cert = "";
                    }
                    else {
                      if (def.restriction && def.restriction.key) {
                        key = def.restriction.key;
                        // get the key if filled
                        for (let keyFile of m_config) {
                          if (keyFile.attribute === key) {
                            key = JSON.parse(JSON.stringify(keyFile.value));

                            //get key format
                            for (let defKey of defaultsValues) {
                              if (defKey.attribute === keyFile.attribute) {
                                if (defKey.restriction && defKey.restriction.format) {
                                  keyFormat = defKey.restriction.format;
                                }
                              }
                            }

                            if (!key || key === "") {
                              respond.status(400).send({
                                "msg": "No key for " + hit.attribute
                              });
                              resolve(false);
                            }
                          }
                        }
                      }
                      resolving = resolving && await new Promise((resolve, reject) => {
                        //check cert
                        const certResult = spawn('openssl', ["x509", "-text", "-noout"]);
                        certResult.stdin.write(cert);
                        certResult.stdin.end();

                        certResult.stderr.on('data', output => {
                          respond.status(400).send({
                            "msg": "Wrong format for " + hit.attribute + " " + output
                          });
                          resolve(false);
                        })

                        //store parsed cert
                        if (!def.restriction.type || (def.restriction.type && def.restriction.type !== "bundle")) {
                          hit.value = spawn('openssl', ["x509"]);
                          hit.value.stdin.write(cert);
                          hit.value.stdin.end();
                          hit.value.stdout.on('data', output => {
                            hit.value = output.toString();
                          })
                        }

                        let params = ["rsa", "-text", "-noout"];
                        //check key
                        if (key) {
                          if (keyFormat === "PKCS8") {
                            params = ["pkcs8", "-topk8", "-nocrypt"]
                          }

                          const keyResult = spawn('openssl', params);
                          keyResult.stdin.write(key);
                          keyResult.stdin.end();
                          keyResult.stderr.on('data', output => {
                            respond.status(400).send({
                              "msg": "Wrong format for " + def.restriction.key + " " + output
                            });
                            resolve(false);
                          })

                          var certificateMD5 = [];
                          var keyyMD5 = [];
                          //check if cert is valid for this key
                          const child = spawn('openssl', ["md5"]);
                          const certMD5 = spawn('openssl', ["x509", "-modulus", "-noout"]);
                          certMD5.stdin.write(cert);
                          certMD5.stdin.end();
                          child.stdin.pipe(certMD5.stdin);
                          child.stdin.end();
                          certMD5.stdout.on('data', output => {
                            certificateMD5 = output.toString();

                          })

                          const childKey = spawn('openssl', ["md5"]);
                          const keyMD5 = spawn('openssl', ["rsa", "-modulus", "-noout"]);
                          keyMD5.stdin.write(key);
                          keyMD5.stdin.end();
                          childKey.stdin.pipe(keyMD5.stdin);
                          childKey.stdin.end();
                          keyMD5.stdout.on('data', output => {
                            keyyMD5 = output.toString();
                            if (certificateMD5 !== keyyMD5) {
                              respond.status(400).send({
                                "msg": "This " + def.restriction.key + " is not valid key for " + hit.attribute
                              });
                              resolve(false);
                            }
                            else {
                              resolve(true);
                            }
                          })
                        }
                        else {
                          resolve(true);
                        }
                        key = "";
                        cert = "";
                      })
                    }
                  }
                }
              }
            }
            if (resolving) {
              resolve(true);
            }
            else {
              resolve(false);
            }
          }
        })
      })
    }

    let certCheck = await checkCertificate(m_config, respond);
    if (certCheck !== false) {

      //write it to monitor file
      SettingController.saveSettings(jsonData)
        .then((msg) => {
          respond.status(200).send({ "msg": msg });

        })
        .catch((err) => {
          respond.status(400).send({ "msg": err });
        });

    }
  }

  /**
   * Save settings into json file
   *
   * @param {object} jsonData
   * @returns Promise
   */
  static saveSettings(jsonData){

    const promise = new Promise(function(resolve, reject) {

      try {
        //rename old config file
        fs.renameSync(cfg.fileMonitor, cfg.fileMonitor + "_backup");
      }
      catch (err) {
        console.error("Problem with creating backup file. " + err);
        reject("Problem with creating backup file. " + err);
        return;
      }

      //write it to monitor file
      fs.writeFile(cfg.fileMonitor, JSON.stringify(jsonData, null, 2), function (error, stdout, stderr) {
        if (error) {
          //write old data back
          try {
            fs.renameSync(cfg.fileMonitor + "_backup", cfg.fileMonitor);
          }
          catch (err) {
            reject(err);
            return;
          }
          //remove backup file
          // fs.unlinkSync(cfg.fileMonitor + "_backup");
          console.error("Config checked failed. Writing old config back. " + stderr);
          reject(error);
          return;
        }
        console.info("Writing new config to file. " + JSON.stringify(jsonData));

        //call check config script
        exec("sudo /usr/sbin/abc-monitor-check-config", function (error, stdout, stderr) {
          if (error) {
            //write old data back - rename again
            try {
              fs.renameSync(cfg.fileMonitor + "_backup", cfg.fileMonitor);
            }
            catch (err) {
              reject(err);
              return;
            }
            //remove backup file
              //fs.unlinkSync(cfg.fileMonitor + "_backup");

            console.error("Config checked failed. Writing old config back. " + stderr);
            reject(stderr);
            return;

          } else {
            console.info("Activating config.");
            //call generate config script
            exec("sudo /usr/sbin/abc-monitor-activate-config", function (error, stdout, stderr) {
              if (error) {
                //write old data back - rename again
                try {
                  fs.renameSync(cfg.fileMonitor + "_backup", cfg.fileMonitor);
                }
                catch (err) {
                  reject(err);
                  return;
                }
                //remove backup file
                  //fs.unlinkSync(cfg.fileMonitor + "_backup");
                console.error("Config checked failed. Writing old config back. " + stderr);
                console.error("Config cannot be activated. " + stderr);
                reject(stderr);
                return;
              } else {
                console.info("New config activated.");
                //remove backup file
                  //fs.unlinkSync(cfg.fileMonitor + "_backup");

                resolve("Data has been saved.");
              }
            });
          }
        });
      });
    });

    return promise;
  }


  /**
   * @swagger
   * /api/tag:
   *   get:
   *     description: Add tag to event
   *     tags: [Setting]
   *     consumes:
   *       - application/json
   *     parameters:
   *       - in: body
   *         name: tag
   *         description: new tag
   *         schema:
   *           type: object
   *           properties:
   *             id:
   *               type: string
   *               example: U9dQO3cBRVjVWRSl0BzX
   *               description: event id
  *             name:
  *               type: string
  *               description: index where event is stored
  *               example: "logstashh-2021.01.25"
  *             types:
  *               type: array
  *               description: array of tags
  *               example: {"tags":["coolEvent"]}
   *         required: true
   *         type: application/json
   *     responses:
   *       200:
   *         description: Elasticsearch payload
   *         content:
   *           application/json:
   *             example:
   *               {_index: xxx, result: updated}
   *             schema:
   *               $ref: '#/definitions/Message'
   *       500:
   *         description: elasticsearch error
   *         content:
   *           application/json:
   *             example:
   *               {_index: xxx, result: error}
   */
  static tag(req, res, next) {
    async function search() {
      const tags = req.body.tags;
      const client = connectToES(res);
      const response = await client.update({
        id: req.body.id,
        type: '_doc',
        index: req.body.index,
        refresh: true,
        body: {
          doc: {
            attrs: {
              tags: tags
            }
          }
        }
      });

      client.close();
      return res.json(response);
    }

    return search().catch((e) => {
      return next(e);
    });
  }

  /**
   * @swagger
   * /api/tag/delete:
   *   get:
   *     description: delete tag from event
   *     tags: [Setting]
   *     consumes:
   *       - application/json
   *     parameters:
   *       - in: body
   *         name: tag
   *         description: tag to delete
   *         schema:
   *           type: object
   *           properties:
   *             id:
   *               type: string
   *               example: U9dQO3cBRVjVWRSl0BzX
   *               description: event id
  *             name:
  *               type: string
  *               description: index where event is stored
  *               example: "logstashh-2021.01.25"
  *             types:
  *               type: array
  *               description: array of tags
  *               example: {"tags":["coolEvent"]}
   *         required: true
   *         type: application/json
   *     responses:
   *       200:
   *         description: Elasticsearch payload
   *         content:
   *           application/json:
   *             example:
   *               {_index: xxx, result: updated}
   *             schema:
   *               $ref: '#/definitions/Message'
   *       500:
   *         description: elasticsearch error
   *         content:
   *           application/json:
   *             example:
   *               {_index: xxx, result: error}
   */
  static deleteTag(req, res, next) {
    async function search() {
      const tag = req.body.tags;
      const client = connectToES(res);
      const response = await client.updateByQuery({
        index: "*",
        refresh: true,
        body: {
          "query": {
            "match": {
              "attrs.tags": tag
            }
          },
          "script": {
            "source": "if(ctx._source.attrs.tags.contains(params.tag)) { ctx._source.attrs.tags.remove(ctx._source.attrs.tags.indexOf(params.tag)) }",
            "lang": "painless",
            "params": {
              "tag": tag
            }
          }
        }
      });

      client.close();
      return res.json(response);
    }

    return search().catch((e) => {
      return next(e);
    });
  }


  /**
   * /api/tags:
**/
  static tags(req, res, next) {
    async function search() {
      const client = connectToES(res);
      const tags = distinct_query.getTemplate('attrs.tags');

      const response = await client.msearch({
        body: [

          {
            index: 'logstash*',
            ignore_unavailable: true,
            preference: 1542895076143,
          },
          tags
        ]
      });

      client.close();
      return res.json(response);
    }

    return search().catch((e) => {
      return next(e);
    });
  }

  /**
   * @swagger
   * /api/monitor/version:
   *   get:
   *     description: Return the monitor version
   *     tags: [Setting]
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: Setting payload
   *         content:
   *           application/json:
   *             example:
   *               version: 4.5
   *       500:
   *         description: internal error
   *         content:
   *           application/json:
   *             example:
   *               error: "bash: not found"
   */
  static loadMonitorVersion(req, res) {
    try {
      fs.readFile("/build_info", 'utf8', function (err, defaults) {
        if (err) {
          return res.status(200).send({
            version: ""
          });
        }
        let release = defaults.indexOf("RELEASE=");
        if (release !== -1) {
          let version = defaults.substring(release + 8, release + 11);
          setMonitorVersion(version);
          monitorVersion = cfg.monitorVersion;
          return res.status(200).send({
            version: cfg.monitorVersion
          });
        }
        else {
          return res.status(200).send({
            version: ""
          });
        }
      });
    }
    catch (e) {
      return res.status(200).send({
        version: ""
      });
    }
  }

  //api/monitor/logo
  static loadLogo(req, res) {
    fs.readFile(cfg.fileGUILayout, function (err, defaults) {
      if (err) {
        res.status(400).send({
          msg: "Problem with reading data: " + err
        });
        console.error("Problem with reading monitor layout file. " + err);
      }
      defaults = JSON.parse(defaults);

      if (defaults.logo) {
        const img = fs.readFileSync(defaults.logo);
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(img, 'binary');
        return;
      }
      else {
        res.status(400).send({
          msg: "Problem with getting logo"
        });
      }
    });
  }

  //api/monitor/logo
  static loadFavicon(req, res) {
    fs.readFile(cfg.fileGUILayout, function (err, defaults) {
      if (err) {
        res.status(400).send({
          msg: "Problem with reading data: " + err
        });
        console.error("Problem with reading monitor layout file. " + err);
      }
      defaults = JSON.parse(defaults);
      if (defaults.favicon) {
        const img = fs.readFileSync(defaults.favicon);
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(img, 'binary');
        return;
      }
      else {
        res.status(400).send({
          msg: "Problem with getting favicon"
        });
      }
    });
  }

  // get hostnames
  static hostnames(req, res, next) {
    async function search() {
      const client = connectToES(res);

      //check if domain fiter should be use
      const isDomainFilter = await getJWTsipUserFilter(req);
      if (isDomainFilter.domain) {
        domainFilter = "tls-cn:" + isDomainFilter.domain;
      }

      // get hostnames list
      const hostnames = distinct_query.getTemplate('attrs.hostname', domainFilter);
      // get realms list
      const realms = distinct_query.getTemplate('attrs.realm', domainFilter);
      const srcRealms = distinct_query.getTemplate('attrs.src_rlm_name', domainFilter);
      const dstRealms = distinct_query.getTemplate('attrs.dst_rlm_name', domainFilter);
      const tags = distinct_query.getTemplate('attrs.tags', domainFilter);

      const response = await client.msearch({
        body: [
          {
            index: '*',
            ignore_unavailable: true,
            preference: 1542895076143,
          },
          hostnames,
          {
            index: 'collectd*',
            ignore_unavailable: true,
            preference: 1542895076143,
          },
          realms,
          {
            index: 'logstash*',
            ignore_unavailable: true,
            preference: 1542895076143,
          },
          srcRealms,
          {
            index: 'logstash*',
            ignore_unavailable: true,
            preference: 1542895076143
          },
          dstRealms,
          {
            index: 'logstash*',
            ignore_unavailable: true,
            preference: 1542895076143
          },
          tags
        ]
      });

      client.close();
      return res.json(response);
    }

    return search().catch((e) => {
      return next(e);
    });
  }


  /*
  get system stats - on logstash, elasticsearch
  */
  static systemStatus(req, res, next) {
    async function search() {
      const client = connectToES(res);
      var filter = {
        index: 'status*',
        size: 1,
        "query": {
          "bool": {
            "must": [
              { "range": { "@timestamp": { "gte": "now-40s", "lte": "now" } } }
            ]
          }
        }
      };
      var result = await client.search(filter);
      return res.json(200, result);
    }
    return search().catch((e) => {
      return next(e);
    });
  }
}

module.exports = SettingController;
