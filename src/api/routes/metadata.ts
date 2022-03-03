import { Router, Request, Response, NextFunction } from 'express';
import { Container } from 'typedi';
import MetadataService from '../../services/metadataService';
import middlewares from '../middlewares';
import { celebrate, Joi } from 'celebrate';

const route = Router();

export default (app: Router) => {
  app.use('/opensea/rockstars', route);

  route.get(
    '/:op/:token_id',
    async (req, res, next) => {
      await middlewares.onlyAuthorizedSimple( req, res, next, "read" );
    },
    async (req: Request, res: Response, next: NextFunction) => {
      const Logger = Container.get('logger');
      Logger.debug('Calling /metadata/token/:token_id endpoint with body: %o', req.body);
      try {
        const metadata = Container.get(MetadataService);
        const response = await metadata.getTokenMetadata(req.params.token_id);
        return res.status(200).send(response);
      } catch (e) {
        Logger.error('🔥 error: %o', e);
        // return next(e);
      }
    },
  );

};
