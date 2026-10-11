-- Existing orders retain their status and comment. Historical cancellation reasons are unknown.
ALTER TABLE "Order" ADD COLUMN "cancellationReason" TEXT;
