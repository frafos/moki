// elastic.js hold the ES implem

const elasticsearch = require('elasticsearch');
const { es } = require('./config').cfg;

module.exports = {
  connectToES: () => {
    let client = {};

    try {
      client = new elasticsearch.Client({ host: es, requestTimeout: 60000 });
    } catch (error) {
      console.error('es client error: ', error.msg);
      error.status = 400;
      throw error;
    }
    return client;
  }
};
