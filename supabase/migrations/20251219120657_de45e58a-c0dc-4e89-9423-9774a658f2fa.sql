-- Enable REPLICA IDENTITY for real-time updates
ALTER TABLE public.profiles REPLICA IDENTITY FULL;