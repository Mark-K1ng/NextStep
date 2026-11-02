-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, grade_level, county, interests, favorite_subjects)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', 'Utilizator'),
    COALESCE(NEW.raw_user_meta_data->>'grade_level', 'IX'),
    COALESCE(NEW.raw_user_meta_data->>'county', 'București'),
    COALESCE(NEW.raw_user_meta_data->>'interests', ARRAY['tehnologie']::TEXT[]),
    COALESCE(NEW.raw_user_meta_data->>'favorite_subjects', ARRAY['informatica']::TEXT[])
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
