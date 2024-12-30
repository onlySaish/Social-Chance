import Router from 'express'
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
    getChannelStats,
    getChannelVideos
} from '../controllers/dashboard.controller.js';

const router = Router();

router.use(verifyJWT);
router.route("/getChannelVideos").get(getChannelVideos);
router.route("/getChannelStats").get(getChannelStats);

export default router;