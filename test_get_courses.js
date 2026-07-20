const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/courses?page=1&limit=5&search=React&sort_by=price&sort_order=desc',
  method: 'GET'
};

const req = http.request(options, res => {
  let body = '';
  res.on('data', d => { body += d; });
  res.on('end', () => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`BODY: ${body}`);
  });
});

req.on('error', error => { console.error(error); });
req.end();
