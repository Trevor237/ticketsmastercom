DROP POLICY IF EXISTS events_public_read_published ON public.events;
CREATE POLICY events_public_read_published ON public.events
FOR SELECT TO anon, authenticated
USING (status IN ('published'::event_status, 'sold_out'::event_status, 'cancelled'::event_status));