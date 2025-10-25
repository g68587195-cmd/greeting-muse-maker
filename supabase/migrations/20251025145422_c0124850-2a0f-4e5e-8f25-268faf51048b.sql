-- Fix function search paths for security

-- Update handle_updated_at function with secure search_path
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Update generate_quotation_number function with secure search_path
CREATE OR REPLACE FUNCTION public.generate_quotation_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.quotation_number IS NULL OR NEW.quotation_number = '' THEN
    NEW.quotation_number := 'QT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEXTVAL('quotation_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;