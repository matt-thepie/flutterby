import { buildApp } from './app';

const port = Number(process.env.PORT ?? 3001);
const app = buildApp();

app
  .listen({ port, host: '0.0.0.0' })
  .then((address) => app.log.info(`Flutterby API listening on ${address}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
