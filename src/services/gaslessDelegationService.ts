import { Service, Inject, Container } from 'typedi';
import config from '../config';
import { EventDispatcher, EventDispatcherInterface } from '../decorators/eventDispatcher';
import { ethers, logger, Wallet } from "ethers";
import config from "../config/index";
import epnsAPIHelper from "../helpers/epnsAPIHelper";
import AuthService from "./emailService";
import { result } from 'lodash';
import { type } from 'os';
import { Logger } from 'ethers/lib/utils';

const db = require('../helpers/dbHelper');
var utils = require('../helpers/utilsHelper');

const apiKeys = {
    etherscanAPI: config.etherscanAPI,
    infuraAPI: config.infuraAPI,
    alchemyAPI: config.alchemyAPI
}

// domain and types needed for signature verification
const domain = {
    name: config.tokenContractName,
    chainId: config.chainId,
    verifyingContract: config.deployedContract
}

const types = {
    Delegation: [
      { name: "delegatee", type: "address" },
      { name: "nonce", type: "uint256" },
      { name: "expiry", type: "uint256" },
    ]
}

@Service()
export default class GaslessDelegationService {
    contractAddress = config.deployedContract
    contractABI = config.deployedContractABI
    network = config.web3MainnetNetwork
    contractInstance = null

    constructor(
        @Inject('logger') private logger,
        @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
    ) {
        this.contractInstance = epnsAPIHelper.getInteractableContracts(this.network, apiKeys, config.walletPrivateKey, this.contractAddress, this.contractABI);
    }

    private async checkEthBalance(walletAddress) {

        const rawBalance = await this.contractInstance.provider.getBalance(config.walletAddress);
        const balance = ethers.utils.formatEther(rawBalance);
        console.log(balance);
        return balance;

    }

    private async checkPushBalance(walletAddress) {

        const rawPushBalance = await this.contractInstance.contract.balanceOf(walletAddress);
        const pushBalance = ethers.utils.formatEther(rawPushBalance);
        return pushBalance;

    }

    private async checkEip712Signature(delegator, delegatee, nonce, expiry, signature) {

        const value = {
            'delegatee': delegatee,
            'nonce': nonce,
            'expiry': expiry
        }
        try {

            const recoveredAddress = ethers.utils.verifyTypedData(domain, types, value, signature);
            if (recoveredAddress != delegator) {
                console.log("Invalid signature");
            }
            return (recoveredAddress == delegator);

        } catch(err) {
            console.log("Erroneous signature:", err);
            return false;
        }
    }

    private async checkNonce(walletAddress, nonce) {
        try {
            const validNonce = ethers.BigNumber.from(await this.contractInstance.contract.nonces(walletAddress)).toString();
            if (validNonce != nonce) {
                console.log("Invalid nonce");
            }
            return (validNonce == nonce);
        } catch(err) {
            console.log("Error in checkNonce: ", err);
            return false;
        }
    }

    private async checkExpiry(expiry) {
        const now = new Date();
        const secondsSinceEpoch = Math.round(now.getTime() / 1000).toString();

       if (BigInt(expiry) < BigInt(secondsSinceEpoch)) {
           console.log("Invalid expiry");
       }
        
        return (BigInt(expiry) >= BigInt(secondsSinceEpoch));
    }

    public async getUserDetail(userWalletAddress) {
        console.debug('Trying to get user info: ' + userWalletAddress);
        const query = 'SELECT * FROM delegate WHERE delegator=? ORDER BY TIMESTAMP DESC LIMIT 1';

        return await new Promise((resolve, reject) => {
            db.query(query, [userWalletAddress], function (err, results) {
                if (err) {
                    console.error(err);
                    return reject(err);
                } else {
                    if (results.length > 0) {
                        console.info('✅ Completed getUserDetail()');
                        console.log('pulled', results);
                        resolve({ days: utils.getNumberOfDays(results[0].timestamp, Date.now()), user: results[0] });
                    } else {
                        console.info('🧽 Completed getUserDetail() with no result');
                        resolve([]);
                    }
                }
            });
        }).catch((err) => {
            logger.error(err);
            reject(err);
        });
    }
    
