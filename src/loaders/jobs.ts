// Do Scheduling
// https://github.com/node-schedule/node-schedule
// *    *    *    *    *    *
// ┬    ┬    ┬    ┬    ┬    ┬
// │    │    │    │    │    │
// │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
// │    │    │    │    └───── month (1 - 12)
// │    │    │    └────────── day of month (1 - 31)
// │    │    └─────────────── hour (0 - 23)
// │    └──────────────────── minute (0 - 59)
// └───────────────────────── second (0 - 59, OPTIONAL)
// Execute a cron job every 5 Minutes = */5 * * * *
// Starts from seconds = * * * * * *

import config from '../config';
import { Container } from 'typedi';
import schedule from 'node-schedule';
import GaslessDelegationService from '../services/gaslessDelegationService';

export default ({ logger }) => {
    logger.info('-- 🛵 Scheduling automatic deletion of attempts table [Every 24 Hours]');

    schedule.scheduleJob('*/1440 * * * *', async function(){
        const taskName = 'Attempts deletion';
    
        try {
          const gaslessDelegator = Container.get(GaslessDelegationService);
          await gaslessDelegator.deleteAllAttempts();
          logger.info(`🐣 Cron Task Completed -- ${taskName}`);
        }
        catch (err) {
          logger.error(`❌ Cron Task Failed -- ${taskName}`);
          logger.error(`Error Object: %o`, err);
        }
    });

    logger.info('-- 🛵 Scheduling master wallet monitoring [Every 10 minutes]');

    schedule.scheduleJob('*/10 * * * *', async function() {
        const taskName = "Master wallet monitor";

        try {
          const gaslessDelegate = Container.get(GaslessDelegationService);
          const response = await gaslessDelegate.monitorMasterWallet();
          logger.info(`🐣 Cron Task Completed -- ${taskName}`);
        } catch (err) {
          logger.error(`❌ Cron Task Failed -- ${taskName}`);
          logger.error(`Error Object: %o`, err);
        }
    });
};
