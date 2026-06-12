-- =============================================
-- FlavorPoints - Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. TABLES
-- =============================================

-- Customers (extends auth.users)
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  points INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'employee', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Visits
CREATE TABLE IF NOT EXISTS public.visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  invoice_amount FLOAT NOT NULL,
  points_earned INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES public.customers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price FLOAT NOT NULL,
  category TEXT DEFAULT 'Main',
  image_url TEXT DEFAULT '',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rewards
CREATE TABLE IF NOT EXISTS public.rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  points_cost INTEGER NOT NULL,
  image_url TEXT DEFAULT '',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Game History
CREATE TABLE IF NOT EXISTS public.game_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  entry_cost INTEGER NOT NULL,
  winnings INTEGER NOT NULL DEFAULT 0,
  played_at TIMESTAMPTZ DEFAULT NOW()
);

-- App Settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Missions
CREATE TABLE IF NOT EXISTS public.missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  target INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reward Redemptions
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  points_cost INTEGER NOT NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_role ON public.customers(role);
CREATE INDEX IF NOT EXISTS idx_visits_customer ON public.visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_game_history_customer ON public.game_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_game_history_game_type ON public.game_history(game_type);
CREATE INDEX IF NOT EXISTS idx_missions_customer ON public.missions(customer_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_customer ON public.reward_redemptions(customer_id);

-- =============================================
-- 3. ROW LEVEL SECURITY (RLS)
-- =============================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- ---------- Customers ----------
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.customers FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.customers FOR UPDATE
  USING (auth.uid() = id);

-- Admins can read all customers
CREATE POLICY "Admins can read all customers"
  ON public.customers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'admin')
  );

-- Employees can read all customers
CREATE POLICY "Employees can read all customers"
  ON public.customers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'employee')
  );

-- Anyone can insert (for signup)
CREATE POLICY "Allow signup insert"
  ON public.customers FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ---------- Visits ----------
-- Users can read their own visits
CREATE POLICY "Users can read own visits"
  ON public.visits FOR SELECT
  USING (customer_id = auth.uid());

-- Admins can read all visits
CREATE POLICY "Admins can read all visits"
  ON public.visits FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'admin')
  );

-- Employees can read all visits
CREATE POLICY "Employees can read all visits"
  ON public.visits FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'employee')
  );

-- Visits are created via RPC function (add_visit)

-- ---------- Menu Items ----------
-- Public read access
CREATE POLICY "Public read menu items"
  ON public.menu_items FOR SELECT
  USING (true);

-- Admins can manage menu items
CREATE POLICY "Admins can insert menu items"
  ON public.menu_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update menu items"
  ON public.menu_items FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete menu items"
  ON public.menu_items FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------- Rewards ----------
-- Public read access
CREATE POLICY "Public read rewards"
  ON public.rewards FOR SELECT
  USING (true);

-- Admins can manage rewards
CREATE POLICY "Admins can insert rewards"
  ON public.rewards FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update rewards"
  ON public.rewards FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can delete rewards"
  ON public.rewards FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------- Game History ----------
-- Users can read their own game history
CREATE POLICY "Users can read own game history"
  ON public.game_history FOR SELECT
  USING (customer_id = auth.uid());

-- Admins can read all game history
CREATE POLICY "Admins can read all game history"
  ON public.game_history FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'admin')
  );

-- Game history is created via RPC function (play_game)

-- ---------- App Settings ----------
-- Public read access
CREATE POLICY "Public read app settings"
  ON public.app_settings FOR SELECT
  USING (true);

-- Admins can manage settings
CREATE POLICY "Admins can insert app settings"
  ON public.app_settings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update app settings"
  ON public.app_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'admin')
  );

-- ---------- Missions ----------
-- Users can read their own missions
CREATE POLICY "Users can read own missions"
  ON public.missions FOR SELECT
  USING (customer_id = auth.uid());

