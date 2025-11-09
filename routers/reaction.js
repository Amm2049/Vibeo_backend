const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const { auth } = require("../src/middleware/auth");

router.post("/toggle", auth, async (req, res) => {
  const { user } = res.locals.user;
  const userId = user.id;
  const { content_id } = req.body;

  const existing = await prisma.react.findUnique({
    where: {
      user_id_content_id: {
        user_id: Number(userId),
        content_id: Number(content_id),
      },
    },
  });

  if (existing) {
    return res.status(409).json({ error: "Already liked" });
  }

  await prisma.react.create({
    data: {
      user_id: Number(userId),
      content_id: Number(content_id),
    },
  });

  res.status(201).json({ success: true });
});

router.delete("/toggle", auth, async (req, res) => {
  const { user } = res.locals.user;
  const userId = user.id;
  const { content_id } = req.body;

  const existing = await prisma.react.findUnique({
    where: {
      user_id_content_id: {
        user_id: Number(userId),
        content_id: Number(content_id),
      },
    },
  });

  if (!existing) {
    return res.status(404).json({ error: "Reaction not found" });
  }

  await prisma.react.delete({
    where: {
      user_id_content_id: {
        user_id: Number(userId),
        content_id: Number(content_id),
      },
    },
  });

  res.json({ success: true });
});

module.exports = { reactionRouter: router };
