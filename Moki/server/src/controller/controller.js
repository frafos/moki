// calls.js hold the calls endpoint

const { getFiltersConcat, getTypesConcat, getQueries, checkSelectedTypes } = require('../utils/metrics');
const { connectToES } = require('../modules/elastic');
const scroll = require('../../js/template_queries/scroll');
const fs = require('fs');
let { timestamp_gte, timestamp_lte } = require('../utils/ts');
const { getTimestampBucket } = require('../utils/ts');
const { getJWTsipUserFilter, getEncryptChecksumFilter, checkIAT } = require('../modules/jwt');
const timerange_query = require('../../js/template_queries/timerange_query');
const { cfg } = require('../modules/config');

const supress = "nofield";
let userFilter = "*";
let domainFilter = "*";

/*
Request - array of object. {template, params, filter, index}
*/
//if no dashboard selected, use overview as default
class Controller {
  static request(req, res, next, requests, dashboard = "overview") {
    async function search() {
      //check token
      let checkiat = await checkIAT(req, res);
      if (checkiat === "logout") {
        return res.json({ redirect: "logout" });
      }

      const client = connectToES();
      var filters = getFiltersConcat(req.body.filters);
      let types = req.body.types;

      if (req.body.timerange_lte) {
        timestamp_lte = Math.round(req.body.timerange_lte);
      }

      if (req.body.timerange_gte) {
        timestamp_gte = Math.round(req.body.timerange_gte);
      }

      if (req.body.timerange === "*") {
        timestamp_gte = "*";
        timestamp_lte = "*";
      }

      if (cfg.debug) console.info("--------------------------ES DATA SEARCH---------------------");
      //check if encrypt filter should be used
      let isEncryptChecksumFilter = await getEncryptChecksumFilter(req);
      if (isEncryptChecksumFilter.encryptChecksum) {
        if (cfg.debug) console.info("Using encrypt checksum filter " + isEncryptChecksumFilter.encryptChecksum);
        isEncryptChecksumFilter = isEncryptChecksumFilter.encryptChecksum;
      }

      //special case: disable disableHMACfilter - for account chart
      if (req.url === "/account/charts" || req.url === "/account/distinc_encrypt") {
        isEncryptChecksumFilter = "*";
      }

      //if no types from client, get types from monitor_layout
      if (types.length === 0) {
        types = await checkSelectedTypes([], dashboard);
      }
      //or if client request types, use this instead 
      else {
        if (req.url.includes("exceeded") || req.url.includes("alerts")) {
          types = getTypesConcat(types, "exceeded");
        }
        else {
          types = getTypesConcat(types);
        }
      }

      if (cfg.debug) console.info("Using types " + types);
      //disable types for network dashboard
      if (req.url.includes("network") || req.url.includes("system") || req.url.includes("realm")) {
        types = "*";
        if (cfg.debug) console.info("Removed types for network, system and realm dahsboard");

      }
      const oldtypes = types;

      var isEncryptChecksumFilterOld = isEncryptChecksumFilter;
      for (let i = 0; i < requests.length; i++) {
        //disable types for specific requests (e.g. different index in dashboard)
        if (requests[i].types) {
          types = "*";
          if (cfg.debug) console.info("Removed types for this chart");
        }


        //if timestamp_lte is set, get value
        if (requests[i].timestamp_lte) {
          timestamp_lte = eval(timestamp_lte + requests[i].timestamp_lte);
        }

        //get timebucket value
        let timebucket = getTimestampBucket(timestamp_gte, timestamp_lte);

        //get last timebucket
        let lastTimebucket = "";
        if (timebucket.includes("s")) {
          lastTimebucket = timestamp_lte - (timebucket.slice(0, -1) * 1000);
        }
        else if (timebucket.includes("m")) {
          lastTimebucket = timestamp_lte - (timebucket.slice(0, -1) * 60 * 1000);
        }
        if (timebucket.includes("h")) {
          lastTimebucket = timestamp_lte - (timebucket.slice(0, -1) * 60 * 60 * 1000);
        }

        //get last last timebucket
        let lastlastTimebucket = "";
        if (timebucket.includes("s")) {
          lastlastTimebucket = lastTimebucket - (timebucket.slice(0, -1) * 1000);
        }
        else if (timebucket.includes("m")) {
          lastlastTimebucket = lastTimebucket - (timebucket.slice(0, -1) * 60 * 1000);
        }
        if (timebucket.includes("h")) {
          lastlastTimebucket = lastTimebucket - (timebucket.slice(0, -1) * 60 * 60 * 1000);
        }


        //if timestamp_gte is set, get value
        if (requests[i].timestamp_gte) {
          //last time bucket
          if (requests[i].timestamp_gte === "lastTimebucket") {
            timestamp_gte = lastTimebucket;
          }
          //special case: last last timebucket for home dashboard
          else if (requests[i].timestamp_gte === "lastlastTimebucket") {
            timestamp_gte = lastlastTimebucket;
            timestamp_lte = lastTimebucket;

          }
          //timestamp_lte is depending on timestamp_gte
          else if (requests[i].timestamp_gte.includes("timestamp_lte")) {
            requests[i].timestamp_gte.replace('timestamp_lte', timestamp_lte);
            timestamp_gte = eval(requests[i].timestamp_gte);
          }
          //count it
          else {
            timestamp_gte = eval(timestamp_gte + requests[i].timestamp_gte);
          }
        }

        timebucket = getTimestampBucket(timestamp_gte, timestamp_lte);

        if (requests[i].index.includes("collectd")) {
          isEncryptChecksumFilter = "*";
        }



        //check if domain fiter should be use
        const isDomainFilter = await getJWTsipUserFilter(req);
        if (isDomainFilter.domain) {
          domainFilter = isDomainFilter.domain;
          //check if user fiter should be use
          if (isDomainFilter.userFilter) {
            userFilter = isDomainFilter.userFilter;
          }
        }

        if (requests[i].params) {
          //check if params contains "timebucket", insert it
          let params = requests[i].params;
          if (params.includes("timebucket")) {
            params = params.map(function (item) { return item === "timebucket" ? timebucket : item; });

          }
          if (params.includes("timestamp_lte")) {
            params = params.map(function (item) { return item === "timestamp_lte" ? timestamp_lte : item; });

          }
          if (params.includes("timestamp_gte")) {
            params = params.map(function (item) { return item === "timestamp_gte" ? timestamp_gte : item; });

          }
          if (params.includes("timebucketAnimation")) {
            //video length 30 sec
            let timebucketAnimation = (timestamp_lte - timestamp_gte) / 30000;
            timebucketAnimation = Math.round(timebucketAnimation) + "s";
            params = params.map(function (item) { return item === "timebucketAnimation" ? timebucketAnimation : item; });
          }

          if (requests[i].filters === "*") filters = "*";

          //special case: disable disableHMACfilter - for loging events - different index
          if (requests[i].index === "lastlog*" || requests[i].index === "polda*") {
            isEncryptChecksumFilter = "*";
            types = "*";
          }
          requests[i].query = requests[i].template.getTemplate(...params, getQueries(filters, types, timestamp_gte, timestamp_lte, userFilter, requests[i].filter, domainFilter, isEncryptChecksumFilter, requests[i].exists, requests[i].index), supress);

        }
        else {
          //special case: disable disableHMACfilter - for loging events - different index
          if (requests[i].index === "lastlog*" || requests[i].index === "polda*") {
            isEncryptChecksumFilter = "*";
            types = "*";
          }

          requests[i].query = requests[i].template.getTemplate(getQueries(filters, types, timestamp_gte, timestamp_lte, userFilter, requests[i].filter, domainFilter, isEncryptChecksumFilter, requests[i].exists, requests[i].index), supress);
        }

        //ged old timestamp if has changed
        if (req.body.timerange_lte) {
          timestamp_lte = Math.round(req.body.timerange_lte);
        }

        if (req.body.timerange_gte) {
          timestamp_gte = Math.round(req.body.timerange_gte);
        }
        types = oldtypes;
        isEncryptChecksumFilter = isEncryptChecksumFilterOld;
      }
      console.info("SERVER search with filters: " + filters + " types: " + types + " timerange: " + timestamp_gte + "-" + timestamp_lte + " userFilter: " + userFilter + " domainFilter: " + domainFilter + " encrypt checksum: " + isEncryptChecksumFilter);
      console.log(new Date() + " send msearch");
      const requestList = [];
      for (let j = 0; j < requests.length; j++) {
        if (cfg.debug) console.info(requests[j].index);
        if (cfg.debug) console.info(JSON.stringify(requests[j].query));

        requestList.push(
          {
            index: requests[j].index,
            "ignore_unavailable": true,
            "preference": 1542895076143
          },
          requests[j].query
        );
      }

      const response = await client.msearch({
        body: requestList
      }).catch((err) => {
        /*res.render('error_view', {
          title: 'Error',
          error: err
          });*/
        err.status = 400;
        return next(err);
      });

      console.log(new Date() + " got elastic data");
      client.close();
      let resp = res.json(response);
      if (typeof resp === "string") {
        if (cfg.debug) console.info("-----ES response----- " + resp);
        console.error("Failed msearch: " + resp);
        console.error("Failed msearch query: " + JSON.stringify(requestList));
      }

      // if (cfg.debug) console.info("ES response: " + JSON.stringify(response));
      return resp;
    }

    return search().catch(e => {
      return next(e);
    });
  }

