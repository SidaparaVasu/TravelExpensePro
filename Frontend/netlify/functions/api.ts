import serverless from "serverless-http";

import { createServer } from "../../server";

// Map Netlify function base path so our Express routes like "/api/login" work when deployed
export const handler = serverless(createServer(), {
  basePath: "/.netlify/functions/api",
});
  