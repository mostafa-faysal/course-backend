const http = require('http');

const data = JSON.stringify({
  title: 'Mastering React 18',
  description: 'Learn everything about React 18, hooks, context API, and advanced patterns.',
  instructor_id: '123e4567-e89b-12d3-a456-426614174000',
  category_id: '581c867a-7286-41dc-ac45-df9dcc42158c',
  price: 49.99
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/courses',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
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
req.write(data);
req.end();
