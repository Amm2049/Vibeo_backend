/*
  Warnings:

  - A unique constraint covering the columns `[user_id,content_id]` on the table `React` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "React_user_id_content_id_key" ON "React"("user_id", "content_id");
