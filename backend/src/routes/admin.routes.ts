import { Router } from 'express';
import container from '../core/di/container';
import {TYPES} from '../core/types/types';
import { AdminAuthController } from '../controllers/admin/AdminAuth.controller';
const router = Router();

const adminAuthController = container.get<AdminAuthController>(TYPES.IAdminAuthController);

//Auth
router.post("/login", adminAuthController.login.bind(adminAuthController))
router.post("/logout", adminAuthController.logout.bind(adminAuthController))


router.get("/users", adminAuthController.getAllUsers.bind(adminAuthController))
router.get("/users/:id", adminAuthController.getUserById.bind(adminAuthController))
router.patch("/users/:id", adminAuthController.updateUserStatus.bind(adminAuthController))






export default router;
