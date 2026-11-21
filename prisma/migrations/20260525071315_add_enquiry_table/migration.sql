-- AlterTable
ALTER TABLE `product` ADD COLUMN `isFavorite` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `Enquiry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fullName` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `productCategory` VARCHAR(191) NULL,
    `message` VARCHAR(191) NOT NULL,
    `attachment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
