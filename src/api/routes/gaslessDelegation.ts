import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import GaslessDelegationService from '../../services/gaslessDelegationService';
import middlewares from '../middlewares';
import { celebrate, Joi } from 'celebrate';

const route = Router();

export default (app: Router) => {
  app.use('/gov', route);

  
  // returns the previous gasless delegation of the user (if any) which was made using this backend
  route.post(
    '/prev_delegation',
    celebrate({
      body: Joi.object({
        walletAddress: Joi.string().required()
      }),
    }),
    middlewares.onlyTrustedSource,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger = Container.get('logger');
      Logger.debug('Calling /gov/prev_delegation endpoint with body: %o', req.body);
      try {
        const gaslessDelegate = Container.get(GaslessDelegationService);
        const response = await gaslessDelegate.getUserDetail(req.body.walletAddress);
        return res.status(200).send(response);
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return res.status(500).send({ success: false, message: "Something went wrong" });
        // return next(e);
      }
    },
  );
  
  route.post(
    '/gasless_delegate',
    celebrate({
      body: Joi.object({
        delegator: Joi.string().required(),
        signature: Joi.string().required(),
        delegatee: Joi.string().required(),
        nonce: Joi.string().required(),
        expiry: Joi.string().required(),
      }),
    }),
    middlewares.onlyTrustedSource,
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger = Container.get('logger');
      Logger.debug('Calling /gov/gasless_delegation endpoint with body: %o', req.body);
      try {
        const gaslessDelegate = Container.get(GaslessDelegationService);
        const response = await gaslessDelegate.delegate(req.body.delegator, req.body.signature, req.body.delegatee, req.body.nonce, req.body.expiry);
        return res.status(200).send(response);
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return res.status(500).send({ success: false, message: e });
      }
    },
  );
  
  route.post(
    '/check_balance',
    // async (req, res, next) => {
    // //   await middlewares.onlyAuthorizedSimple( req, res, next, "read" );
    // },
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger = Container.get('logger');
      Logger.debug('Calling /gov/check_balance endpoint ');
      try {
        const gaslessDelegate = Container.get(GaslessDelegationService);
        const response = await gaslessDelegate.monitorMasterWallet();
        return res.status(200).send(response);
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        return res.status(500).send(e);
      }
    },
  );

};
