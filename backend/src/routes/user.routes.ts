import { Router } from 'express';
import container from '../core/di/container';
import { UserAuthController } from '../controllers/user/userAuth.controller';
import { TYPES } from '../core/types/types';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { UserProfileController } from '../controllers/user/userProfile.controller';
import multer from 'multer';
import { createWallet, getWallet } from '../controllers/user/wallet.controller';


// Configure Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype) {
      return cb(null, true);
    }
    cb(new Error("File type not supported. Only JPEG and PNG are allowed."));
  },
});

const router = Router();

const userAuthController = container.get<UserAuthController>(TYPES.IUserAuthController);
const userProfileController = container.get<UserProfileController>(TYPES.IUserProfileController);
// const walletController = container.get<WalletController>(TYPES.WalletController)

// Auth
router.post("/register", userAuthController.register.bind(userAuthController))
router.post("/login", userAuthController.login.bind(userAuthController))
router.post("/refresh-token", userAuthController.refreshAccessToken.bind(userAuthController))
router.post("/logout", userAuthController.logout.bind(userAuthController))
router.post("/request-otp", userAuthController.requestOtp.bind(userAuthController))
router.post("/verify-otp", userAuthController.verifyOtp.bind(userAuthController))
router.post("/resend-otp", userAuthController.resendOtp.bind(userAuthController))
router.post("/forgot-password", userAuthController.forgotPassword.bind(userAuthController))
router.post("/verify-forgot-password-otp", userAuthController.verifyForgotPasswordOtp.bind(userAuthController))
router.post("/reset-password", userAuthController.resetPassword.bind(userAuthController))
router.post("/google-login", userAuthController.googleLogin.bind(userAuthController))

router.post("/check-username", userAuthController.checkUsername.bind(userAuthController))
router.get("/generate-username", userAuthController.generateUsername.bind(userAuthController))

// Profile Routes (protected)
router.get('/get-profile', authMiddleware, roleMiddleware(['user']), userProfileController.getProfile.bind(userProfileController));
router.put('/profile', authMiddleware, roleMiddleware(['user']), userProfileController.updateProfile.bind(userProfileController));
router.post('/check-username', authMiddleware, roleMiddleware(['user']), userProfileController.checkUsername.bind(userProfileController));
router.post('/upload-profile-image', authMiddleware, roleMiddleware(['user']), upload.single('profileImage'), userProfileController.uploadProfileImage.bind(userProfileController));


// Wallet

// router.post('/wallets', createWallet);
// router.get('/:address', getWallet);

export default router;
