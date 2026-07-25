const swaggerJsdoc = require('swagger-jsdoc');
const fs = require('fs');

const options = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'API', version: '1.0.0' }
  },
  apis: ['./src/routes/*.ts']
};

const swaggerSpec = swaggerJsdoc(options);
const paths = swaggerSpec.paths;

let arabicDocs = {};
try {
  arabicDocs = JSON.parse(fs.readFileSync('./arabic_descriptions.json', 'utf-8'));
} catch (e) {
  console.log('No arabic_descriptions.json found, skipping Arabic injections.');
}

let md = `# API Documentation\n\n`;

for (const [route, methods] of Object.entries(paths)) {
  for (const [method, details] of Object.entries(methods)) {
    const title = details.summary || 'API Endpoint';
    md += `## ${title}\n\n`;
    
    md += `- **Endpoint:** \`${method.toUpperCase()} ${route}\`\n`;
    
    let desc = details.description || title;
    
    // Inject Arabic Description if available
    const lookupKey = title.toLowerCase();
    if (arabicDocs[lookupKey]) {
      desc = arabicDocs[lookupKey] + '\n\n**English Details:** ' + desc;
    }
    
    md += `- **Description:** ${desc}\n`;
    
    const requiresAuth = details.security && details.security.length > 0;
    md += `- **Token Required:** ${requiresAuth ? 'Yes (Authorization Bearer Token)' : 'No'}\n`;
    
    md += `- **Headers:**\n`;
    if (requiresAuth) {
      md += `  - \`Authorization: Bearer <token>\`\n`;
    }
    if (details.requestBody) {
      md += `  - \`Content-Type: application/json\`\n`;
    }
    if (!requiresAuth && !details.requestBody) {
      md += `  - None\n`;
    }
    
    if (details.parameters && details.parameters.length > 0) {
      const pathParams = details.parameters.filter(p => p.in === 'path');
      const queryParams = details.parameters.filter(p => p.in === 'query');
      if (pathParams.length > 0) {
        md += `- **Path Parameters:**\n`;
        pathParams.forEach(p => md += `  - \`${p.name}\` (${p.schema?.type || 'string'}): ${p.description || ''}\n`);
      }
      if (queryParams.length > 0) {
        md += `- **Query Parameters:**\n`;
        queryParams.forEach(p => md += `  - \`${p.name}\` (${p.schema?.type || 'string'}): ${p.description || ''}\n`);
      }
    }
    
    if (details.requestBody && details.requestBody.content && details.requestBody.content['application/json']) {
      md += `- **Request Body:**\n`;
      md += '```json\n';
      const schema = details.requestBody.content['application/json'].schema;
      if (schema.properties) {
        const dummy = {};
        for (const [k, v] of Object.entries(schema.properties)) {
          dummy[k] = v.type || 'string';
        }
        md += JSON.stringify(dummy, null, 2) + '\n';
      } else {
        md += `// Check Schema\n`;
      }
      md += '```\n';
    } else {
      md += `- **Request Body:** None\n`;
    }
    
    md += `- **Response:**\n`;
    if (details.responses) {
      for (const [status, resDetails] of Object.entries(details.responses)) {
        md += `  - **${status}**: ${resDetails.description}\n`;
      }
    } else {
      md += `  - None\n`;
    }
    
    md += `\n---\n\n`;
  }
}

fs.writeFileSync('API_DOCUMENTATION.md', md);
console.log('Documentation generated directly to API_DOCUMENTATION.md');
