const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const { auth } = require("../src/middleware/auth");

const { formatDistanceToNow } = require("date-fns");
const { enUS } = require("date-fns/locale");

// POST /content/posts/:id/comment
router.post("/posts/:id/comment", auth, async (req, res) => {
  const { text } = req.body;
  const postId = parseInt(req.params.id);
  const { user } = res.locals.user;
  const userId = user.id;

  if (!text?.trim()) {
    return res.status(400).json({ error: "Comment text is required" });
  }

  const newComment = await prisma.comment.create({
    data: {
      comment: text.trim(),
      user_id: userId,
      content_id: postId,
    },
    include: {
      author: { select: { user_name: true } },
    },
  });

  console.log(newComment);

  // Format for frontend
  const formatted = {
    id: newComment.id,
    user: newComment.author.name,
    text: newComment.comment,
    timestamp: formatDistanceToNow(new Date(newComment.createdAt), {
      addSuffix: true,
      locale: enUS,
    }),
  };

  res.status(201).json(formatted);
});

module.exports = { commentRouter: router };
