/*
  # Add specification confirmation fields to events
  
  1. Changes
    - Add specification_confirmed boolean field (default false)
    - Add specification_confirmed_at timestamp field
    - Add specification_confirmed_by uuid field (references auth.users)
  
  2. Purpose
    - Track when warehouse staff confirms they have collected all items
    - Record who confirmed the specification
    - Record when the confirmation happened
*/

-- Add specification confirmation fields to events table
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS specification_confirmed boolean DEFAULT false;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS specification_confirmed_at timestamptz;

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS specification_confirmed_by uuid REFERENCES auth.users(id);

-- Update existing records to have specification_confirmed = false
UPDATE events SET specification_confirmed = false WHERE specification_confirmed IS NULL;
