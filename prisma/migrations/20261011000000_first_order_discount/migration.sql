-- Existing orders keep their original terms; the promotion applies to new orders only.
ALTER TABLE "Order" ADD COLUMN "isFirstOrder" BOOLEAN NOT NULL DEFAULT false;
