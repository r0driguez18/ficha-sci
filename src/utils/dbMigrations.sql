
-- Make as400_name column nullable in file_processes table
ALTER TABLE file_processes ALTER COLUMN as400_name DROP NOT NULL;
