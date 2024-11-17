import { type Server } from 'node:http';
import { exit } from 'node:process';
import app from './app.js';
import prisma from './client.js';
import config from './config/config.js';
import logger from './config/logger.js';

let server: Server;
prisma
  .$connect()
  .then(() => {
    logger.info('Connected to SQL Database');
    server = app.listen(config.port, () => {
      logger.info(`Listening to port ${config.port}`);
    });
  })
  .catch((error) => {
    logger.error(error);
  });

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      exit(1);
    });
  } else {
    exit(1);
  }
};

const unexpectedErrorHandler = (error: unknown) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});