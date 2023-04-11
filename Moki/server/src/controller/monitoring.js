// monitoring.js hold the home endpoint
const exec = require('child_process').exec;
const http = require('http');
const {
  getFiltersConcat,
  getQueries
} = require('../utils/metrics');
const { connectToES } = require('../modules/elastic');
let {
  timestamp_gte,
  timestamp_lte
} = require('../utils/ts');
const { getJWTsipUserFilter } = require('../modules/jwt');
const two_agg_query_limit = require('../../js/template_queries/two_agg_query_limit');
const { cfg } = require('../modules/config');

let domainFilter = "*"; 
const supress = "nofield";

class monitoringController {

  /**
   * @swagger
   * /api/monitoring/charts:
   *   post:
   *     description: Get monitoring charts
   *     tags: [Monitoring]
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: pretty
   *         description: Return a pretty json
   *         in: query
   *         required: false
   *         type: bool
   *       - name: form
   *         description: monitoring form
   *         in: body
   *         type: object
   *         required:
   *          - filters
   *          - types
   *          - timerange_gte
   *          - timerange_lte
   *         properties:
   *          filters:
   *            description: epmty array
   *            type: array
   *            example: []
   *          types:
   *            description: empty array
   *            type: array
   *            example: []
   *          timerange_gte:
   *            description: empty string
   *            type: string
   *            example:
   *              timerange_gte: ""
   *          timerange_lte:
   *            description: empty string
   *            type: string
   *            example:
   *              timerange_lte: ""
   *     responses:
   *       200:
   *         description: return monitoring data
   *         content:
   *           application/json:
   *              schema: 
   *              type: array
   *              example:
   *                 [_nodes: {clustername: elasticsearch, nodes: [] }, {logstash: active, elasticsearch: active}, {_shards: {indices: {}, _shards: {}, _all: {}}}]
   *       400:
   *         description: elasticsearch error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/ChartResponseError'
   */

  static getCharts(req, res, next) {
    async function search() {
      const client = connectToES();

      let logstash = "";
      //get systemctl status logstash
      exec("systemctl is-active  logstash", function (error, stdout) {
        if (!error) {
          logstash = stdout;
        } else {
          logstash = error;
        }
      });

      let elasticsearch = "";
      //get systemctl status elasticsearch
      exec("systemctl is-active elasticsearch", function (error, stdout) {
        if (!error) {
          elasticsearch = stdout;
        } else {
          elasticsearch = error;
        }
      });

      let memoryFree = "";
       //get free memory
       exec("free | awk '/Mem:/ { print $4 }'", function (error, stdout) {
        if (!error) {
          memoryFree = parseInt(stdout);
        } else {
          memory = error;
        }
      });


      let memoryTotal = "";
      //get avail + buff/cache memory
      exec("free | awk '/Mem:/ { print $2 }'", function (error, stdout) {
       if (!error) {
        memoryTotal = parseInt(stdout);
       } else {
        memoryTotal = error;
       }
     });

      const data = [];
      let node;
      let indices;

      try {
        node = await client.nodes.stats();
        indices = await client.indices.stats();
      } catch (error) {
        //send at least status
        data.push({});
        data.push({
          logstash: logstash,
          elasticsearch: elasticsearch,
          memoryFree: memoryFree,
          memoryTotal: memoryTotal
        });
        data.push({});
        res.send(data);
      }

      // TODO: hardcoded, should be better
      // sucessfully fetched es data
      elasticsearch = "active";
      logstash = "active";
      data.push(node);
      data.push({
        logstash: logstash,
        elasticsearch: elasticsearch,
        memoryFree: memoryFree,
        memoryTotal: memoryTotal
      });
      data.push(indices);
      client.close();
      return res.json(data);
    }

    return search().catch(e => {
      return next(e);
    });
  }

