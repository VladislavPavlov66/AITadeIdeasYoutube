const middy = require('@middy/core');
const httpErrorHandler = require('@middy/http-error-handler');
const httpEventNormalizer = require('@middy/http-event-normalizer');

const createResponse = (statusCode, data) => {
  const responseHeaders = {
    'Content-Type': 'application/json',
    // Required for CORS support to work
    'Access-Control-Allow-Origin': '*',
    // Required for cookies, authorization headers with HTTPS
    'Access-Control-Allow-Credentials': true
  };
  return {
    statusCode: statusCode,
    headers: responseHeaders,
    body: JSON.stringify(
      data,
      null,
      2
    ),
  };
};

const returnErrorObj = (err) => {
  return JSON.stringify(err);
};

const common = (handler) =>
  middy(handler).use([
    httpErrorHandler(),
    httpEventNormalizer(),
  ]);

module.exports = {
  createResponse,
  returnErrorObj,
  common
};