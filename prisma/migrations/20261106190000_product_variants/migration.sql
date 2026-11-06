ALTER TABLE "Product" ADD COLUMN "usesVariants" BOOLEAN NOT NULL DEFAULT false;
CREATE TABLE "ProductVariant" (
 "id" UUID NOT NULL,
 "productId" UUID NOT NULL,
 "name" TEXT NOT NULL,
 "price" INTEGER NOT NULL,
 "stock" INTEGER NOT NULL DEFAULT 0,
 "image" TEXT NOT NULL,
 "gallery" TEXT[] DEFAULT ARRAY[]::TEXT[],
 "position" INTEGER NOT NULL DEFAULT 0,
 "active" BOOLEAN NOT NULL DEFAULT true,
 CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT "ProductVariant_price_positive" CHECK ("price">0),
 CONSTRAINT "ProductVariant_stock_nonnegative" CHECK ("stock">=0)
);
CREATE INDEX "ProductVariant_productId_active_position_idx" ON "ProductVariant"("productId","active","position");
