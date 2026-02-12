/*
  # Create LED Specification Cases Table

  1. New Tables
    - `led_specification_cases`
      - `id` (uuid, primary key)
      - `event_id` (uuid, references events) - событие
      - `budget_item_id` (uuid, references event_budget_items) - пункт бюджета с LED экраном
      - `case_id` (uuid, references equipment_items) - кейс для модулей
      - `quantity` (integer) - количество кейсов
      - `picked` (boolean) - отметка о сборке
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `led_specification_cases` table
    - Add policies for authenticated users

  3. Indexes
    - Index on event_id for fast lookups
    - Index on budget_item_id for fast lookups
    - Unique constraint on (event_id, budget_item_id, case_id) to prevent duplicates
*/

-- Create led_specification_cases table
CREATE TABLE IF NOT EXISTS led_specification_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  budget_item_id uuid NOT NULL REFERENCES event_budget_items(id) ON DELETE CASCADE,
  case_id uuid NOT NULL REFERENCES equipment_items(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  picked boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(event_id, budget_item_id, case_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_led_specification_cases_event ON led_specification_cases(event_id);
CREATE INDEX IF NOT EXISTS idx_led_specification_cases_budget_item ON led_specification_cases(budget_item_id);

-- Enable RLS
ALTER TABLE led_specification_cases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view all led specification cases"
  ON led_specification_cases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert led specification cases"
  ON led_specification_cases FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update led specification cases"
  ON led_specification_cases FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete led specification cases"
  ON led_specification_cases FOR DELETE
  TO authenticated
  USING (true);
