const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api-docs/',
  method: 'GET'
};

const req = http.request(options, res => {
  console.log(`Swagger status: ${res.statusCode}`);
  res.on('data', () => {});
});

req.on('error', error => {
  console.error('Swagger is not available:', error.message);
});

req.end();
