const express = require("express");
const app = express();
const prisma = require("./prismaClient");

const cors = require("cors");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const { userRouter } = require("./routers/user");
app.use("/", userRouter);

const { contentRouter } = require("./routers/content");
app.use("/content", contentRouter);

const { commentRouter } = require("./routers/comment");
app.use("/comment", commentRouter);

const { relationshipRouter } = require("./routers/relationship");
app.use("/relationship", relationshipRouter);

const { reactionRouter } = require("./routers/reaction");
app.use("/reaction", reactionRouter);

const server = app.listen(8000, () => {
  console.log("API started at 8000...");
});

const gracefulShutdown = async () => {
  await prisma.$disconnect();
  server.close(() => {
    console.log("API closed.");
    process.exit(0);
  });
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
