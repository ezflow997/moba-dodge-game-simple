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

-- =====================================================
-- RANKED TOURNAMENT SYSTEM TABLES
-- =====================================================

-- Player ELO tracking
CREATE TABLE player_elo (
    id SERIAL PRIMARY KEY,
    player_name TEXT UNIQUE NOT NULL,
    elo INTEGER DEFAULT 1000,
    games_played INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_player_elo_ranking ON player_elo(elo DESC);
CREATE INDEX idx_player_elo_name ON player_elo(player_name);

-- Active ranked queue (scores waiting for tournament resolution)
CREATE TABLE ranked_queue (
    id SERIAL PRIMARY KEY,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    kills INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    tournament_id UUID,
    resolved BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_ranked_queue_unresolved ON ranked_queue(resolved) WHERE resolved = FALSE;
CREATE INDEX idx_ranked_queue_player ON ranked_queue(player_name);

-- Tournament history (completed tournaments)
CREATE TABLE ranked_history (
    id SERIAL PRIMARY KEY,
    tournament_id UUID NOT NULL,
    player_name TEXT NOT NULL,
    score INTEGER NOT NULL,
    placement INTEGER NOT NULL,
    total_players INTEGER NOT NULL,
    elo_before INTEGER NOT NULL,
    elo_after INTEGER NOT NULL,
    elo_change INTEGER NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_ranked_history_player ON ranked_history(player_name);
CREATE INDEX idx_ranked_history_tournament ON ranked_history(tournament_id);
CREATE INDEX idx_ranked_history_date ON ranked_history(resolved_at DESC);

-- Enable RLS for ranked tables
ALTER TABLE player_elo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read player_elo" ON player_elo FOR SELECT USING (true);
CREATE POLICY "Allow public insert player_elo" ON player_elo FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update player_elo" ON player_elo FOR UPDATE USING (true);

ALTER TABLE ranked_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read ranked_queue" ON ranked_queue FOR SELECT USING (true);
CREATE POLICY "Allow public insert ranked_queue" ON ranked_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update ranked_queue" ON ranked_queue FOR UPDATE USING (true);

ALTER TABLE ranked_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read ranked_history" ON ranked_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert ranked_history" ON ranked_history FOR INSERT WITH CHECK (true);

-- =====================================================
-- PLAYER PRESENCE TRACKING (Online Player Count)
-- =====================================================

-- Track player presence via heartbeat pings
CREATE TABLE player_presence (
    id SERIAL PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    player_name TEXT,
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_player_presence_last_ping ON player_presence(last_ping);
CREATE INDEX idx_player_presence_session ON player_presence(session_id);

-- Enable RLS for presence table
ALTER TABLE player_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read player_presence" ON player_presence FOR SELECT USING (true);
CREATE POLICY "Allow public insert player_presence" ON player_presence FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update player_presence" ON player_presence FOR UPDATE USING (true);
CREATE POLICY "Allow public delete player_presence" ON player_presence FOR DELETE USING (true);
