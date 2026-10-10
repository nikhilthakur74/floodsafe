import serverlessExpress from '@codegenie/serverless-express';
import app from './src/app.js';

/**
 * AWS Lambda handler entrypoint matching 'index.handler'
 */
export const handler = serverlessExpress({ app });