    // returns true if attempts < 3 and then increments attempts count
    private async bumpAttempts(delegator) {
        console.debug('Bumping attempts for: ' + delegator);

        const countQuery = `SELECT count from attempts where address = ?`;
        const incrementQuery = `UPDATE attempts set count = ? where address = ?`;
        const insertQuery = `INSERT into attempts (address) values (?)`;

        // if count == null -> no entry in attempts table -> insert -> return true on successful insertion
        // if count is some number -> increment count -> return true if count is less than 3

        return await new Promise((resolve, reject) => {
            
            db.query(countQuery, [delegator], function (err, results) {
                let count = 0;

                if (err) {
                    console.error(err);
                    return reject(err);
                } else if (results.length > 0) {
                    count = results[0].count;
                } else {
                    count = null;
                }

                if (count === null) {
                    db.query(insertQuery, [delegator], function (err, results) {
                        if (err) {
                            console.error(err);
                            return reject(err);
                        } else {
                            resolve(true);
                        }
                    });
                } else { // increasing the count
                    db.query(incrementQuery, [count + 1, delegator], function (err, results) {
                        if (err) {
                            console.error(err);
                            return reject(err);
                        }
                        if (count < 3) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                    });
                }
            })

        }).catch((err) => {
            logger.error(err);
            reject(err);
        });
    }

    public async insertUserDetail(delegator, delegatee, amount, txHash) {
        console.debug('Trying to insert user info: ', delegator, delegatee, amount, txHash);
        const insertQuery = 'INSERT INTO delegate (delegator, delegatee, amount_delegated, txHash) VALUES (?, ?, ?, ?)';
        return await new Promise((resolve, reject) => {
            db.query(insertQuery, [delegator, delegatee, amount, txHash], function (err, results) {
                if (err) {
                    console.error(err);
                    return reject(err);
                } else {
                    console.log("Sucessfully inserted user details %o", results);
                    resolve(results);
                }
            });
        }).catch((err) => {
            logger.error(err);
            reject(err);
        });
    }

