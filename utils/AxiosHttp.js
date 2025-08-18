const axios = require("axios");
const https = require("https");
const axiosInstance = axios.create({
  headers: { "Content-Type": "application/json" },
  httpsAgent: new https.Agent({ rejectUnauthorized: false, keepAlive: true }),
});

module.exports=axiosInstance

