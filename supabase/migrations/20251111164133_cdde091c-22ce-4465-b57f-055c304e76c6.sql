-- Create documents table for property document management
CREATE TABLE IF NOT EXISTS public.property_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  folder_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own documents
CREATE POLICY "Users can manage their own property documents"
ON public.property_documents
FOR ALL
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_property_documents_property_id ON public.property_documents(property_id);
CREATE INDEX idx_property_documents_folder_name ON public.property_documents(folder_name);

-- Add document type to quotations to separate quotations and invoices
ALTER TABLE public.quotations
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'quotation';

-- Create index for document_type
CREATE INDEX IF NOT EXISTS idx_quotations_document_type ON public.quotations(document_type);