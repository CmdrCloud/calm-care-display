DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'device_sync_states' AND column_name = 'force_sync_at'
  ) THEN
    ALTER TABLE "device_sync_states" ADD COLUMN "force_sync_at" timestamp with time zone;
  END IF;
END $$;
