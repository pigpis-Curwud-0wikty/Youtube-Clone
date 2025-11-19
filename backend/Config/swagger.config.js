import swaggerUi from 'swagger-ui-express';
import { load } from 'js-yaml';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load YAML file
let swaggerSpec;
try {
  const yamlFile = fs.readFileSync(join(__dirname, '../api-docs.yaml'), 'utf8');
  swaggerSpec = load(yamlFile);
} catch (error) {
  console.error('Error loading Swagger YAML file:', error);
  // Fallback to basic spec if YAML fails to load
  swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'YouTube Clone API',
      version: '1.0.0',
      description: 'API documentation for YouTube Clone application'
    },
    paths: {}
  };
}

export { swaggerSpec, swaggerUi };

