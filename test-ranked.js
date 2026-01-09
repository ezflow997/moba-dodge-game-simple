// Test script for ranked tournament system
// Run with: node test-ranked.js

const API_BASE = 'https://moba-dodge-simple.vercel.app/api';

// Test configuration
const TEST_PLAYERS = [
    { name: 'TestPlayer1', password: 'test1234', scores: [5000, 6000, 7500] },
    { name: 'TestPlayer2', password: 'test1234', scores: [4500, 5500] },
    { name: 'TestPlayer3', password: 'test1234', scores: [8000] },
    { name: 'TestPlayer4', password: 'test1234', scores: [3000, 4000, 5000] },
    { name: 'TestPlayer5', password: 'test1234', scores: [6500] },
    { name: 'TestPlayer6', password: 'test1234', scores: [2000] },
    { name: 'TestPlayer7', password: 'test1234', scores: [9000, 9500] },
    { name: 'TestPlayer8', password: 'test1234', scores: [1500] },
    { name: 'TestPlayer9', password: 'test1234', scores: [7000] },
    { name: 'TestPlayer10', password: 'test1234', scores: [5500] },
];

async function checkPlayerExists(playerName) {
    try {
        const response = await fetch(`${API_BASE}/check-player`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName })
        });
        const data = await response.json();
        return data.exists;
    } catch (error) {
        console.error(`Error checking player ${playerName}:`, error.message);
        return false;
    }
}

