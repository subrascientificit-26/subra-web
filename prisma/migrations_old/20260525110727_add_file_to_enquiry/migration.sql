/*
  Warnings:

  - You are about to drop the column `attachment` on the `enquiry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `enquiry` DROP COLUMN `attachment`,
    ADD COLUMN `fileUrl` VARCHAR(191) NULL;
