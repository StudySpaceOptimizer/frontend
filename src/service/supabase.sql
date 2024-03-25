DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role') THEN
        CREATE TYPE role AS ENUM('student', 'outsider', 'admin', 'assistant');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'seat_status') THEN
        CREATE TYPE seat_status AS ENUM ('available', 'booked', 'partiallyBooked', 'unavailable');
    END IF;
END
$$;

-- Create a table for users
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT NOT NULL UNIQUE,
    role ROLE NOT NULL,
    is_in BOOLEAN NOT NULL,
    name TEXT,
    phone TEXT,
    id_card TEXT,
    point INTEGER DEFAULT 0 NOT NULL
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create a table for bans, referencing the users table
CREATE TABLE IF NOT EXISTS blacklist (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    reason TEXT NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL
);

ALTER TABLE blacklist ENABLE ROW LEVEL SECURITY;


CREATE TABLE seats (
    id uuid PRIMARY KEY,
    available boolean NOT NULL,
    other_info text,
    status seat_status NOT NULL
);

ALTER TABLE seats ENABLE ROW LEVEL SECURITY;


CREATE TABLE reservations IF NOT EXISTS (
    id uuid NOT NULL PRIMARY KEY,
    begin_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    user_id uuid NOT NULL,
    seat_id uuid NOT NULL,
    check_in_time timestamp with time zone,
    temporary_leave_time timestamp with time zone,
    CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES user_profiles(id),
    CONSTRAINT fk_seat FOREIGN KEY(seat_id) REFERENCES seats(id)
);

ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

CREATE TABLE settings IF NOT EXISTS (
    ID INT generated always as identity PRIMARY KEY,
    KeyName VARCHAR(255) UNIQUE NOT NULL,
    Value TEXT NOT NULL,
    Description TEXT
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

INSERT INTO settings (KeyName, Value, Description) VALUES ('weekdayOpeningHours', '{"begin": "09:00", "end": "17:00"}', '工作日開放時間');
INSERT INTO settings (KeyName, Value, Description) VALUES ('weekendOpeningHours', '{"begin": "10:00", "end": "16:00"}', '週末開放時間');
INSERT INTO settings (KeyName, Value, Description) VALUES ('minimumReservationDuration', '1', '最小預約時間單位(小時)');
INSERT INTO settings (KeyName, Value, Description) VALUES ('maximumReservationDuration', '4', '單次預約時間上限(小時)');
INSERT INTO settings (KeyName, Value, Description) VALUES ('studentReservationLimit', '7', '學生提前預約期限(天)');


CREATE TABLE closed_periods IF NOT EXISTS (
    id serial PRIMARY KEY,
    begin_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL
);

ALTER TABLE closed_periods ENABLE ROW LEVEL SECURITY;



CREATE OR REPLACE FUNCTION public.insert_user_profile_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- 定義role變量
    DECLARE
        user_role role;
    BEGIN
        -- 檢查email後綴決定role
        IF NEW.email LIKE '%@mail.ntou.edu.tw' THEN
            user_role := 'student';
        ELSE
            user_role := 'outsider';
        END IF;

        -- 向user_profiles表插入新記錄
        INSERT INTO public.user_profiles (id, email, role, is_in, point)
        VALUES (NEW.id, NEW.email, user_role, false, 0);

        -- 由於這是AFTER INSERT觸發器，沒有返回值
    END;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trigger_insert_user_profile_defaults
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION insert_user_profile_defaults();