-- Admins can read all missions
CREATE POLICY "Admins can read all missions"
  ON public.missions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'admin')
  );

-- Missions are managed via RPC functions

-- ---------- Reward Redemptions ----------
-- Users can read their own redemptions
CREATE POLICY "Users can read own redemptions"
  ON public.reward_redemptions FOR SELECT
  USING (customer_id = auth.uid());

-- Admins can read all redemptions
CREATE POLICY "Admins can read all redemptions"
  ON public.reward_redemptions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.customers WHERE id = auth.uid() AND role = 'admin')
  );

-- Redemptions are created via RPC function (redeem_reward)

-- =============================================
-- 4. POSTGRESQL FUNCTIONS (RPC)
-- =============================================

-- ADD VISIT: Employee adds a visit for a customer
CREATE OR REPLACE FUNCTION public.add_visit(
  p_customer_id UUID,
  p_invoice_amount FLOAT,
  p_created_by UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_points_per_currency FLOAT;
  v_points_earned INT;
  v_new_points INT;
  v_visit_id UUID;
  v_mission RECORD;
  v_new_progress INT;
  v_total_spend FLOAT;
  v_mission_points INT;
BEGIN
  -- Get points per currency setting
  SELECT (value)::FLOAT INTO v_points_per_currency
  FROM public.app_settings WHERE key = 'points_per_currency';

  IF v_points_per_currency IS NULL THEN
    v_points_per_currency := 1;
  END IF;

  v_points_earned := FLOOR(p_invoice_amount * v_points_per_currency);

  -- Create visit
  INSERT INTO public.visits (id, customer_id, invoice_amount, points_earned, created_by)
  VALUES (gen_random_uuid(), p_customer_id, p_invoice_amount, v_points_earned, p_created_by)
  RETURNING id INTO v_visit_id;

  -- Update customer points and visits
  UPDATE public.customers
  SET points = points + v_points_earned,
      total_visits = total_visits + 1,
      updated_at = NOW()
  WHERE id = p_customer_id
  RETURNING points INTO v_new_points;

  -- Update missions
  FOR v_mission IN
    SELECT id, type, target, progress, points AS mission_points, completed
    FROM public.missions
    WHERE customer_id = p_customer_id AND completed = false
  LOOP
    v_new_progress := v_mission.progress;

    IF v_mission.type IN ('visit_5', 'visit_10') THEN
      SELECT total_visits INTO v_new_progress
      FROM public.customers WHERE id = p_customer_id;
    ELSIF v_mission.type = 'spend_200' THEN
      SELECT COALESCE(FLOOR(SUM(invoice_amount)), 0) INTO v_new_progress
      FROM public.visits WHERE customer_id = p_customer_id;
    END IF;

    IF v_new_progress >= v_mission.target THEN
      UPDATE public.missions SET progress = v_new_progress, completed = true, updated_at = NOW()
      WHERE id = v_mission.id;

      -- Award mission points
      v_mission_points := v_mission.mission_points;
      IF v_mission_points > 0 THEN
        UPDATE public.customers SET points = points + v_mission_points, updated_at = NOW()
        WHERE id = p_customer_id;
        v_new_points := v_new_points + v_mission_points;
      END IF;
    ELSE
      UPDATE public.missions SET progress = v_new_progress, updated_at = NOW()
      WHERE id = v_mission.id;
    END IF;
  END LOOP;

  RETURN json_build_object(
    'visit_id', v_visit_id,
    'points_earned', v_points_earned,
    'new_points_balance', v_new_points
  );
END;
$$;

-- PLAY GAME: Record a game play with entry cost and winnings
CREATE OR REPLACE FUNCTION public.play_game(
  p_customer_id UUID,
  p_game_type TEXT,
  p_winnings INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_entry_cost INT;
  v_cooldown_days INT;
  v_last_play TIMESTAMPTZ;
  v_cooldown_ms BIGINT;
  v_time_since BIGINT;
  v_remaining_hours INT;
  v_new_points INT;
  v_game_id UUID;
BEGIN
  -- Get game cost from settings
  SELECT (value)::INT INTO v_entry_cost
  FROM public.app_settings WHERE key = 'game_cost_' || p_game_type;
  IF v_entry_cost IS NULL THEN
    CASE p_game_type
      WHEN 'burger_catch' THEN v_entry_cost := 50;
      WHEN 'coffee_shooter' THEN v_entry_cost := 50;
      WHEN 'grand_wheel' THEN v_entry_cost := 100;
      ELSE v_entry_cost := 50;
    END CASE;
  END IF;

  -- Get cooldown from settings
  SELECT (value)::INT INTO v_cooldown_days
  FROM public.app_settings WHERE key = 'game_cooldown_' || p_game_type;
  IF v_cooldown_days IS NULL THEN
    CASE p_game_type
      WHEN 'burger_catch' THEN v_cooldown_days := 7;
      WHEN 'coffee_shooter' THEN v_cooldown_days := 7;
      WHEN 'grand_wheel' THEN v_cooldown_days := 30;
      ELSE v_cooldown_days := 7;
    END CASE;
  END IF;

  -- Check cooldown
  SELECT played_at INTO v_last_play
  FROM public.game_history
  WHERE customer_id = p_customer_id AND game_type = p_game_type
  ORDER BY played_at DESC LIMIT 1;

  IF v_last_play IS NOT NULL THEN
    v_cooldown_ms := v_cooldown_days * 24 * 60 * 60 * 1000;
    v_time_since := EXTRACT(EPOCH FROM (NOW() - v_last_play)) * 1000;
    IF v_time_since < v_cooldown_ms THEN
      v_remaining_hours := CEIL((v_cooldown_ms - v_time_since) / 3600000.0);
      RETURN json_build_object(
        'error', 'Cooldown active. Try again in ' || v_remaining_hours || ' hours',
        'cooldown_remaining', v_cooldown_ms - v_time_since
      );
    END IF;
  END IF;

  -- Check sufficient points
  IF NOT EXISTS (SELECT 1 FROM public.customers WHERE id = p_customer_id AND points >= v_entry_cost) THEN
    RETURN json_build_object('error', 'Insufficient points');
  END IF;

  -- Deduct entry cost
  UPDATE public.customers
  SET points = points - v_entry_cost, updated_at = NOW()
  WHERE id = p_customer_id;

  -- Record game
  INSERT INTO public.game_history (id, customer_id, game_type, entry_cost, winnings)
  VALUES (gen_random_uuid(), p_customer_id, p_game_type, v_entry_cost, p_winnings)
  RETURNING id INTO v_game_id;

  -- Add winnings
  IF p_winnings > 0 THEN
    UPDATE public.customers
    SET points = points + p_winnings, updated_at = NOW()
    WHERE id = p_customer_id;
  END IF;

  -- Get new balance
  SELECT points INTO v_new_points FROM public.customers WHERE id = p_customer_id;

  RETURN json_build_object(
    'game_id', v_game_id,
    'entry_cost', v_entry_cost,
    'winnings', p_winnings,
    'new_points_balance', v_new_points
  );
END;
$$;

-- REDEEM REWARD: Redeem a reward for a customer
CREATE OR REPLACE FUNCTION public.redeem_reward(
  p_customer_id UUID,
  p_reward_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reward_name TEXT;
  v_points_cost INT;
  v_customer_points INT;
  v_new_points INT;
  v_redemption_id UUID;
BEGIN
  -- Get reward details
  SELECT name, points_cost INTO v_reward_name, v_points_cost
  FROM public.rewards WHERE id = p_reward_id AND available = true;

  IF v_reward_name IS NULL THEN
    RETURN json_build_object('error', 'Reward not available');
  END IF;

  -- Check sufficient points
  SELECT points INTO v_customer_points
  FROM public.customers WHERE id = p_customer_id;

  IF v_customer_points < v_points_cost THEN
    RETURN json_build_object('error', 'Insufficient points');
  END IF;

  -- Deduct points
  UPDATE public.customers
  SET points = points - v_points_cost, updated_at = NOW()
  WHERE id = p_customer_id;

  -- Create redemption
  INSERT INTO public.reward_redemptions (id, customer_id, reward_id, points_cost)
  VALUES (gen_random_uuid(), p_customer_id, p_reward_id, v_points_cost)
  RETURNING id INTO v_redemption_id;

  -- Get new balance
  SELECT points INTO v_new_points FROM public.customers WHERE id = p_customer_id;

  RETURN json_build_object(
    'redemption_id', v_redemption_id,
    'new_points_balance', v_new_points,
    'reward_name', v_reward_name
  );
END;
$$;

-- =============================================
-- 5. SEED DATA
-- =============================================

-- App Settings
INSERT INTO public.app_settings (key, value) VALUES
  ('points_per_currency', '1'),
  ('game_cost_burger_catch', '50'),
  ('game_cost_coffee_shooter', '50'),
  ('game_cost_grand_wheel', '100'),
  ('game_cooldown_burger_catch', '7'),
  ('game_cooldown_coffee_shooter', '7'),
  ('game_cooldown_grand_wheel', '30'),
  ('mission_target_visit_5', '5'),
  ('mission_target_visit_10', '10'),
  ('mission_target_spend_200', '200')
ON CONFLICT (key) DO NOTHING;

-- Menu Items
INSERT INTO public.menu_items (name, description, price, category) VALUES
  ('Classic Burger', 'Juicy beef patty with lettuce, tomato, and special sauce', 12.99, 'Burgers'),
  ('Cheese Burger', 'Classic burger with melted cheddar cheese', 14.99, 'Burgers'),
  ('Bacon Burger', 'Classic burger with crispy bacon strips', 16.99, 'Burgers'),
  ('Veggie Burger', 'Plant-based patty with fresh vegetables', 13.99, 'Burgers'),
  ('Espresso', 'Rich and bold single shot espresso', 4.99, 'Coffee'),
  ('Cappuccino', 'Espresso with steamed milk foam', 5.99, 'Coffee'),
  ('Latte', 'Espresso with steamed milk', 6.49, 'Coffee'),
  ('Mocha', 'Espresso with chocolate and steamed milk', 6.99, 'Coffee'),
  ('Caesar Salad', 'Fresh romaine with caesar dressing and croutons', 10.99, 'Salads'),
  ('Greek Salad', 'Mixed greens with feta and olives', 9.99, 'Salads'),
  ('French Fries', 'Crispy golden fries with sea salt', 5.99, 'Sides'),
  ('Onion Rings', 'Beer-battered onion rings', 6.99, 'Sides'),
  ('Chocolate Cake', 'Rich chocolate layer cake', 8.99, 'Desserts'),
  ('Cheesecake', 'New York style cheesecake', 7.99, 'Desserts')
ON CONFLICT DO NOTHING;

-- Rewards
INSERT INTO public.rewards (name, description, points_cost) VALUES
  ('Free Espresso', 'Enjoy a free espresso on us!', 100),
  ('Free Cappuccino', 'A complimentary cappuccino', 150),
  ('Free French Fries', 'Crispy fries for free', 200),
  ('$5 Off Your Order', 'Get $5 discount on any order', 250),
  ('Free Caesar Salad', 'Fresh caesar salad on the house', 350),
  ('Free Classic Burger', 'Our signature burger for free', 500),
  ('Free Dessert', 'Choose any dessert from our menu', 300),
  ('Buy 1 Get 1 Coffee', 'Get two coffees for the price of one', 180),
  ('$10 Off Your Order', 'Get $10 discount on any order', 500),
  ('VIP Experience', 'Priority seating + free appetizer', 1000)
ON CONFLICT DO NOTHING;
