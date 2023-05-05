// index.js hold the controller boilerplate

const AdminController = require('./admin');
const CallsController = require('./calls');
const ConferenceController = require('./conference');
const ConnectivityCAController = require('./connectivityCA');
const ConnectivityController = require('./connectivity');
const DiagramController = require('./diagram');
const DiagnosticsController = require('./diagnostics');
const ExceededController = require('./exceeded');
const HomeController = require('./home');
const MonitoringController = require('./monitoring');
const MicroanalysisController = require('./microanalysis');
const NetworkController = require('./network');
const OverviewController = require('./overview');
const QoSController = require('./qos');
const RealmController = require('./realm');
const RegistrationController = require('./registration');
const SettingController = require('./setting');
const SecurityController = require('./security');
const SystemController = require('./system');
const TransportController = require('./transport');
const ProfileController = require('./profile');
const Controller = require('./controller');

// controller boilerplate code

function newHTTPError(status, msg) {
  const err = new Error(msg);
  err.status = status;
  return err;
}

// generate a not found error (400)
function newBadRequest(msg) {
  return newHTTPError(400, msg);
}

module.exports = {
  newHTTPError: () => newHTTPError,
  newBadRequest: () => newBadRequest,
  AdminController,
  CallsController,
  ConferenceController,
  ConnectivityCAController,
  ConnectivityController,
  DiagramController,
  DiagnosticsController,
  ExceededController,
  HomeController,
  MonitoringController,
  MicroanalysisController,
  NetworkController,
  OverviewController,
  QoSController,
  RealmController,
  RegistrationController,
  SettingController,
  SecurityController,
  SystemController,
  TransportController,
  ProfileController,
  Controller
};
