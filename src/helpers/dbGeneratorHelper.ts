import config from '../config';
import db from './dbHelper';

module.exports = {
  // Generate Tables if they don't exist
  generateDBStructure: async function (logger) {
    await this.generateDelegateTable(logger);
    await this.generateAttemptsTable(logger);
  },
  //Users table
  generateDelegateTable: async function (logger) {
    const query = `CREATE TABLE IF NOT EXISTS delegate (
      delegator varchar(42) NOT NULL,
      delegatee varchar(42) NOT NULL,
      amount_delegated BIGINT NOT NULL,
      txHash varchar(66),
      timestamp timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8;`;
    return new Promise((resolve, reject) => {
      db.query(
        query,
        [],
        function (err, results) {
          console.log(results)
          if (err) {
            logger.info("     ----[🔴] delegate       | Table Errored");
            reject(err);
          }
          else {
            if (results.changedRows == 0) {
              logger.info("     ----[🟢] delegate       | Table Exists");
            }
            else {
              logger.info("     ----[🟠🟢] delegate       | Table Created");
            }
            resolve();
          }
        }
      );
    });
  },

  generateAttemptsTable: async function (logger) {
    const query = `CREATE TABLE IF NOT EXISTS attempts (
      address varchar(42) NOT NULL UNIQUE,
      count INT NOT NULL default 1
    );`;
    
    return new Promise((resolve, reject) => {
      db.query(
        query,
        [],
        function (err, results) {
          console.log(results)
          if (err) {
            logger.info("     ----[🔴] attempts       | Table Errored");
            reject(err);
          }
          else {
            if (results.changedRows == 0) {
              logger.info("     ----[🟢] attempts       | Table Exists");
            }
            else {
              logger.info("     ----[🟠🟢] attempts       | Table Created");
            }
            resolve();
          }
        }
      );
    });
  }
}