import expressLoader from './express';
import dependencyInjectorLoader from './dependencyInjector';

import logger from './logger';
import initializer from './initializer';
import jobsLoader from './jobs';

export default async ({ expressApp }) => {
  logger.info('✔️   Loaders connected!');

  // It returns the agenda instance because it's needed in the subsequent loaders
  await dependencyInjectorLoader({});
  logger.info('✔️   Dependency Injector loaded!');

  logger.info('✌️   Running Initilizer');
  await initializer({ logger });
  logger.info('✔️   Initilizer completed!');
  
  logger.info('✌️   Loading jobs');
  await jobsLoader({ logger });
  logger.info('✔️   Jobs loaded!');

  await expressLoader({ app: expressApp });
  logger.info('✔️   Express loaded!');
};
