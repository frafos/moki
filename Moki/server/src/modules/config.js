// config.js
const fs = require('fs');
const path = require('path');
const appDir = path.dirname(require.main.filename);
const c = require("../../config");

if (c.nodeEnv === 'test') {
  c.port = 5001;
}

function readJsonFileSync(filepath, encoding) {
  return (typeof (encoding) == 'undefined') ? JSON.parse(fs.readFileSync(filepath, 'utf8')) : JSON.parse(fs.readFileSync(filepath, encoding));
}

// get filter for website
async function getWebFilter() {
  return new Promise(function (resolve, reject) {
    fs.readFile(c.fileMonitor, (err2, data) => {
      if (err2) {
        console.error(`Problem with reading default file. ${err2}`);
        reject;
      }
      const jsonData = JSON.parse(data);
      if ('general' in jsonData && jsonData.general['global-config']) {

        jsonData.general['global-config'].forEach(data => {
          if (data.app === "m_settings") {
            data.attrs.forEach(attrs => {
              if (attrs.attribute === "webFilter") {
                resolve(attrs.value)
              }
            })
          }
        })
        resolve("nodata");
      }
    })
    reject;
  })
}


// is accept JWT in settings
async function isRequireJWT() {
    //check if files exists
    if (!fs.existsSync(c.fileMonitor)) {
      return;
    }
    if (!fs.existsSync(c.fileDefaults)) {
      return;
    }

    //check if in monitor.json
    fs.readFile(c.fileMonitor, (err2, data) => {
      if (err2) {
        console.error(`Problem with reading default file. ${err2}`);
        return;
      }
      const jsonData = JSON.parse(data);
      if ('general' in jsonData && jsonData.general['global-config']) {

        jsonData.general['global-config'].forEach(data => {
          if (data.app === "m_config") {
            data.attrs.forEach(attrs => {
              if (attrs.attribute === "requireJwt") {
                return attrs.value;
              }
            })
          }
        })
      }

      //get value from defaults.json
      fs.readFile(c.fileDefaults, (err2, data) => {
        if (err2) {
          console.error(`Problem with reading default file. ${err2}`);
          return;
        }
        const jsonData = JSON.parse(data);
        jsonData.forEach(data => {
          if (data.app === "m_config") {
            data.attrs.forEach(attrs => {
              if (attrs.attribute === "requireJwt") {
                return attrs.value
              }
            })
          }
        })
      })
    })
    return;
}

function getActualConfig() {
  return fs.readFile(c.fileDefaults, 'utf-8', (err, defaults) => {
    if (err) {
      console.error(`Problem with reading default file. ${err}`);
      return `Problem with reading data: ${err}`;
    }

    return fs.readFile(c.fileMonitor, 'utf-8', (err2, data) => {
      if (err2) {
        console.error(`Problem with reading default file. ${err2}`);
        return `Problem with reading data: ${err2}`;
      }

      console.info('Reading files and inserting default values.');
      // if value in monitor.json use this one, not default
      const jsonData = JSON.parse(data);
      const jsonDefaults = JSON.parse(defaults);
      if ('general' in jsonData && jsonData.general['global-config']) {
        jsonData.general['global-config'].forEach(data => {
          jsonDefaults.forEach(defaults => {
            if (data.app == defaults.app) {
              data.attrs.forEach(attrs => {
                defaults.attrs.forEach(defaultsAttrs => {
                  if (attrs.attribute == defaultsAttrs.attribute) {
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
      return jsonDefaults;
    });
    reject;
  });
}

//get second default
async function getDefaults() {
  return new Promise(function (resolve, reject) {
    fs.readFile("/etc/abc-monitor/defaults_intuitive.json", (err, defaults) => {
      if (err) {
        console.error(`Problem with reading default file. ${err}`);
        reject;
      }
      resolve(JSON.parse(defaults));
    })
  })
}

module.exports = {
  cfg: c,
  setMonitorVersion: (v) => {
    c.monitorVersion = v;
  },
  getConfig: (file) => {
    const filepath = `${appDir}/../${file}`;
    return readJsonFileSync(filepath);
  },
  getActualConfig,
  isRequireJWT,
  getWebFilter,
  getDefaults
};