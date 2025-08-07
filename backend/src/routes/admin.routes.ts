import { Router } from 'express';
import container from '../core/di/container';
import {TYPES} from '../core/types/types';
import { AdminAuthController } from '../controllers/admin/AdminAuth.controller';
const router = Router();

const adminAuthController = container.get<AdminAuthController>(TYPES.IAdminAuthController);

//Auth
router.post("/login", adminAuthController.login.bind(adminAuthController))
router.post("/logout", adminAuthController.logout.bind(adminAuthController))

// User management
router.get("/users", adminAuthController.getAllUsers.bind(adminAuthController))
router.get("/users/:id", adminAuthController.getUserById.bind(adminAuthController))
router.patch("/users/:id", adminAuthController.updateUserStatus.bind(adminAuthController))

// Community admin management
router.get("/community-requests",  adminAuthController.getAllCommunityRequests.bind(adminAuthController))
router.patch("/community-requests/:id/approve",  adminAuthController.approveCommunityRequest.bind(adminAuthController))
router.patch("/community-requests/:id/reject",  adminAuthController.rejectCommunityRequest.bind(adminAuthController))




export default router;
