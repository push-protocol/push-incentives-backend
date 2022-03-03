import { Router } from 'express';

import metadata from './routes/metadata';
import gaslessDelegation from './routes/gaslessDelegation'
// guaranteed to get dependencies
export default () => {
	const app = Router();

	// -- SERVICES ROUTES

	metadata(app);
	gaslessDelegation(app);

	// Finally return app
	return app;
}