async function registerPlayer(playerName, password) {
    try {
        // Submit a score with the password to register the player
        const response = await fetch(`${API_BASE}/submit-score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerName,
                password,
                difficulty: 'EASY',
                score: 100,
                kills: 1,
                bestStreak: 1
            })
        });
        const data = await response.json();
        if (data.error) {
            console.error(`Failed to register ${playerName}:`, data.error);
            return false;
        }
        console.log(`  Registered ${playerName}`);
        return true;
    } catch (error) {
        console.error(`Error registering ${playerName}:`, error.message);
        return false;
    }
}

async function getRankedStatus(playerName = null) {
    try {
        let url = `${API_BASE}/ranked-status`;
        if (playerName) {
            url += `?playerName=${encodeURIComponent(playerName)}`;
        }
        const response = await fetch(url);
        return await response.json();
    } catch (error) {
        console.error('Error getting ranked status:', error.message);
        return null;
    }
}

async function submitRankedScore(playerName, password, score) {
    try {
        const response = await fetch(`${API_BASE}/ranked-submit`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                playerName,
                password,
                score,
                kills: Math.floor(score / 500),
                bestStreak: Math.floor(score / 1000)
            })
        });
        return await response.json();
    } catch (error) {
        console.error(`Error submitting ranked score for ${playerName}:`, error.message);
        return { error: error.message };
    }
}

async function getRankedLeaderboard() {
    try {
        const response = await fetch(`${API_BASE}/ranked-leaderboard?limit=20`);
        return await response.json();
    } catch (error) {
        console.error('Error getting ranked leaderboard:', error.message);
        return { entries: [] };
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
    console.log('='.repeat(60));
    console.log('RANKED TOURNAMENT SYSTEM TEST');
    console.log('='.repeat(60));
    console.log('');

    // Step 1: Check initial queue status
    console.log('1. Checking initial queue status...');
    const initialStatus = await getRankedStatus();
    console.log(`   Queue size: ${initialStatus.queueSize} unique players`);
    console.log(`   Total entries: ${initialStatus.totalEntries || 'N/A'}`);
    console.log(`   Players needed: ${initialStatus.playersNeeded}`);
    console.log('');

    // Step 2: Register test players if needed
    console.log('2. Checking/registering test players...');
    for (const player of TEST_PLAYERS) {
        const exists = await checkPlayerExists(player.name);
        if (!exists) {
            await registerPlayer(player.name, player.password);
        } else {
            console.log(`  ${player.name} already exists`);
        }
        await sleep(200); // Rate limiting
    }
    console.log('');

    // Step 3: Submit ranked scores
    console.log('3. Submitting ranked scores...');
    let tournamentResolved = false;
    let tournamentResults = null;

    for (const player of TEST_PLAYERS) {
        console.log(`\n   --- ${player.name} ---`);

        // Check player's current status
        const status = await getRankedStatus(player.name);
        console.log(`   Current: ${status.attemptsUsed || 0}/${status.maxAttempts || 5} attempts, Best: ${status.bestScore || 'none'}`);

        // Submit each score for this player
        for (const score of player.scores) {
            if (tournamentResolved) {
                console.log(`   Skipping (tournament already resolved)`);
                break;
            }

            console.log(`   Submitting score: ${score}...`);
            const result = await submitRankedScore(player.name, player.password, score);

            if (result.error) {
                console.log(`   ERROR: ${result.error}`);
                if (result.attemptsUsed !== undefined) {
                    console.log(`   (Attempts: ${result.attemptsUsed}/${result.maxAttempts})`);
                }
            } else if (result.tournamentResolved) {
                console.log(`   TOURNAMENT RESOLVED!`);
                tournamentResolved = true;
                tournamentResults = result;
            } else {
                console.log(`   Queued! Attempts: ${result.attemptsUsed}/${result.maxAttempts}, Best: ${result.bestScore}`);
                console.log(`   Queue: ${result.uniquePlayers}/10 players, need ${result.playersNeeded} more`);
            }

            await sleep(300); // Rate limiting
        }
    }
    console.log('');

    // Step 4: Display tournament results
    if (tournamentResolved && tournamentResults) {
        console.log('4. TOURNAMENT RESULTS');
        console.log('='.repeat(60));
        console.log(`   Tournament ID: ${tournamentResults.tournamentId}`);
        console.log(`   Total Players: ${tournamentResults.totalPlayers}`);
        console.log('');
        console.log('   PLACEMENTS:');
        console.log('   ' + '-'.repeat(55));
        console.log('   Rank | Player          | Score    | ELO Change');
        console.log('   ' + '-'.repeat(55));

        for (const r of tournamentResults.allResults) {
            const eloStr = r.eloChange > 0 ? `+${r.eloChange}` : r.eloChange.toString();
            const eloColor = r.eloChange > 0 ? '(gain)' : r.eloChange < 0 ? '(loss)' : '     ';
            console.log(`   #${r.placement.toString().padStart(2)}  | ${r.playerName.padEnd(15)} | ${r.score.toString().padStart(8)} | ${eloStr.padStart(4)} ${eloColor}`);
        }
        console.log('   ' + '-'.repeat(55));
        console.log('');

        // Show your result if available
        if (tournamentResults.playerResult) {
            const pr = tournamentResults.playerResult;
            console.log(`   YOUR RESULT:`);
            console.log(`   Placement: #${pr.placement}`);
            console.log(`   Score: ${pr.score}`);
            console.log(`   ELO: ${pr.eloBefore} → ${pr.eloAfter} (${pr.eloChange > 0 ? '+' : ''}${pr.eloChange})`);
        }
    } else {
        console.log('4. Tournament not yet resolved');
        const finalStatus = await getRankedStatus();
        console.log(`   Queue: ${finalStatus.queueSize}/10 players`);
        console.log(`   Need ${finalStatus.playersNeeded} more players to resolve`);
    }
    console.log('');

    // Step 5: Show ELO leaderboard
    console.log('5. ELO LEADERBOARD');
    console.log('='.repeat(60));
    const leaderboard = await getRankedLeaderboard();
    if (leaderboard.entries && leaderboard.entries.length > 0) {
        console.log('   Rank | Player          | ELO  | Games');
        console.log('   ' + '-'.repeat(45));
        for (const entry of leaderboard.entries.slice(0, 15)) {
            const name = entry.player_name || entry.playerName || 'Unknown';
            const elo = entry.elo || 1000;
            const games = entry.games_played || entry.gamesPlayed || 0;
            const rank = entry.rank || '-';
            console.log(`   #${rank.toString().padStart(2)}  | ${name.padEnd(15)} | ${elo.toString().padStart(4)} | ${games}`);
        }
    } else {
        console.log('   No ELO records yet');
    }
    console.log('');
    console.log('='.repeat(60));
    console.log('TEST COMPLETE');
    console.log('='.repeat(60));
}

// Run the tests
runTests().catch(console.error);
