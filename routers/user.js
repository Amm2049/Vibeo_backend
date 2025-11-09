const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const multer = require("multer");
const cloudinary = require("../src/utils/cloudinary");
const upload = multer({ storage: multer.memoryStorage() });
const bcrypt = require("bcrypt");
const { auth } = require("../src/middleware/auth");
const jwt = require("jsonwebtoken");

router.get("/verify", auth, async (req, res) => {
  const { user } = res.locals.user;
  res.json(user);
});

router.get("/users", auth, async (req, res) => {
  const data = await prisma.user.findMany({
    include: { contents: true, comments: true },
    orderBy: { id: "desc" },
    take: 20,
  });
  res.json(data);
});

// Update user info
router.post(
  "/users/profile/update",
  upload.fields([
    { name: "updated_pic", maxCount: 1 },
    { name: "updated_cover", maxCount: 1 },
  ]),
  auth,
  async (req, res) => {
    const { user } = res.locals.user; // ✅ from auth middleware
    const id = user.id;
    const { fullName, bio } = req.body;

    let updateData = {
      name: fullName || undefined,
      bio: bio || undefined,
    };

    try {
      // Handle profile picture
      if (req.files && req.files.updated_pic) {
        const file = req.files.updated_pic[0];
        const base64Image = file.buffer.toString("base64");
        const dataURI = `data:${file.mimetype};base64,${base64Image}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "vibeo/avatars",
          overwrite: true,
          invalidate: true,
        });
        updateData.profile_url = result.secure_url;
      }

      // Handle cover photo
      if (req.files && req.files.updated_cover) {
        const file = req.files.updated_cover[0];
        const base64Image = file.buffer.toString("base64");
        const dataURI = `data:${file.mimetype};base64,${base64Image}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "vibeo/covers",
          overwrite: true,
          invalidate: true,
        });
        updateData.cover_url = result.secure_url;
      }

      const updatedUser = await prisma.user.update({
        where: { id: Number(id) },
        data: updateData,
        select: {
          id: true,
          name: true,
          bio: true,
          profile_url: true,
          cover_url: true,
          // Add any other fields your frontend expects
        },
      });

      res.json(updatedUser);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Update failed" });
    }
  }
);

// Fetch Profile page
router.get("/users/profile", auth, async (req, res) => {
  const { user } = res.locals.user;

  const data = await prisma.user.findFirst({
    where: { id: Number(user.id) },
    include: { contents: true },
  });

  // who follows me
  const followers = await prisma.follow.findMany({
    where: { followee_id: Number(user.id) }, // ← you are the followee
    select: {
      follower: true, // ← get the user who follows you
    },
  });

  // whom i follow
  const followings = await prisma.follow.findMany({
    where: { follower_id: Number(user.id) }, // ← you are the followee
    select: {
      followee: true, // ← get the user who follows you
    },
  });

  const formattedUser = {
    id: data.id,
    username: data.user_name,
    fullName: data.name,
    bio: data.bio,
    avatar: data.profile_url || null,
    cover: data.cover_url,
    stats: {
      contents: data.contents.length,
      images: data.contents
        .filter((p) => p?.photo_url)
        .map((p) => p.photo_url)
        .reverse(),
      followers: followers.length,
      following: followings.length,
    },
  };

  res.json(formattedUser);
});

// register
router.post(
  "/users/signup",
  upload.single("profile_picture"),
  async (req, res) => {
    const { name, username, email, password, bio } = req.body;
    let profile_url = null;

    if (req.file) {
      // Convert buffer to base64
      const base64Image = req.file.buffer.toString("base64");
      const dataURI = `data:${req.file.mimetype};base64,${base64Image}`;

      const result = await cloudinary.uploader.upload(dataURI, {
        folder: "vibeo/avatars",
      });
      profile_url = result.secure_url; // ✅ Now this exists
    }

    const user = await prisma.user.create({
      data: {
        name,
        user_name: username,
        bio,
        email,
        password: await bcrypt.hash(password, 10),
        profile_url,
      },
    });
    // Generate token
    const token = jwt.sign({ user: user }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ user, token });
  }
);

// login
const JWT_SECRET = process.env.JWT_SECRET;
router.post("/users/signin", async (req, res) => {
  const { username, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({ where: { user_name: username } });

  if (!user)
    return res.status(401).json({ error: "Invalid email or password" });

  // Check password
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid)
    return res.status(401).json({ error: "Invalid email or password" });

  // Generate token
  const token = jwt.sign({ user: user }, JWT_SECRET, { expiresIn: "7d" });

  // Return user (without password) + token
  const { password: _, ...userWithoutPassword } = user;

  res.json({ token, user: userWithoutPassword });
});

module.exports = { userRouter: router };

// user create finished
// react quesry page
