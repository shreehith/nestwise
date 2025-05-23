CREATE TABLE IF NOT EXISTS user_settings (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES auth.users NOT NULL, email_notifications BOOLEAN DEFAULT true, dark_mode BOOLEAN DEFAULT false, created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL, updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL, UNIQUE(user_id)); ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY; CREATE POLICY \
Users
can
view
their
own
settings\ ON user_settings FOR SELECT USING (auth.uid() = user_id); CREATE POLICY \Users
can
update
their
own
settings\ ON user_settings FOR UPDATE USING (auth.uid() = user_id); CREATE POLICY \Users
can
insert
their
own
settings\ ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id); CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS } BEGIN NEW.updated_at = timezone('utc'::text, now()); RETURN NEW; END; } language 'plpgsql'; CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
