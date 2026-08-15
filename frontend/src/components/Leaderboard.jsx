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
  return <section className="leaderboard" aria-label="Top players leaderboard"><div className="leaderboard-heading"><div><p className="leaderboard-kicker">Community rankings</p><h2>Top Players</h2><span>See how you stack up against the best.</span></div><button className={`leaderboard-refresh ${status === 'loading' ? 'is-loading' : ''}`} onClick={loadLeaderboard} disabled={status === 'loading'}>↻ Refresh</button></div>{status === 'loading' && <p className="leaderboard-status">Loading leaderboard...</p>}{status === 'error' && <p className="leaderboard-status">Unable to load leaderboard. <button onClick={loadLeaderboard}>Try again</button></p>}{status === 'ready' && entries.length === 0 && <div className="leaderboard-empty"><span>✦</span><p>No players yet.</p><small>Play your first game to appear here!</small></div>}{status === 'ready' && entries.length > 0 && <div className="leaderboard-table-wrap"><div className="leaderboard-table" role="table" aria-label="Top ten players"><div className="leaderboard-row leaderboard-header" role="row"><span role="columnheader">Rank</span><span role="columnheader">Player</span><span role="columnheader">Games</span><span role="columnheader">Avg score</span><span role="columnheader">Accuracy</span></div>{entries.map((entry, index) => { const rank = entry.rank ?? index + 1; const current = isCurrent(entry.player_name); return <div key={`${rank}-${entry.player_name}`} className={`leaderboard-row ${current ? 'current-player' : ''}`} role="row"><span role="cell" className="rank-cell">{rank <= 3 ? <><b>{medals[rank - 1]}</b>{rank}</> : `#${rank}`}</span><span role="cell" className="player-cell"><PlayerAvatar name={entry.player_name} rank={rank} /><strong>{entry.player_name}</strong>{current && <em>You</em>}</span><span role="cell" className="games-cell">{entry.games_played}</span><span role="cell" className="score-cell">{entry.average_score}</span><span role="cell"><small className="accuracy-pill">{entry.average_accuracy}%</small></span></div>; })}</div></div>}</section>;
}
