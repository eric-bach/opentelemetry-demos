CREATE DATABASE OtelTempo;
GO

USE OtelTempo;
GO

CREATE TABLE flight (
  id    int IDENTITY(1,1) PRIMARY KEY,
  origin CHAR(3) NOT NULL,
  destination CHAR(3) NOT NULL,
  airline VARCHAR(40) NOT NULL,
  departing DATETIME NOT NULL);
GO

TRUNCATE TABLE flight;
GO

INSERT INTO
	flight(origin, destination, airline, departing)
VALUES
  ('YEG', 'YYC', 'Air Canada', '2025-02-01 12:10:00'),
  ('YEG', 'YVR', 'WestJet', '2025-02-05 13:25:00'),
  ('YEG', 'SFO', 'Air Canada', '2025-02-12 09:15:00');
GO