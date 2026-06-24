ALTER TABLE "devices" ADD COLUMN "family_id" uuid NOT NULL REFERENCES "families"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "idx_devices_family" ON "devices" ("family_id");
