-- Create a table for reservations
CREATE TABLE IF NOT EXISTS reservations(
    id uuid NOT NULL PRIMARY KEY,
    begin_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    user_id uuid NOT NULL,
    seat_id uuid NOT NULL,
    check_in_time timestamp with time zone,
    temporary_leave_time timestamp with time zone,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_seat FOREIGN KEY(seat_id) REFERENCES seats(id) ON DELETE CASCADE 
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
