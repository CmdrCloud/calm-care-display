DO $$ BEGIN
 ALTER TABLE "devices" ADD COLUMN "family_id" uuid;
EXCEPTION
 WHEN duplicate_column THEN null;
END $$;

UPDATE "devices" SET "family_id" = (SELECT id FROM "families" ORDER BY created_at ASC LIMIT 1) WHERE "family_id" IS NULL;

DO $$ BEGIN
 ALTER TABLE "devices" ALTER COLUMN "family_id" SET NOT NULL;
EXCEPTION
 WHEN others THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "devices" ADD CONSTRAINT "fk_devices_family" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "idx_devices_family" ON "devices" ("family_id");
