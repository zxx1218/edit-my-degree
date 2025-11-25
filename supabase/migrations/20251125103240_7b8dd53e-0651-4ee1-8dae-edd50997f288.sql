-- Add pdf_limit field to users table
ALTER TABLE public.users ADD COLUMN pdf_limit INTEGER NOT NULL DEFAULT 0;