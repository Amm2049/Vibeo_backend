const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const { auth } = require("../src/middleware/auth");
const { formatDistanceToNow } = require("date-fns");
const { enUS } = require("date-fns/locale");
const multer = require("multer");
const cloudinary = require("../src/utils/cloudinary");
const upload = multer({ storage: multer.memoryStorage() });

router.post("/posts/create", auth, upload.single("cover"), async (req, res) => {
  const { user } = res.locals.user;
  const userId = user.id;

  const { caption } = req.body;
  let photo_url = null;

  if (req.file) {
    // Convert buffer to base64
    const base64Image = req.file.buffer.toString("base64");
    const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: "vibeo/covers",
    });
    photo_url = result.secure_url; // ✅ Now this exists
  }

  const newPost = await prisma.content.create({
    data: {
      type: "photo",
      photo_url: photo_url,
      caption: caption,
      user_id: Number(userId),
    },
  });

  res.json(newPost);
});

// router.get("/posts", auth, async (req, res) => {
//   const { user } = res.locals.user;
//   const currentUserId = user.id;

//   // Get IDs of users I follow
//   const following = await prisma.follow.findMany({
//     where: { follower_id: currentUserId },
//     select: { followee_id: true },
//   });

//   const followingIds = following.map((f) => f.followee_id);
//   // Include myself
//   const visibleUserIds = [...followingIds, currentUserId];

//   const posts = await prisma.content.findMany({
//     where: {
//       user_id: { in: visibleUserIds },
//     },
//     include: {
//       author: {
//         select: {
//           id: true,
//           name: true,
//           user_name: true,
//           profile_url: true,
//         },
//       },
//       comments: true,
//       reactions: true,
//     },
//     orderBy: { createdAt: "desc" },
//     take: 20,
//   });

//   // Transform to frontend format
//   const formattedPosts = posts.map((post) => ({
//     id: post.id,
//     user: {
//       name: post.author.name,
//       avatar: post.author.profile_url,
//     },
//     image: post.type === "photo" ? post.photo_url : null,
//     video: post.type === "video" ? post.video_url : null,
//     caption: post.caption || "",
//     likes: post.reactions.length,
//     likesInfo: post.reactions,
//     comments: post.comments.length,
//     timestamp: post.createdAt, // or format with dayjs/moment later
//   }));

//   res.json(formattedPosts);
// });

router.get("/posts", auth, async (req, res) => {
  const { user } = res.locals.user;
  const currentUserId = user.id;

  // Parse pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 50) {
    return res.status(400).json({
      error:
        "Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 50",
    });
  }

  try {
    // Get IDs of users I follow
    const following = await prisma.follow.findMany({
      where: { follower_id: currentUserId },
      select: { followee_id: true },
    });

    const followingIds = following.map((f) => f.followee_id);
    // Include myself
    const visibleUserIds = [...followingIds, currentUserId];

    const posts = await prisma.content.findMany({
      where: {
        user_id: { in: visibleUserIds },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            user_name: true,
            profile_url: true,
          },
        },
        comments: true,
        reactions: true,
      },
      orderBy: { createdAt: "desc" },
      skip: skip,
      take: limit,
    });

    // Transform to frontend format
    const formattedPosts = posts.map((post) => ({
      id: post.id,
      user: {
        name: post.author.name,
        avatar: post.author.profile_url,
      },
      image: post.type === "photo" ? post.photo_url : null,
      video: post.type === "video" ? post.video_url : null,
      caption: post.caption || "",
      likes: post.reactions.length,
      likesInfo: post.reactions,
      comments: post.comments.length,
      timestamp: post.createdAt,
    }));

    res.json(formattedPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

router.get("/posts/:id", auth, async (req, res) => {
  try {
    const postId = parseInt(req.params.id);
    const post = await prisma.content.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            user_name: true,
            profile_url: true,
          },
        },
        comments: {
          include: {
            author: {
              select: { user_name: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        reactions: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Format for frontend
    const formattedPost = {
      id: post.id.toString(),
      user: {
        name: post.author.name,
        username: post.author.user_name,
        avatar: post.author.profile_url,
      },
      image: post.type === "photo" ? post.photo_url?.trim() : null,
      video: post.type === "video" ? post.video_url?.trim() : null,
      caption: post.caption || "",
      likes: post.reactions.length,
      timestamp: formatDistanceToNow(new Date(post.createdAt), {
        addSuffix: true,
        locale: enUS,
      }),
      comments: post.comments.map((comment) => ({
        id: comment.id,
        user: comment.author.name,
        text: comment.comment,
        timestamp: formatDistanceToNow(new Date(comment.createdAt), {
          addSuffix: true,
          locale: enUS,
        }),
      })),
    };

    res.json(formattedPost);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load post" });
  }
});

module.exports = { contentRouter: router };
