const http = require('http');

function queryAPI(queryString) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/courses?${queryString}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          console.error('Failed to parse body:', body);
          resolve({ status: res.statusCode, data: null });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('--- RUNNING SEARCH, FILTERING, SORTING & PAGINATION TESTS ---');

  // Test 1: Search Test (Expected: should find "React" or "TypeScript")
  console.log('\nTest 1: Search for "React"');
  const res1 = await queryAPI('search=React');
  console.log(`Status: ${res1.status}, Total Found: ${res1.data.metadata.totalCount}`);
  if (res1.data.courses.length > 0) {
    console.log(`Course Title: ${res1.data.courses[0].title}`);
  }

  // Test 2: Price Filter Test (Expected: should find courses in price range 40 to 60)
  console.log('\nTest 2: Price range filter (min_price=40&max_price=60)');
  const res2 = await queryAPI('min_price=40&max_price=60');
  console.log(`Status: ${res2.status}, Count: ${res2.data.metadata.totalCount}`);
  res2.data.courses.forEach(c => console.log(` - ${c.title} (Price: ${c.price})`));

  // Test 3: Sorting Test (Expected: sort by price desc)
  console.log('\nTest 3: Sort by price desc');
  const res3 = await queryAPI('sort_by=price&sort_order=desc');
  console.log(`Status: ${res3.status}`);
  res3.data.courses.forEach(c => console.log(` - ${c.title} (Price: ${c.price})`));

  // Test 4: Pagination Test (Expected: page=1&limit=1)
  console.log('\nTest 4: Pagination (page=1&limit=1)');
  const res4 = await queryAPI('page=1&limit=1');
  console.log(`Status: ${res4.status}, Page: ${res4.data.metadata.currentPage}, Limit: ${res4.data.metadata.limit}, Courses Count: ${res4.data.courses.length}`);

  // Test 5: Invalid query parameters (Expected: 400 Bad Request)
  console.log('\nTest 5: Invalid query parameters (invalid UUID and negative price)');
  const res5 = await queryAPI('category_id=invalid-uuid&min_price=-20');
  console.log(`Status: ${res5.status}`);
  console.log('Errors:', res5.data.errors);
}

runTests().catch(console.error);
