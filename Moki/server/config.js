const path = require('path');
const appDir = path.dirname(require.main.filename);
const dotenv = require('dotenv');
dotenv.config();

const c = {
  JWT_required: false,
  port: process.env.PORT || 5000,
  addr: process.env.ADDR || '127.0.0.1',
  nodeEnv: process.env.NODE_ENV || 'production',
  monitorVersion: '5.0',
  userFilter: '*',
  fileMonitor: '/data/abc-monitor/monitor.json',
  fileDefaults: '/etc/abc-monitor/defaults.json',
  fileGUILayout: '/data/abc-monitor/monitor-layout.json',
  htpasswd: '/data/abc-monitor/htpasswd',
  rootDir: appDir,
  es: process.env.ES || 'localhost:9200',
  logstash: process.env.LOGSTASH || 'http://localhost:9600',
  debug: process.env.MOKI_DEBUG || false
};

if (process.env.NODE_ENV === "dev") {
  c.fileMonitor = path.join(__dirname, "data/monitor.json")
  c.fileDefaults = path.join(__dirname, "data/defaults.json")
  c.fileGUILayout = path.join(__dirname, "data/monitor-layout.json")
}

module.exports = c;
