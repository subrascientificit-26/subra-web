-- CreateTable
CREATE TABLE `CustomRequirement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productName` VARCHAR(191) NOT NULL,
    `casNo` VARCHAR(191) NULL,
    `molecularFormula` VARCHAR(191) NULL,
    `purity` VARCHAR(191) NOT NULL,
    `quantity` VARCHAR(191) NOT NULL,
    `quantityUnit` VARCHAR(191) NOT NULL,
    `packSize` VARCHAR(191) NULL,
    `application` VARCHAR(191) NOT NULL,
    `deliveryLocation` VARCHAR(191) NOT NULL,
    `detailedRequirement` VARCHAR(191) NOT NULL,
    `attachment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
