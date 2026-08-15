import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import './leaderboard.css';

const medals = ['🥇', '🥈', '🥉'];
const initials = (name = '') => name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';
function PlayerAvatar({ name, rank }) { return <span className={`player-avatar avatar-${rank || 0}`}>{initials(name)}</span>; }

export default function Leaderboard({ currentPlayer, limit = 10 }) {
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState('loading');
  const loadLeaderboard = async () => { setStatus('loading'); try { const data = await api.getLeaderboard(limit); setEntries(data.scores || []); setStatus('ready'); } catch { setStatus('error'); } };
  useEffect(() => { loadLeaderboard(); }, [limit]);
  const isCurrent = (name) => name.toLowerCase() === (currentPlayer || '').trim().toLowerCase();
  const podium = entries.slice(0, 3);
  const remaining = entries.slice(3);
  return <section className="leaderboard" aria-label="Top players leaderboard"><div className="leaderboard-heading"><div><p className="leaderboard-kicker">Community rankings</p><h2>Top Players</h2><span>See how you stack up against the best.</span></div><button className="leaderboard-refresh" onClick={loadLeaderboard} disabled={status === 'loading'}>↻ Refresh</button></div>{status === 'loading' && <p className="leaderboard-status">Loading leaderboard...</p>}{status === 'error' && <p className="leaderboard-status">Unable to load leaderboard. <button onClick={loadLeaderboard}>Try again</button></p>}{status === 'ready' && entries.length === 0 && <div className="leaderboard-empty"><span>✦</span><p>No players yet.</p><small>Play your first game to appear here!</small></div>}{status === 'ready' && entries.length > 0 && <><div className={`podium podium-${podium.length}`}>{podium.map((entry, index) => <article key={entry.player_name} className={`podium-card place-${index + 1} ${isCurrent(entry.player_name) ? 'current-player' : ''}`}><span className="podium-medal">{medals[index]}</span><PlayerAvatar name={entry.player_name} rank={index + 1} /><strong>{entry.player_name}</strong><span className="podium-score">{entry.average_score} avg</span><small>{entry.games_played} {entry.games_played === 1 ? 'game' : 'games'}</small>{isCurrent(entry.player_name) && <em>You</em>}</article>)}</div>{remaining.length > 0 && <div className="leaderboard-list"><div className="leaderboard-row leaderboard-header"><span>Rank</span><span>Player</span><span>Games</span><span>Avg score</span><span>Accuracy</span></div>{remaining.map((entry) => <div key={`${entry.rank}-${entry.player_name}`} className={`leaderboard-row ${isCurrent(entry.player_name) ? 'current-player' : ''}`}><span>#{entry.rank}</span><span className="player-cell"><PlayerAvatar name={entry.player_name} rank={entry.rank} />{entry.player_name}</span><span>{entry.games_played}</span><span>{entry.average_score}</span><span>{entry.average_accuracy}%</span></div>)}</div>}</>}</section>;
}
