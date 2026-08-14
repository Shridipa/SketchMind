import React, { useState } from 'react';
import './setup.css';

export default function Setup({ initialName, onStart, onBack }) {
  const [name, setName] = useState(initialName);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }
    onStart(name.trim());
  };

  return (
    <div className="setup-screen">
      <div className="setup-container">
        <h1>SketchMind</h1>
        <h2>Ready to sketch?</h2>

        <form onSubmit={handleSubmit} className="setup-form">
          <div className="form-group">
            <label htmlFor="name">Your Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name..."
              autoFocus
            />
          </div>

          <p className="setup-note">You will draw all 20 objects. You have 30 seconds for each sketch.</p>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onBack}
            >
              Back
            </button>
            <button type="submit" className="btn btn-primary">
              Start Game
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
