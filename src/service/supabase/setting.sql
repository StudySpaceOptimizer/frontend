-- Create a table for settings
CREATE TABLE settings IF NOT EXISTS (
    ID INT generated always as identity PRIMARY KEY,
    KeyName VARCHAR(255) UNIQUE NOT NULL,
    Value TEXT NOT NULL,
    Description TEXT
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;


-- Insert default settings
INSERT INTO settings (KeyName, Value, Description) VALUES ('weekdayOpeningHours', '{"begin": "09:00", "end": "17:00"}', '工作日開放時間');
INSERT INTO settings (KeyName, Value, Description) VALUES ('weekendOpeningHours', '{"begin": "10:00", "end": "16:00"}', '週末開放時間');
INSERT INTO settings (KeyName, Value, Description) VALUES ('minimumReservationDuration', '1', '最小預約時間單位(小時)');
INSERT INTO settings (KeyName, Value, Description) VALUES ('maximumReservationDuration', '4', '單次預約時間上限(小時)');
INSERT INTO settings (KeyName, Value, Description) VALUES ('studentReservationLimit', '7', '學生提前預約期限(天)');


-- Create a table for closed periods
CREATE TABLE closed_periods IF NOT EXISTS (
    id serial PRIMARY KEY,
    begin_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL
);

ALTER TABLE closed_periods ENABLE ROW LEVEL SECURITY;