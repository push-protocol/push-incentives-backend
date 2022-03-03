import dotenv from 'dotenv';

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const envFound = dotenv.config();
if (envFound.error) {
  // This error should crash whole process

  throw new Error("⚠️  Couldn't find .env file  ⚠️");
}

export default {
  /**
   * Your favorite port
   */
  environment: process.env.NODE_ENV,

  /**
   * Your favorite port
   */
  port: parseInt((process.env.PORT || '3000'), 10),

  /**
   * Your favorite port
   */
  runningOnMachine: process.env.RUNNING_ON_MACHINE,

  /**
   * Used by winston logger
   */
  logs: {
    level: process.env.LOG_LEVEL || 'silly',
  },

  /**
   * Trusted URLs, used as middleware for some and for future
   */
  trusterURLs: JSON.parse(process.env.TRUSTED_URLS),
  //Wallet related
  walletPrivateKey : process.env.WALLET_PRIVATE_KEY,
  walletAddress : process.env.WALLET_ADDRESS,
  WALLET_THRESHOLD : process.env.ETH_THRESHOLD,
  PUSH_THRESHOLD: process.env.PUSH_THRESHOLD,
  /**
   * The database config
   */
  dbhost: process.env.DB_HOST,
  dbname: process.env.DB_NAME,
  dbuser: process.env.DB_USER,
  dbpass: process.env.DB_PASS,

  /**
   * File system config
   */
  fsServerURL: process.env.NODE_ENV == 'development' ? process.env.FS_SERVER_DEV : process.env.FS_SERVER_PROD,
  staticServePath: process.env.SERVE_STATIC_FILES,
  staticCachePath: __dirname + '/../../' + process.env.SERVE_STATIC_FILES + '/' + process.env.SERVE_CACHE_FILES + '/',
  staticAppPath: __dirname + '/../../',

  /**
   * Server related config
   */
  maxDefaultAttempts: process.env.DEFAULT_MAX_ATTEMPTS,

  /**
   * Web3 Related
   */
   etherscanAPI: process.env.ETHERSCAN_API,

   infuraAPI: {
     projectID: process.env.INFURA_PROJECT_ID,
     projectSecret: process.env.INFURA_PROJECT_SECRET,
   },

   alchemyAPI: process.env.ALCHEMY_API,

   web3MainnetProvider: process.env.MAINNET_WEB3_PROVIDER,
   web3MainnetNetwork: process.env.MAINNET_WEB3_NETWORK,
   web3MainnetSocket: process.env.MAINNET_WEB3_SOCKET,

   web3RopstenProvider: process.env.ROPSTEN_WEB3_PROVIDER,
   web3RopstenNetwork: process.env.ROPSTEN_WEB3_NETWORK,
   web3RopstenSocket: process.env.ROPSTEN_WEB3_SOCKET,

  /**
   * EPNS Related
   */
  deployedContract: process.env.EPNS_DEPLOYED_CONTRACT,
  deployedContractABI: require('./EPNS.json'),

  /**
   * IPFS related
   */
  ipfsMaxAttempts: process.env.IPFS_MAX_ATTEMPTS,
  ipfsGateway: process.env.IPFS_GATEWAY,

 /**
  * Messaging related
  */
  messagingMaxAttempts: process.env.MESSAGING_MAX_ATTEMPTS,
  messagingChunkMaxSize: process.env.MESSAGING_CHUNK_MAX_SIZE,

  /**
  * Deadlocks
  */
  LOCK_MESSAGING_LOOPIDS: {},

  /**
   * Firebase related
   */
  fcmDatabaseURL: process.env.FIREBASE_DATABASE_URL,

  /**
   * API configs
   */
  api: {
    prefix: '/apis',
  },

  chainId: process.env.CHAIN_ID,
  tokenContractName: process.env.EPNS_DEPLOYED_CONTRACT_NAME
};
