-- Create leaderboard table (single row per player, all difficulties)
-- Run this in your Supabase SQL Editor

CREATE TABLE leaderboard (
    id SERIAL PRIMARY KEY,
    player_name TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    easy_score INTEGER DEFAULT 0,
    easy_kills INTEGER DEFAULT 0,
    easy_streak INTEGER DEFAULT 0,
    medium_score INTEGER DEFAULT 0,
    medium_kills INTEGER DEFAULT 0,
    medium_streak INTEGER DEFAULT 0,
    hard_score INTEGER DEFAULT 0,
    hard_kills INTEGER DEFAULT 0,
    hard_streak INTEGER DEFAULT 0,
    expert_score INTEGER DEFAULT 0,
    expert_kills INTEGER DEFAULT 0,
    expert_streak INTEGER DEFAULT 0,
    insane_score INTEGER DEFAULT 0,
    insane_kills INTEGER DEFAULT 0,
    insane_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster leaderboard queries
CREATE INDEX idx_leaderboard_easy_score ON leaderboard(easy_score DESC);
CREATE INDEX idx_leaderboard_medium_score ON leaderboard(medium_score DESC);
CREATE INDEX idx_leaderboard_hard_score ON leaderboard(hard_score DESC);
CREATE INDEX idx_leaderboard_expert_score ON leaderboard(expert_score DESC);
CREATE INDEX idx_leaderboard_insane_score ON leaderboard(insane_score DESC);

-- Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON leaderboard FOR UPDATE USING (true);
