/*
  Warnings:

  - You are about to drop the column `comment_id` on the `React` table. All the data in the column will be lost.
  - You are about to drop the column `react` on the `React` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `React` table. All the data in the column will be lost.
  - Made the column `content_id` on table `React` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_React" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "content_id" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "React_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "React_content_id_fkey" FOREIGN KEY ("content_id") REFERENCES "Content" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_React" ("content_id", "createdAt", "id", "user_id") SELECT "content_id", "createdAt", "id", "user_id" FROM "React";
DROP TABLE "React";
ALTER TABLE "new_React" RENAME TO "React";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
