import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import './leaderboard.css';

const rankLabel = (rank) => ({ 1: '🥇', 2: '🥈', 3: '🥉' }[rank] || rank);

export default function Leaderboard({ currentPlayer, limit = 10 }) {
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState('loading');
  const loadLeaderboard = async () => { setStatus('loading'); try { const data = await api.getLeaderboard(limit); setEntries(data.scores || []); setStatus('ready'); } catch { setStatus('error'); } };
  useEffect(() => { loadLeaderboard(); }, [limit]);
  return <section className="leaderboard"><div className="leaderboard-heading"><h3>🏆 Top 10 Players</h3><button className="leaderboard-refresh" onClick={loadLeaderboard} disabled={status === 'loading'}>Refresh</button></div>{status === 'loading' && <p className="leaderboard-status">Loading leaderboard...</p>}{status === 'error' && <p className="leaderboard-status">Unable to load leaderboard. <button onClick={loadLeaderboard}>Retry</button></p>}{status === 'ready' && entries.length === 0 && <p className="leaderboard-status">No players yet. Play your first game to appear here!</p>}{status === 'ready' && entries.length > 0 && <div className="leaderboard-table"><div className="leaderboard-row leaderboard-header"><span>Rank</span><span>Player</span><span>Games</span><span>Avg</span><span>Accuracy</span></div>{entries.map((entry) => <div key={`${entry.rank}-${entry.player_name}`} className={`leaderboard-row ${entry.player_name.toLowerCase() === (currentPlayer || '').trim().toLowerCase() ? 'current-player' : ''}`}><span>{rankLabel(entry.rank)}</span><span>{entry.player_name}</span><span>{entry.games_played}</span><span>{entry.average_score}</span><span>{entry.average_accuracy}%</span></div>)}</div>}</section>;
}
