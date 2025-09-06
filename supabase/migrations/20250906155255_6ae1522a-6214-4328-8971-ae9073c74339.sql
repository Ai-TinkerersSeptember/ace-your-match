-- Fix the handle_new_user function to match the actual profiles table schema
-- The profiles table doesn't have an email column, so we need to remove that

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
BEGIN
  -- Insert into profiles table with only the columns that exist
  INSERT INTO public.profiles (id, name)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email, 'Anonymous User')
  );
  RETURN NEW;
END;
$$;