const Controller = require('./controller');
const agg_query = require('../../js/template_queries/agg_query');
const agg_cardinality = require('../../js/template_queries/agg_cardinality');
const agg_filter = require('../../js/template_queries/agg_filter');
const two_agg_query = require('../../js/template_queries/two_agg_query');
const distinct_query_string = require('../../js/template_queries/distinct_query_string');

class MicronalysisController extends Controller {

  /**
   * @swagger
   * /api/micronalysis/charts:
   *   post:
   *     description: Get Micronalysis charts
   *     tags: [Micronalysis]
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: pretty
   *         description: Return a pretty json
   *         in: query
   *         required: false
   *         type: bool
   *       - name: form
   *         description: Micronalysis chart form
   *         in: body
   *         required: true
   *         type: object
   *         schema:
   *           $ref: '#/definitions/ChartForm'
   *     responses:
   *       200:
   *         description: return chart data
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/ChartResponse'
   *       400:
   *         description: elasticsearch error
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/definitions/ChartResponseError'
   */

  static getCharts(req, res, next) {
    super.request(req, res, next, [
      //0 TYPES
      { index: "logstash*", template: agg_filter, params: ['attrs.type', 128], filter: "*" },
      //1 FROM UA
      { index: "logstash*", template: agg_filter, params: ["attrs.from-ua", 128], filter: "*" },
      //2 SIP METHOD
      { index: "logstash*", template: agg_filter, params: ["attrs.method", 128], filter: "*" },
      //3 SIP CODE
      { index: "logstash*", template: agg_filter, params: ["attrs.sip-code", 128], filter: "*" },
      //4 TOP SUBNETS
      { index: "logstash*", template: agg_filter, params: ["attrs.sourceSubnets", 128], filter: "*" },
      //5 r-URI PREFIX STRIPPED
      { index: "logstash*", template: agg_filter, params: ["attrs.r-uri-shorted", 128], filter: "*" },
      //6 SOURCE IP ADDRESS
      { index: "logstash*", template: agg_filter, params: ["attrs.source", 128], filter: "*" },
      //7 TOP 10 FROM
      { index: "logstash*", template: agg_filter, params: ["attrs.from.keyword", 128], filter: "*" },
      //8 CALLER DOMAIN
      { index: "logstash*", template: agg_filter, params: ["attrs.from-domain", 128], filter: "*" },
      //9 TOP 10 TO
      { index: "logstash*", template: agg_filter, params: ["attrs.to.keyword", 128], filter: "*" },
      //10 DOMAIN STATS
      { index: "logstash*", template: agg_cardinality, params: ["attrs.from-domain", "attrs.from.keyword", 128], filter: "*" },
      //11 TOP CALL ATTEMPTS
      { index: "logstash*", template: agg_filter, params: ['attrs.from.keyword', 128], filter: "attrs.type:call-attempt" },
      //12 TOP CALL ENDS
      { index: "logstash*", template: agg_filter, params: ['attrs.from.keyword', 128], filter: "attrs.type:call-end" },
      //13 DESTINATION BY R-URI
      { index: "logstash*", template: agg_filter, params: ['attrs.r-uri.keyword', 128], filter: "attrs.type:call-end OR attrs.type:call-attempt" },
      //14 DURATION SUM
      { index: "logstash*", template: two_agg_query, params: ["attrs.from.keyword", "sum", "attrs.duration", 128], filter: "attrs.type:call-end" },
      //15 MAX SUM
      { index: "logstash*", template: two_agg_query, params: ["attrs.from.keyword", "max", "attrs.duration", 128], filter: "attrs.type:call-end" },
      //16 TOP DURATION <5
      { index: "logstash*", template: agg_filter, params: ["attrs.from.keyword", 128], filter: "attrs.duration: [0 TO 5]" },
      //17 TOP SBCs LIST
      { index: "logstash*", template: agg_filter, params: ["attrs.sbc", 128], filter: "attrs.type:call-end" },
      //18 SRC CA
      { index: "logstash*", template: agg_filter, params: ["attrs.src_ca_id", 128], filter: "*" },
      //19 DST CA
      { index: "logstash*", template: agg_filter, params: ["attrs.dst_ca_id", 128], filter: "*" },
      //20 ORIGINATOR
      { index: "logstash*", template: agg_filter, params: ["attrs.originator", 128], filter: "*" },
      //21 DISTINCT IP
      { index: "logstash*", template: distinct_query_string, params: ["attrs.source"], filter: "*" },
      //22 TOP NODEs LIST
      { index: "logstash*", template: agg_filter, params: ["agent.hostname", 128], filter: "*" },
      //23 SIP VERSION
      { index: "logstash*", template: agg_filter, params: ["agent.version", 128], filter: "*" },
      //24 DISTINCT URI
      { index: "logstash*", template: distinct_query_string, params: ["attrs.from.keyword"], filter: "*" },
      //25 CALLING COUNTRIES
      { index: "logstash*", template: agg_filter, params: ["geoip.country_code2", 128], filter: "*" },
      //26 TOP SERVER IP
      { index: "logstash*", template: agg_filter, params: ["server.ip", 128], filter: "*" },
      //27 DURATION GROUP
      { index: "logstash*", template: agg_filter, params: ["attrs.durationGroup", 128], filter: "*" },
      //28 EVENTS BY signature
      { index: "logstash*", template: agg_filter, params: ['sip.request.sig', 128], filter: "*" },
      //29 AGENT TYPE
      { index: "logstash*", template: agg_filter, params: ["agent.type", 128], filter: "*" },
    ], "microanalysis");
  }

}

module.exports = MicronalysisController;