  //scroll function for export
  static async scroll(req, res) {
    try {
      const client = connectToES();
      const responseScroll = await scroll.scroll(client, req.body.scroll_id);
      res.json(responseScroll);
    }
    catch (error) {

    }

  }

  //clean scroll function for export
  static async cleanScroll(req, res) {
    try {
      const client = connectToES();
      client.clearScroll({ "scroll_id": req.body.scroll_id })
      res.json("ok");
    }
    catch (error) {

    }

  }


  //special case, not msearch and with scroll parameter
  static requestTable(req, res, next, requests, dashboard = "overview") {
    async function search() {
      const client = connectToES();
      let filters = getFiltersConcat(req.body.filters);
      let types = req.body.types;
      let req_index = req.body.index;
      let querySize = req.body.params && req.body.params.size ? req.body.params.size : 500;
      if (cfg.debug) console.info("----------------------TABLE DATA SEARCH-------------------------");

      //if no types from client, get types from monitor_layout
      if (!types || types.length === 0) {
        types = await checkSelectedTypes([], dashboard);
      }
      //or if client request types, use this instead 
      else if (requests.types !== "*") {
        if (req.url.includes("exceeded") || req.url.includes("alerts")) {
          types = getTypesConcat(types, "exceeded");
        }
        else {
          types = getTypesConcat(types);
        }
      }

      if (requests.index === "report*") {
        types = "*";
      }

      if (req_index) {
        requests.index = req_index;
      }

      if (req.url.includes("network") || req.url.includes("system") || req.url.includes("realm")) {
        types = "*";
      }

      //disable types for specific requests (e.g. different index in dashboard)
      if (requests.types === "*") {
        types = "*";
      }

      //disable types for specific requests that are coming from request (e.g. different index in dashboard)
      if (req.body.types === "*") {
        types = "*";
        requests.filter = "*";
      }


      if (req.body.timerange_lte) {
        timestamp_lte = Math.round(req.body.timerange_lte);
      }

      if (req.body.timerange_gte) {
        timestamp_gte = Math.round(req.body.timerange_gte);
      }

      if (req.body.timerange === "*") {
        timestamp_gte = "*";
        timestamp_lte = "*";
      }

      const timebucket = getTimestampBucket(timestamp_gte, timestamp_lte);
      //check if domain fiter should be use
      const isDomainFilter = await getJWTsipUserFilter(req);
      if (isDomainFilter.domain) {
        domainFilter = isDomainFilter.domain;

        //check if user fiter should be use
        if (isDomainFilter.userFilter) {
          userFilter = isDomainFilter.userFilter;
        }
      }


      //check if encrypt filter should be used
      let isEncryptChecksumFilter = await getEncryptChecksumFilter(req);
      if (isEncryptChecksumFilter.encryptChecksum) {
        if (cfg.debug) console.info("Encrypt checksum filter applied " + isEncryptChecksumFilter.encryptChecksum);
        isEncryptChecksumFilter = isEncryptChecksumFilter.encryptChecksum;
      }

      //special case: disable disableHMACfilter - for account chart
      if (req.url === "/account/table") {
        isEncryptChecksumFilter = "*";
      }

      //for export return only some attr, list is stored in layout
      var source = "*";
      if (req.body.params && req.body.params.type === "export") {
        try {
          let layout = fs.readFileSync(cfg.fileGUILayout);
          source = JSON.parse(layout.toString('utf8')).export;
        }
        catch (error) {
          console.error("Problem to read monitor layout file. " + error);
        }
      }

      //no filters for report index
      if (requests.index === "report*") {
        filters = "*";
      }
      let resp = "";
      console.info("SERVER search with filters: " + JSON.stringify(filters) + " types: " + types + " timerange: " + timestamp_gte + "-" + timestamp_lte + " timebucket: " + timebucket + " userFilter: " + userFilter + " domainFilter: " + domainFilter + " encrypt checksum filter: " + isEncryptChecksumFilter);
      //always timerange_query
      let shouldSortByTime = requests.index.includes("logstash") || requests.index.includes("collectd") || requests.index.includes("exceeded") ? true : false;
      requests.query = timerange_query.getTemplate(getQueries(filters, types, timestamp_gte, timestamp_lte, userFilter, requests.filter, domainFilter, isEncryptChecksumFilter, false, requests.index), supress, source, shouldSortByTime, querySize);
      if (cfg.debug) console.info(requests.index);
      if (cfg.debug) console.info(JSON.stringify(requests.query));

      var response = await client.search({
        index: requests.index,
        scroll: '5m',
        "ignore_unavailable": true,
        "preference": 1542895076143,
        body: requests.query
      });

      resp = res.json(response);
      
      userFilter = "*";
      console.info(new Date() + " got elastic data");

      client.close();
      if (typeof resp === "string") {
        console.error("Failed msearch: " + resp);
        console.error("Failed msearch query: " + JSON.stringify(requests.query));
      }
      return resp;
    }

    return search().catch(e => {
      return next(e);
    });
  }

}

module.exports = Controller;
