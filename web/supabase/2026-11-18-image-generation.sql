CREATE TABLE IF NOT EXISTS public.image_generation_usage (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_date date NOT NULL,
    generation_count integer NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, usage_date)
);

CREATE OR REPLACE FUNCTION public.consume_image_generation()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid := auth.uid();
    today_melbourne date :=
        (now() AT TIME ZONE 'Australia/Melbourne')::date;
    updated_count integer;
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    INSERT INTO public.image_generation_usage (
        user_id,
        usage_date,
        generation_count
    )
    VALUES (current_user_id, today_melbourne, 1)
    ON CONFLICT (user_id, usage_date)
    DO UPDATE
    SET generation_count =
        public.image_generation_usage.generation_count + 1
    WHERE public.image_generation_usage.generation_count < 3
    RETURNING generation_count INTO updated_count;

    RETURN FOUND;
END;
$function$;

CREATE OR REPLACE FUNCTION public.refund_image_generation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_user_id uuid := auth.uid();
    today_melbourne date :=
        (now() AT TIME ZONE 'Australia/Melbourne')::date;
BEGIN
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    UPDATE public.image_generation_usage
    SET generation_count = GREATEST(generation_count - 1, 0)
    WHERE user_id = current_user_id
      AND usage_date = today_melbourne;
END;
$function$;

REVOKE ALL ON FUNCTION public.consume_image_generation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_image_generation() TO authenticated;

REVOKE ALL ON FUNCTION public.refund_image_generation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refund_image_generation() TO authenticated;