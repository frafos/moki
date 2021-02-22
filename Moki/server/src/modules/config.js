// config.js
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const appDir = path.dirname(require.main.filename);

dotenv.config();

const c = {
    // redisAddr: process.env.REDIS_ADDR || '127.0.0.1',
    // redisPort: process.env.REDIS_PORT || '6379',
    port: process.env.PORT || 5000,
  addr: process.env.ADDR || '127.0.0.1',
  nodeEnv: process.env.NODE_ENV || 'production',
    monitorVersion: '4.5',
    userFilter: '*',
    fileDefaults: '/etc/abc-monitor/defaults.json',
    fileMonitor: '/etc/abc-monitor/monitor.json',
    rootDir: appDir,
    es: process.env.ES || 'localhost:9200',
};

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
    return new Promise(function (resolve, reject) {
        //check if in monitor.json
        fs.readFile(c.fileMonitor, (err2, data) => {
            if (err2) {
                console.error(`Problem with reading default file. ${err2}`);
                reject;
            }
            const jsonData = JSON.parse(data);
            if ('general' in jsonData && jsonData.general['global-config']) {

                jsonData.general['global-config'].forEach(data => {
                    if (data.app === "m_config") {
                        data.attrs.forEach(attrs => {
                            if (attrs.attribute === "requireJwt") {
                                resolve(attrs.value);
                            }
                        })
                    }
                })
            }

            //get value from defaults.json
            fs.readFile(c.fileDefaults, (err2, data) => {
                if (err2) {
                    console.error(`Problem with reading default file. ${err2}`);
                    reject;
                }
                const jsonData = JSON.parse(data);
                    jsonData.forEach(data => {
                        if (data.app === "m_config") {
                            data.attrs.forEach(attrs => {
                                if (attrs.attribute === "requireJwt") {
                                    resolve(attrs.value)
                                }
                            })
                        }
                    })
            })
        })
        reject;
    })
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
    getWebFilter
};
