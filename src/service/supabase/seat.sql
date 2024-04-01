DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seat_status') THEN
        CREATE TYPE seat_status AS ENUM ('available', 'booked', 'partiallyBooked', 'unavailable');
    END IF;
END
$$;




-- Create a table for seats
CREATE TABLE seats (
    id uuid PRIMARY KEY,
    available boolean NOT NULL,
    other_info text,
    status seat_status NOT NULL
);

ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