  /**
* @swagger
* /api/monitoring/events:
*   post:
*     description: Get events statistics
*     tags: [Monitoring]
*     produces:
*       - application/json
*     parameters:
*       - name: pretty
*         description: Return a pretty json
*         in: query
*         required: false
*         type: bool
*       - name: form
*         description: monitoring form
*         in: body
*         type: object
*         required:
*          - filters
*          - types
*          - timerange_gte
*          - timerange_lte
*         properties:
*          filters:
*            description: epmty array
*            type: array
*            example: []
*          types:
*            description: empty array
*            type: array
*            example: []
*          timerange_gte:
*            description: empty string
*            type: string
*            example:
*              timerange_gte: ""
*          timerange_lte:
*            description: empty string
*            type: string
*            example:
*              timerange_lte: ""
*     responses:
*       200:
*         description: return events data
*         content:
*           application/json:
*              schema: 
*              type: array
*              example:
*                 [ephemeral_id: "2eed7083-47c1-49bb-a3c1-7e232f275cde", events: {in: 11508789, filtered: 11508789, out: 11508789, duration_in_millis: 64411180}, host: "monitor", http_address: "127.0.0.1:9600", id: "0815399c-42a2-4bc5-bbea-0c0e2b0a6e6a", name: "monitor", pipeline: {workers: 1, batch_size: 125, batch_delay: 50}, snapshot: false, status: "green", version: "7.7.1"]
*       400:
*         description: elasticsearch error
*         content:
*           application/json:
*             schema:
*               $ref: '#/definitions/ChartResponseError'
*/
  static getEvents(req, res, next) {
    async function search() {
      http.get(`${cfg.logstash}/_node/stats/events`, (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
          data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
          return res.json(JSON.parse(data));
        });
      }).on("error", function () { return next("Problem with getting stats from ES."); });
    }

    return search().catch(e => {
      return next(e);
    });


  }

  /**
* @swagger
* /api/monitoring/sbc:
*   post:
*     description: Get SBC events stats
*     tags: [Monitoring]
*     produces:
*       - application/json
*     parameters:
*       - name: pretty
*         description: Return a pretty json
*         in: query
*         required: false
*         type: bool
*       - name: form
*         description: monitoring form
*         in: body
*         type: object
*         required:
*          - filters
*          - types
*          - timerange_gte
*          - timerange_lte
*         properties:
*          filters:
*            description: epmty array
*            type: array
*            example: []
*          types:
*            description: empty array
*            type: array
*            example: []
*          timerange_gte:
*            description: empty string
*            type: string
*            example:
*              timerange_gte: ""
*          timerange_lte:
*            description: empty string
*            type: string
*            example:
*              timerange_lte: ""
*     responses:
*       200:
*         description: return events data
*         content:
*           application/json:
*              schema: 
*              type: array
*              example:
*                 [aggregations: {agg: {}}, agg: {}, hits: {total: {value: 353730, relation: "eq"}, max_score: null, hits: []}, hits: [], max_score: null, total: {value: 353730, relation: "eq"}, timed_out: false,took: 49, _shards: {total: 22, successful: 22, skipped: 0, failed: 0}]
*       400:
*         description: elasticsearch error
*         content:
*           application/json:
*             schema:
*               $ref: '#/definitions/ChartResponseError'
*/
  static getSbc(req, res, next) {
    async function search() {
      const client = connectToES();
      if (req.body.timerange_lte) {
        timestamp_lte = Math.round(req.body.timerange_lte);
      }

      if (req.body.timerange_gte) {
        timestamp_gte = Math.round(req.body.timerange_gte);
      }

      //check if domain fiter should be use
      const isDomainFilter = await getJWTsipUserFilter(req);
      if (isDomainFilter.domain) {
        domainFilter = isDomainFilter.domain;
      }

      //SBC ACTIVITY TYPES
      const sbcTypes = two_agg_query_limit.getTemplate("attrs.sbc", "terms", "attrs.type", getQueries("*", "*", timestamp_gte, timestamp_lte, "*", "*", domainFilter), supress);

      const response = await client.search({
        index: 'logstash*',
        "ignore_unavailable": true,
        "preference": 1542895076143,
        body: sbcTypes

      });
      client.close();
      return res.json(response);
    }
    return search().catch(e => {
      return next(e);
    });
  }
}

module.exports = monitoringController;
