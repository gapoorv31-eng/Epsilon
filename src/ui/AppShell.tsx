import { useState } from 'react';
import { algorithms } from '../algorithms/registry';
import AlgorithmPage from './AlgorithmPage';

/**
 * The generic app shell: a header, a sidebar listing every algorithm from the
 * registry, a main area showing the selected algorithm's page, and a course footer.
 */
export default function AppShell() {
  const [selectedId, setSelectedId] = useState(algorithms[0]?.id);
  const selected = algorithms.find((algorithm) => algorithm.id === selectedId);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">Epsilon</h1>
        <p className="app-tagline">Step-by-step simulations of Automata Theory algorithms</p>
      </header>

      <div className="app-body">
        <nav className="sidebar" aria-label="Algorithms">
          {algorithms.map((algorithm) => (
            <button
              key={algorithm.id}
              className={algorithm.id === selectedId ? 'sidebar-item active' : 'sidebar-item'}
              onClick={() => setSelectedId(algorithm.id)}
            >
              {algorithm.name}
            </button>
          ))}
        </nav>

        <main className="main">
          {/* key = id, so switching algorithms starts with a fresh page (no leftover result). */}
          {selected ? <AlgorithmPage key={selected.id} algorithm={selected} /> : <p>No algorithms registered.</p>}
        </main>
      </div>

      <footer className="app-footer">
        Epsilon · Automata Theory (CSET302)
      </footer>
    </div>
  );
}
