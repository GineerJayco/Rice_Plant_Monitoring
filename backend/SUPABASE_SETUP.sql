-- ============================================================
--  SUPABASE DATABASE SCHEMA
--  Copy and paste this entire SQL into Supabase SQL Editor
--  Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ============================================================
--  SENSOR READINGS TABLE
--  Stores hourly sensor data from ESP32
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  temp FLOAT,
  humidity FLOAT,
  soil_1 FLOAT,
  soil_2 FLOAT,
  soil_3 FLOAT,
  soil_4 FLOAT,
  soil_5 FLOAT,
  soil_6 FLOAT,
  water_level_healthy FLOAT,
  water_level_diseased FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_sensor_readings_timestamp 
  ON public.sensor_readings(timestamp DESC);

-- ============================================================
--  PLANT IMAGES TABLE
--  Stores captured images of each plant (base64)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plant_images (
  id BIGSERIAL PRIMARY KEY,
  plant_id INTEGER NOT NULL,
  image_data TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for plant queries
CREATE INDEX IF NOT EXISTS idx_plant_images_plant_id_timestamp 
  ON public.plant_images(plant_id, timestamp DESC);

-- ============================================================
--  PLANT DETECTIONS TABLE
--  Stores YOLOv8 disease detection results per plant
-- ============================================================
CREATE TABLE IF NOT EXISTS public.plant_detections (
  id BIGSERIAL PRIMARY KEY,
  plant_id INTEGER NOT NULL,
  healthy_count INTEGER,
  sheath_blight_count INTEGER,
  detection_data JSONB,
  inference_ms INTEGER,
  error_message TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for plant queries
CREATE INDEX IF NOT EXISTS idx_plant_detections_plant_id_timestamp 
  ON public.plant_detections(plant_id, timestamp DESC);

-- ============================================================
--  Success! Tables are now ready to store data
-- ============================================================
