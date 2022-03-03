import { Service, Inject, Container } from 'typedi';
import config from '../config';
import { EventDispatcher, EventDispatcherInterface } from '../decorators/eventDispatcher';
import metadata from '../data/rockstarMetadata';
@Service()
export default class MetadataService {
  constructor(
    @Inject('logger') private logger,
    @EventDispatcher() private eventDispatcher: EventDispatcherInterface,
  ) {}

  public async getTokenMetadata(tokenId) {
    const logger = this.logger;
    return await new Promise ((resolve, reject) => {
      if(tokenId>=1 && tokenId<=100){
        const id = parseInt(tokenId).toString()
        const nftInfo = metadata[id]
        resolve(nftInfo)
      }
      else{
        resolve(`Invalid token_id: ${tokenId}. Valid token id range is [1-100]`)
      }
    })
    .catch((err) => {
      logger.error(err);
    });
  }
}
