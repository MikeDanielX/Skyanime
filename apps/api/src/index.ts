import { buildServer } from "./core/server.js";
import { env } from "./core/env.js";

const app = await buildServer();

try {
  await app.listen({ port: env.API_PORT, host: "0.0.0.0" });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
