// seed.js
const { PrismaClient } = require("@prisma/client");
const { hash } = require("bcrypt"); // Make sure to install bcryptjs: npm install bcryptjs

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Clear existing data (be careful in production!)
  await prisma.react.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.follow.deleteMany();
  await prisma.content.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const users = await prisma.user.createManyAndReturn({
    data: [
      {
        user_name: "alice_wonder",
        name: "Alice Johnson",
        bio: "Digital artist and photographer 📸",
        email: "alice@example.com",
        password: await hash("password123", 10),
        profile_url:
          "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
        cover_url:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=200&fit=crop",
      },
      {
        user_name: "bob_builder",
        name: "Bob Smith",
        bio: "Building awesome things 🛠️ | Travel enthusiast",
        email: "bob@example.com",
        password: await hash("password123", 10),
        profile_url:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        cover_url:
          "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=200&fit=crop",
      },
      {
        user_name: "charlie_tech",
        name: "Charlie Brown",
        bio: "Tech geek and coffee lover ☕",
        email: "charlie@example.com",
        password: await hash("password123", 10),
        profile_url:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        cover_url:
          "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800&h=200&fit=crop",
      },
      {
        user_name: "diana_rose",
        name: "Diana Prince",
        bio: "Nature lover and adventure seeker 🌿",
        email: "diana@example.com",
        password: await hash("password123", 10),
        profile_url:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        cover_url:
          "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&h=200&fit=crop",
      },
    ],
  });

  console.log(`Created ${users.length} users`);

  // Create contents
  const contents = await prisma.content.createManyAndReturn({
    data: [
      // Alice's contents
      {
        type: "photo",
        photo_url:
          "https://images.unsplash.com/photo-1682686581556-a3f0ee0ed556?w=500&h=500&fit=crop",
        caption: "Beautiful sunset at the beach 🌅",
        visibility: "public",
        user_id: users[0].id,
      },
      {
        type: "photo",
        photo_url:
          "https://images.unsplash.com/photo-1682687980961-78fa83781450?w=500&h=500&fit=crop",
        caption: "Morning coffee and coding ☕",
        visibility: "public",
        user_id: users[0].id,
      },
      {
        type: "video",
        video_url: "https://example.com/videos/beach-waves.mp4",
        caption: "Relaxing ocean waves 🏖️",
        visibility: "public",
        user_id: users[0].id,
      },

      // Bob's contents
      {
        type: "photo",
        photo_url:
          "https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1?w=500&h=500&fit=crop",
        caption: "My latest project coming together!",
        visibility: "public",
        user_id: users[1].id,
      },
      {
        type: "video",
        video_url: "https://example.com/videos/diy-project.mp4",
        caption: "DIY home improvement tutorial",
        visibility: "public",
        user_id: users[1].id,
      },

      // Charlie's contents
      {
        type: "photo",
        photo_url:
          "https://images.unsplash.com/photo-1682687221248-3116ba6ab483?w=500&h=500&fit=crop",
        caption: "New gadget unboxing! So excited!",
        visibility: "public",
        user_id: users[2].id,
      },
      {
        type: "photo",
        photo_url:
          "https://images.unsplash.com/photo-1682687221038-404670f1d135?w=500&h=500&fit=crop",
        caption: "Coffee shop coding session",
        visibility: "private",
        user_id: users[2].id,
      },

      // Diana's contents
      {
        type: "photo",
        photo_url:
          "https://images.unsplash.com/photo-1682695797221-8164ff1fafc9?w=500&h=500&fit=crop",
        caption: "Hiking adventure in the mountains ⛰️",
        visibility: "public",
        user_id: users[3].id,
      },
      {
        type: "video",
        video_url: "https://example.com/videos/waterfall.mp4",
        caption: "Beautiful waterfall discovered today",
        visibility: "public",
        user_id: users[3].id,
      },
    ],
  });

  console.log(`Created ${contents.length} contents`);

  // Create comments
  const comments = await prisma.comment.createMany({
    data: [
      {
        comment: "Amazing shot! The colors are incredible!",
        user_id: users[1].id,
        content_id: contents[0].id,
      },
      {
        comment: "This looks so peaceful! Where was this taken?",
        user_id: users[2].id,
        content_id: contents[0].id,
      },
      {
        comment: "Love the setup! What keyboard are you using?",
        user_id: users[3].id,
        content_id: contents[1].id,
      },
      {
        comment: "Great work on the project! 👏",
        user_id: users[0].id,
        content_id: contents[3].id,
      },
      {
        comment: "Which model is that? Looks awesome!",
        user_id: users[1].id,
        content_id: contents[5].id,
      },
      {
        comment: "Beautiful scenery! Wish I was there!",
        user_id: users[2].id,
        content_id: contents[7].id,
      },
    ],
  });

  console.log(`Created ${comments.count} comments`);

  // Create reactions
  const reactions = await prisma.react.createMany({
    data: [
      // Reactions for Alice's first photo
      { user_id: users[1].id, content_id: contents[0].id },
      { user_id: users[2].id, content_id: contents[0].id },
      { user_id: users[3].id, content_id: contents[0].id },

      // Reactions for Alice's second photo
      { user_id: users[1].id, content_id: contents[1].id },
      { user_id: users[2].id, content_id: contents[1].id },

      // Reactions for Bob's project photo
      { user_id: users[0].id, content_id: contents[3].id },
      { user_id: users[2].id, content_id: contents[3].id },
      { user_id: users[3].id, content_id: contents[3].id },

      // Reactions for Charlie's gadget photo
      { user_id: users[0].id, content_id: contents[5].id },
      { user_id: users[1].id, content_id: contents[5].id },

      // Reactions for Diana's hiking photo
      { user_id: users[0].id, content_id: contents[7].id },
      { user_id: users[1].id, content_id: contents[7].id },
      { user_id: users[2].id, content_id: contents[7].id },
    ],
  });

  console.log(`Created ${reactions.count} reactions`);

  // Create follow relationships
  const follows = await prisma.follow.createMany({
    data: [
      // Alice follows Bob and Charlie
      { follower_id: users[0].id, followee_id: users[1].id },
      { follower_id: users[0].id, followee_id: users[2].id },

      // Bob follows Alice and Diana
      { follower_id: users[1].id, followee_id: users[0].id },
      { follower_id: users[1].id, followee_id: users[3].id },

      // Charlie follows everyone
      { follower_id: users[2].id, followee_id: users[0].id },
      { follower_id: users[2].id, followee_id: users[1].id },
      { follower_id: users[2].id, followee_id: users[3].id },

      // Diana follows Alice
      { follower_id: users[3].id, followee_id: users[0].id },
    ],
  });

  console.log(`Created ${follows.count} follow relationships`);

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
