import { Router } from 'express';
import { trackJobView } from '../controllers/views.controller.js';

const viewsRouter = Router();

viewsRouter.post('/:slug/:jobSlug', trackJobView)


export default viewsRouter;