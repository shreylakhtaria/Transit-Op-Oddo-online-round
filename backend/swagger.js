import swaggerAutogen from 'swagger-autogen';

const doc = {
  info: {
    title: 'TransitOps API',
    description: 'Smart Transport Operations Platform API'
  },
  host: 'localhost:8000',
  basePath: '/api',
  schemes: ['http']
};

const outputFile = './swagger.json';
const routes = ['./src/index.js'];

swaggerAutogen()(outputFile, routes, doc).then(() => {
    console.log("Swagger JSON generated successfully");
});
