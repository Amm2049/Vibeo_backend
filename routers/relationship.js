// ...existing code...
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const { auth } = require("../src/middleware/auth");

// get followers of :id
router.get("/followers", auth, async (req, res) => {
  const { user } = res.locals.user;
  const userId = user.id;

  // People who follow me (I am followee)
  const followers = await prisma.follow.findMany({
    where: { followee_id: userId },
    select: {
      follower: {
        select: {
          id: true,
          user_name: true,
          name: true,
          profile_url: true,
          // any other fields you need
        },
      },
    },
  });

  // Extract just the user objects
  const followersList = followers.map((f) => f.follower);

  // 2. Get ALL user IDs that I follow (followee_ids)
  const followingRecords = await prisma.follow.findMany({
    where: { follower_id: userId },
    select: { followee_id: true },
  });

  // Convert to Set for fast lookup
  const followingIds = new Set(followingRecords.map((f) => f.followee_id));

  // 3. Add isFollowing flag
  const result = followersList.map((f) => ({
    id: f.id,
    name: f.name || null,
    username: f.user_name,
    avatar: f.profile_url || null,
    isFollowing: followingIds.has(f.id), // ✅ true if I follow them back
  }));

  res.json(result);
});

// get users that :id is following
router.get("/followings", auth, async (req, res) => {
  const { user } = res.locals.user;
  const userId = user.id;

  // 1. Get users I follow (followees)
  const following = await prisma.follow.findMany({
    where: { follower_id: userId },
    select: {
      followee: {
        select: {
          id: true,
          user_name: true,
          name: true,
          profile_url: true,
        },
      },
    },
  });

  const followingList = following.map((f) => f.followee);

  // 2. Get ALL user IDs that follow me (my followers)
  const followersRecords = await prisma.follow.findMany({
    where: { followee_id: userId },
    select: { follower_id: true },
  });

  const followerIds = new Set(followersRecords.map((f) => f.follower_id));

  // 3. Format with status flags
  const result = followingList.map((user) => ({
    id: user.id,
    name: user.name || null,
    username: user.user_name,
    avatar: user.profile_url || null,
    isFollowing: true, // ✅ you always follow these people
    isFollowedBy: followerIds.has(user.id), // 🔁 do they follow you back?
  }));

  res.json(result);
});

// follow (current user follows targetId)
router.post("/follow", auth, async (req, res) => {
  const { follower } = req.body; // use clear name
  const targetUserId = follower.id;
  const { user } = res.locals.user;
  const currentUserId = user.id; // assuming auth sets req.user

  if (currentUserId == targetUserId) {
    return res.status(400).json({ error: "Cannot follow yourself" });
  }

  // Check if already following
  const existing = await prisma.follow.findUnique({
    where: {
      follower_id_followee_id: {
        follower_id: currentUserId,
        followee_id: targetUserId,
      },
    },
  });

  if (existing) {
    // 🔁 Unfollow: delete the record
    await prisma.follow.delete({
      where: { id: existing.id },
    });
    return res.json({ action: "unfollowed", userId: targetUserId });
  } else {
    // ➕ Follow: create new record
    const newFollow = await prisma.follow.create({
      data: {
        follower_id: currentUserId,
        followee_id: targetUserId,
      },
    });
    return res.json({ action: "followed", userId: targetUserId });
  }
});

// unfollow
// POST /relationship/unfollow
router.post("/unfollow", auth, async (req, res) => {
  const { follower } = req.body; // use clear name
  const targetUserId = follower.id;
  const { user } = res.locals.user;
  const currentUserId = user.id; // assuming auth sets req.user

  if (currentUserId == targetUserId) {
    return res.status(400).json({ error: "Cannot unfollow yourself" });
  }

  const existing = await prisma.follow.findUnique({
    where: {
      follower_id_followee_id: {
        follower_id: currentUserId,
        followee_id: targetUserId,
      },
    },
  });

  if (!existing) {
    return res.status(404).json({ error: "Not following this user" });
  }

  await prisma.follow.delete({ where: { id: existing.id } });
  res.json({ message: "Unfollowed", userId: targetUserId });
});

router.get("/all", auth, async (req, res) => {
  const { user } = res.locals.user;
  const currentUserId = user.id;

  const users = await prisma.user.findMany({
    where: {
      id: {
        not: currentUserId,
        notIn: [
          ...(
            await prisma.follow.findMany({
              where: { follower_id: currentUserId },
              select: { followee_id: true },
            })
          ).map((f) => f.followee_id),
          ...(
            await prisma.follow.findMany({
              where: { followee_id: currentUserId },
              select: { follower_id: true },
            })
          ).map((f) => f.follower_id),
        ],
      },
    },
  });

  const result = users.map((f) => ({
    id: f.id,
    name: f.name || null,
    username: f.user_name,
    avatar: f.profile_url || null,
    isFollowing: false,
  }));

  res.json(result);
});

module.exports = { relationshipRouter: router };
// ...existing code...
