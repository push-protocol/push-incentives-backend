import dbGenerator from '../helpers/dbGeneratorHelper';

export default async ({ logger }) => {
    logger.info("   -- ✌️   Running DB Checks");
    await dbGenerator.generateDBStructure(logger);
    logger.info("      ✔️   DB Checks completed!");
}