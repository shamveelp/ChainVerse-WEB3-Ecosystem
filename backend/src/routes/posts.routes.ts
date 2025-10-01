import { Router } from 'express';
import container from '../core/di/container';
import { PostController } from '../controllers/posts/Post.controller';
import { TYPES } from '../core/types/types';
import { authMiddleware, roleMiddleware } from '../middlewares/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middlewares/validation.middleware';
import {
    CreatePostDto,
    UpdatePostDto,
    CreateCommentDto,
    UpdateCommentDto,
    GetPostsQueryDto,
    GetCommentsQueryDto,
    LikeActionDto,
    SharePostDto
} from '../dtos/posts/Post.dto';
import multer from 'multer';

// Configure Multer for media uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|mp4|mpeg|mov/;
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype) {
            return cb(null, true);
        }
        cb(new Error("File type not supported. Only images (JPEG, PNG, GIF) and videos (MP4, MPEG, MOV) are allowed."));
    },
});

const router = Router();

const postController = container.get<PostController>(TYPES.IPostController);

// Post CRUD Routes
router.post('/create',
    authMiddleware,
    roleMiddleware(['user']),
    validateBody(CreatePostDto),
    postController.createPost.bind(postController)
);

router.get('/:postId',
    postController.getPostById.bind(postController)
);

router.put('/:postId',
    authMiddleware,
    roleMiddleware(['user']),
    validateBody(UpdatePostDto),
    postController.updatePost.bind(postController)
);

router.delete('/:postId',
    authMiddleware,
    roleMiddleware(['user']),
    postController.deletePost.bind(postController)
);

// Post Query Routes
router.get('/feed/posts',
    authMiddleware,
    roleMiddleware(['user']),
    validateQuery(GetPostsQueryDto),
    postController.getFeedPosts.bind(postController)
);

router.get('/user/:userId/posts',
    validateQuery(GetPostsQueryDto),
    postController.getUserPosts.bind(postController)
);

router.get('/user/:userId/liked',
    validateQuery(GetPostsQueryDto),
    postController.getLikedPosts.bind(postController)
);

router.get('/trending/posts',
    validateQuery(GetPostsQueryDto),
    postController.getTrendingPosts.bind(postController)
);

router.get('/hashtag/:hashtag',
    validateQuery(GetPostsQueryDto),
    postController.getPostsByHashtag.bind(postController)
);

router.get('/search/posts',
    validateQuery(GetPostsQueryDto),
    postController.searchPosts.bind(postController)
);

// Like Routes
router.post('/:postId/like',
    authMiddleware,
    roleMiddleware(['user']),
    postController.togglePostLike.bind(postController)
);

router.get('/:postId/likers',
    validateQuery(GetPostsQueryDto),
    postController.getPostLikers.bind(postController)
);

// Comment Routes
router.post('/comments/create',
    authMiddleware,
    roleMiddleware(['user']),
    validateBody(CreateCommentDto),
    postController.createComment.bind(postController)
);

router.put('/comments/:commentId',
    authMiddleware,
    roleMiddleware(['user']),
    validateBody(UpdateCommentDto),
    postController.updateComment.bind(postController)
);

router.delete('/comments/:commentId',
    authMiddleware,
    roleMiddleware(['user']),
    postController.deleteComment.bind(postController)
);

router.get('/:postId/comments',
    validateQuery(GetCommentsQueryDto),
    postController.getPostComments.bind(postController)
);

router.get('/comments/:commentId/replies',
    validateQuery(GetCommentsQueryDto),
    postController.getCommentReplies.bind(postController)
);

router.post('/comments/:commentId/like',
    authMiddleware,
    roleMiddleware(['user']),
    postController.toggleCommentLike.bind(postController)
);

// Media Upload Routes
router.post('/upload-media',
    authMiddleware,
    roleMiddleware(['user']),
    upload.single('media'),
    postController.uploadPostMedia.bind(postController)
);

// Share Routes
router.post('/share',
    authMiddleware,
    roleMiddleware(['user']),
    validateBody(SharePostDto),
    postController.sharePost.bind(postController)
);

// Analytics Routes
router.get('/stats/analytics',
    authMiddleware,
    roleMiddleware(['user']),
    postController.getPostStats.bind(postController)
);

router.get('/hashtags/popular',
    postController.getPopularHashtags.bind(postController)
);

export default router;