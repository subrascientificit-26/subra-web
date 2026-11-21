-- AlterTable
ALTER TABLE `Product` ADD COLUMN `deletedAt` DATETIME(3) NULL,
    ADD COLUMN `isArGrade` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isDeleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `name` VARCHAR(191) NULL,
    ADD COLUMN `profile` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `SidebarItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `label` VARCHAR(191) NOT NULL,
    `href` VARCHAR(191) NOT NULL,
    `parentId` INTEGER NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `section` ENUM('navbar', 'footer', 'footer_service', 'products_sidebar', 'admin') NOT NULL DEFAULT 'navbar',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SidebarItem_section_parentId_sortOrder_idx`(`section`, `parentId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SiteSetting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `value` TEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SiteSetting_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `SubCategory_categoryId_name_key` ON `SubCategory`(`categoryId`, `name`);

-- AddForeignKey
ALTER TABLE `SidebarItem` ADD CONSTRAINT `SidebarItem_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `SidebarItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

