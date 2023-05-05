// index.js hold the routing logic

const express = require('express');
const swaggerUi = require('swagger-ui-express');
const specs = require('../modules/swagger');
const {
  AdminController, CallsController, ConferenceController,
  ConnectivityCAController, ConnectivityController,
  DiagramController, DiagnosticsController, ExceededController,
  HomeController, MonitoringController, MicroanalysisController,
  NetworkController, OverviewController, QoSController,
  RealmController, RegistrationController,
  SettingController, SecurityController, SystemController,
  TransportController, ProfileController, Controller
} = require('../controller');
const { nodeEnv } = require('../modules/config');

module.exports = () => {
  const router = express.Router();

  router
    .get('/user/sip', AdminController.getSipUser)
    .get('/user/check', AdminController.noNginxUser)
    .get('/user/username', AdminController.getUsername)
    .post('/user/mode/change', AdminController.storeModeChange)
    .post('/user/create', AdminController.createUser)
    .get('/firsttimelogin/check', AdminController.firstTimeLoginCheck)
    .post('/firsttimelogin/save', AdminController.firstTimeLoginSave);

  router
    .post('/calls/charts', CallsController.getCharts)
    .post('/calls/table', CallsController.getTable);

  router
    .get('/layout', SettingController.loadGUILayout)
    .get('/setting', SettingController.load)
    .get('/defaults', SettingController.defaults)
    .get('/status', SettingController.systemStatus)
    .get('/monitor/version', SettingController.loadMonitorVersion)
    .get('/monitor/logo', SettingController.loadLogo)
    .get('/monitor/favicon', SettingController.loadFavicon)
    .post('/filters', SettingController.loadFilters)
    .get('/hostnames', SettingController.hostnames)
    .post('/save', SettingController.save)
    .post('/tag', SettingController.tag)
    .get('/tags', SettingController.tags)
    .post('/tag/delete', SettingController.deleteTag)
    .post('/filters/delete', SettingController.deleteFilter)
    .post('/filters/save', SettingController.saveFilter)
    .post('/parse/certificate', SettingController.parseOpenSSLCertificate);

  router
    .post('/profile/save', ProfileController.storeUserSettings)
    .post('/profile/delete', ProfileController.deleteUserSettings)
    .get('/profile', ProfileController.getUserSettings);

  router
    .post('/download/pcap', DiagramController.downloadPcap)
    .post('/download/merged', DiagramController.downloadMergePcap)
    .post('/diagram/download', DiagramController.sequenceDiagramDownload)
    .post('/diagram', DiagramController.sequenceDiagram);

  router
    .post('/home/charts', HomeController.getCharts);

    router
    .post('/scroll', Controller.scroll)
    .post('/cleanScroll', Controller.cleanScroll);
    

  router
    .post('/conference/charts', ConferenceController.getCharts)
    .post('/conference/table', ConferenceController.getTable);

  router
    .post('/connectivityCA/charts', ConnectivityCAController.getCharts)
    .post('/connectivityCA/table', ConnectivityCAController.getTable)
    .post('/connectivityCA/connection_failure_ratio_ca', ConnectivityCAController.getConnectionFailureRatioCA)
    .post('/connectivityCA/number_of_call-attemps_ca', ConnectivityCAController.getNumberOfCallAttemptsCA)
    .post('/connectivityCA/number_of_call-ends_ca', ConnectivityCAController.getNumberOfCallEndsCA)
    .post('/connectivityCA/error_code_analysis', ConnectivityCAController.getErrorCodeAnalysis)
    .post('/connectivityCA/from_to_ca', ConnectivityCAController.getFromToCA)
    .post('/connectivityCA/avg_duration_of_calls_ca', ConnectivityCAController.getDurationCA)
    .post('/connectivity/charts', ConnectivityController.getCharts);

  router
    .post('/diagnostics/charts', DiagnosticsController.getCharts)
    .post('/diagnostics/table', DiagnosticsController.getTable);

  router
    .post('/exceeded/table', ExceededController.getTable)
    .post('/exceeded/charts', ExceededController.getCharts);

  router
    .post('/microanalysis/charts', MicroanalysisController.getCharts);

  router
    .post('/network/table', NetworkController.getTable)
    .post('/network/charts', NetworkController.getCharts);

  router
    .post('/overview/table', OverviewController.getTable)
    .post('/overview/charts', OverviewController.getCharts);

  router
    .post('/qos/table', QoSController.getTable)
    .post('/qos/qos_histogram', QoSController.getQoSHistogram)
    .post('/qos/charts', QoSController.getCharts);

  router
    .post('/realm/table', RealmController.getTable)
    .post('/realm/charts', RealmController.getCharts);

  router
    .post('/registration/table', RegistrationController.getTable)
    .post('/registration/registrations_map', RegistrationController.getGeoip)
    .post('/registration/charts', RegistrationController.getCharts)
    .post('/registration/geoData', RegistrationController.getGeoData);

  router
    .post('/security/charts', SecurityController.getCharts)
    .post('/security/security_geo_events', SecurityController.getGeoip)
    .post('/security/top_subnets', SecurityController.getTopSubnets)
    .post('/security/events_by_country', SecurityController.getEventsByCountry)
    .post('/security/events_by_ip_addr', SecurityController.getEventsByIP)
    .post('/security/table', SecurityController.getTable)
    .post('/security/geoData', SecurityController.getGeoData);

  router
    .post('/system/charts', SystemController.getCharts)
    .post('/system/table', SystemController.getTable);

  router
    .post('/transport/charts', TransportController.getCharts)
    .post('/transport/table', TransportController.getTable);

  router
    .post('/monitoring/charts', MonitoringController.getCharts)
    .post('/monitoring/events', MonitoringController.getEvents)
    .post('/monitoring/sbc', MonitoringController.getSbc);


  if (nodeEnv !== 'test') {
    router.use('/docs', swaggerUi.serve);
    router.get('/docs', swaggerUi.setup(specs, { explorer: true }));
    router.get('/docs.json', (req, res) => res.json(specs));
  }

  return router;
};