    public async delegate(delegator, signature, delegatee: string, nonce, expiry) {

        const self = this

        return new Promise(async (resolve, reject) => {
            try {
                this.logger.info("Calling the delegate function with signature: %s, delegatee address: %s, nonce: %s, expiry: %s", signature, delegatee, nonce, expiry)

                // get eth balance of master wallet
                const balance = await this.checkEthBalance(config.walletAddress);
                console.log("Master wallet balance: %s", balance);
                
                // get push balance of the delegator
                const pushBalance = await this.checkPushBalance(delegator);
                console.log("Push Balance of delegator: %s", pushBalance);
                
                // Following checks to prevent spam / faulty api calls

                // 1. master wallet has enough ethers
                // 2. delegator has enough push balance
                // 3. the delegator has not delegated for more than 7 days or is a new user
                // 4. check nonce, expiry and signature using contract calls and eip712 code
                // 5. Check no. of attempts < 3 in last 24hr

		        if (Number(balance.toString()) < Number(config.WALLET_THRESHOLD)) {
                    self.logger.info("Master Wallet Balance below threshold limit");
                    // TODO: Call email function
                    return reject("Unable to complete transaction, Internal server error");
                }

		        if (Number(pushBalance.toString()) < Number(config.PUSH_THRESHOLD)) {
                    self.logger.error("User PUSH balance too low for gasless");
                    return reject("Insufficient PUSH Balance for gasless delegation");
                }

                // get user details
                const user = await this.getUserDetail(delegator);

		        if (user.length == 0) {
                    self.logger.info("Fresh user detected");
                } else if (user.days <= 6) { // Set to <= 6 in prod
                    self.logger.info("Early redelegation prevented");
                    return reject("Already delegated in the last 7 days, try again later");
                } else {
                    self.logger.info("User's last delegation: %o days ago", user.days);
                }

                if ( !(await self.checkNonce(delegator, nonce)) ) {
                    self.logger.error("Invalid nonce detected");
                    return reject("Invalid nonce value");
                }

                if ( !(await self.checkExpiry(expiry)) ) {
                    self.logger.error("Invalid expiry detected");
                    return reject("Invalid expiry value");
                }

                if ( !(await self.checkEip712Signature(delegator, delegatee, nonce, expiry, signature)) ) {
                    self.logger.error("Invalid signature detected");
                    return reject("Invalid signature");
                }

                // Notice that we check bumpAttempts only at the very end
                // We don't want to bump attempts for requests that might have wrong input but were otherwise harmless
                // bumpAttempts is to prevent people from sending too many requests in a short period and draining master wallet of gas fees
                // How is it possible: Sending 100 requests with the same valid nonce, signature and expiry in less than a second
                // Only one request will result in success and
                // others may cause a reverted tx, which may still cost us gas
                if ( !(await self.bumpAttempts(delegator)) ) {
                    self.logger.error("User attempting to send too many requests");
                    return reject("Too many requests");
                }

                const sig = ethers.utils.splitSignature(signature);
                self.logger.debug("The signature split into r: %s s:%s and v: %s", sig.r, sig.s, sig.v);

                const trxObj = this.contractInstance.signingContract.delegateBySig(delegatee, nonce, expiry, sig.v, sig.r, sig.s)

                if (delegatee && nonce && expiry && sig && sig.v && sig.r && sig.s) {
                    trxObj
                        .then(async function (tx: any) {
                            console.info('Transaction sent: %o', tx);

                            // wait for 5 block confirmations
                            await tx.wait(5);

                            // insert the user details to the table
                            await self.insertUserDetail(delegator, delegatee, pushBalance, tx.hash);

                            console.info('Transaction mined: %o', tx.hash);
                            return resolve(tx);
                        })
                        .catch((err: Error) => {

                            console.error('Unable to complete transaction, error: %o', err);
                            return reject(`Unable to complete transaction, Internal server error`);

                        });
                } else {
                    return reject("Incorrect info");
                }

            } catch (error) {
                self.logger.error("error caught: ", error);
                return reject(`Unable to complete transaction, Internal server error`);
            }
        })
    }

    public async monitorMasterWallet() {
        return new Promise(async (resolve, reject) => {
            try {
                console.log("Looking for wallet status");
                const balance = await this.checkEthBalance(config.walletAddress)
                console.log(`Balance of the wallet is ${balance.toString()}: threshold is ${config.WALLET_THRESHOLD}`);
                if (Number(balance.toString()) < Number(config.WALLET_THRESHOLD)) {
                    console.log("Below Threshold!!");
                    const email = Container.get(AuthService);
                    console.log("Balance low in the Gassless Wallet");
                    const result = email.sendMailSES("support@epns.io", "Wallet Monitoring Bot", "Wallet Expiry", "Low Wallet Balance", `Main ETH Wallet: ${config.walletAddress} balance is below threshold at ${balance}`);
                    resolve(result);
                }

            } catch (error) {
                console.error("Something went wrong!");
                console.error(error);
                return reject(error);
            }
        })
    }

    public async deleteAllAttempts() {
        const query = 'DELETE FROM attempts';
        return await new Promise((resolve, reject) => {
            db.query(query, [], function (err, results) {
                if (err) {
                    console.error(err);
                    return reject(err);
                } else {
                    console.log("Sucessfully emptied attempts table: ", results);
                    resolve(results);
                }
            });
        }).catch((err) => {
            logger.error(err);
            return reject(err);
        });
    }
}
