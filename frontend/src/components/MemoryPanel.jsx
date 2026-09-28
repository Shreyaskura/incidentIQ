import React, { useState, useEffect } from 'react';
import { Search, Brain, X } from 'lucide-react';
import { fetchMemory, searchMemory } from '../api/incidentApi';

function CategoryBadge({ cat }) {
  const map = {
    'Past Incidents':        { label: 'Incident',   cls: 'mem-cat-incident' },
    'Previous Incidents':    { label: 'Incident',   cls: 'mem-cat-incident' },
    'Root Causes':           { label: 'Root Cause', cls: 'mem-cat-root' },
    'Successful Fixes':      { label: 'Resolved',   cls: 'mem-cat-fix' },
    'Successful Resolutions':{ label: 'Resolved',   cls: 'mem-cat-fix' },
    'Failed Fixes':          { label: 'Failed Fix', cls: 'mem-cat-failed' },
    'Failed Resolutions':    { label: 'Failed Fix', cls: 'mem-cat-failed' },
    'Deployment Problems':   { label: 'Deployment', cls: 'mem-cat-deploy' },
    'Deployment Lessons':    { label: 'Deployment', cls: 'mem-cat-deploy' },
  };
  const info = map[cat] || { label: cat || 'Memory', cls: 'mem-cat-incident' };
  return <span className={`mem-category ${info.cls}`}>{info.label}</span>;
}

const QUICK_FILTERS = ['All', 'Root Causes', 'Past Incidents', 'Resolutions', 'Deployments'];

export default function MemoryPanel() {
  const [memories, setMemories]   = useState([]);
  const [stats, setStats]         = useState({ total: 0, bank_id: 'incidentiq', connected: false });
  const [query, setQuery]         = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadMemories();
  }, []);

  async function loadMemories() {
    setIsLoading(true);
    try {
      const data = await fetchMemory(100);
      setStats({
        total: data.total || 0,
        bank_id: data.bank_id || 'incidentiq',
        connected: data.hindsight_connected || false,
      });
      setMemories(data.memories || data.items || []);
    } catch (err) {
      console.error('Memory load error:', err);
      setMemories([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(e) {
    if (e) e.preventDefault();
    if (!query.trim()) { loadMemories(); return; }
    setIsSearching(true);
    try {
      const data = await searchMemory(query);
      setMemories(data.results || []);
    } catch (err) {
      console.error('Memory search error:', err);
    } finally {
      setIsSearching(false);
    }
  }

  // Filter memories by category chip
  const filteredMemories = memories.filter((m) => {
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'Root Causes') return m.category?.toLowerCase().includes('cause');
    if (selectedFilter === 'Past Incidents') return m.category?.toLowerCase().includes('incident');
    if (selectedFilter === 'Resolutions') return m.category?.toLowerCase().includes('fix') || m.category?.toLowerCase().includes('resolution');
    if (selectedFilter === 'Deployments') return m.category?.toLowerCase().includes('deploy');
    return true;
  });

  const rows = filteredMemories.slice(0, 60);

  return (
    <div className="memory-page">
      {/* Fluid Search & Category Bar */}
      <div className="memory-search-bar">
        <form onSubmit={handleSearch} className="memory-search-form">
          <div className="memory-search-wrap">
            <Search size={13} />
            <input
              className="memory-search-input"
              type="text"
              placeholder="Search historical post-mortems, root causes, remediation playbooks..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="memory-search-btn" disabled={isSearching}>
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          {query && (
            <button
              type="button"
              className="memory-search-btn"
              onClick={() => { setQuery(''); loadMemories(); }}
              title="Clear search"
            >
              <X size={12} style={{ display: 'inline', verticalAlign: 'middle' }} />
              Clear
            </button>
          )}
        </form>

        {/* Quick Filter Chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {QUICK_FILTERS.map((cat) => (
            <button
              key={cat}
              className={`filter-btn${selectedFilter === cat ? ' active' : ''}`}
              onClick={() => setSelectedFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div className="memory-stats-bar">
        <div className="memory-stat">
          <Brain size={13} style={{ color: 'var(--blue)' }} />
          <span className="memory-stat-value">{stats.total}</span>
          <span>memories indexed</span>
        </div>
        <div className="memory-stat">
          <span>Bank:</span>
          <span className="memory-stat-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blue)' }}>
            {stats.bank_id}
          </span>
        </div>
        <div className="memory-stat">
          <span
            style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: stats.connected ? 'var(--green)' : 'var(--red)',
            }}
          />
          <span style={{ color: stats.connected ? 'var(--green)' : 'var(--red)' }}>
            {stats.connected ? 'Connected' : 'Offline / Standby'}
          </span>
        </div>
        {query && (
          <div className="memory-stat">
            <span>{rows.length} matches for</span>
            <span className="memory-stat-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>"{query}"</span>
          </div>
        )}
      </div>

      {/* Table Section */}
      <div className="memory-table-wrap">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Querying Hindsight persistent memory bank...</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="empty-state">
            <p>
              {query
                ? `No memories matched "${query}". Try different search terms.`
                : 'No memories found for this filter category.'}
            </p>
          </div>
        ) : (
          <table className="memory-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Incident</th>
                <th>Title / Memory Summary</th>
                <th style={{ width: '130px' }}>Category</th>
                <th style={{ width: '190px' }}>Service</th>
                <th style={{ width: '120px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((m, i) => (
                <tr key={m.id || i}>
                  <td>
                    <span className="mem-incident-id">
                      {m.incident_id || m.document_id || '—'}
                    </span>
                  </td>
                  <td>
                    <div className="mem-title">{m.title || 'Memory record'}</div>
                    <div className="mem-text-clip">{m.text || m.content || ''}</div>
                  </td>
                  <td>
                    <CategoryBadge cat={m.category} />
                  </td>
                  <td>
                    {m.service || (m.tags && m.tags[0]) ? (
                      <span className="mem-service">
                        {m.service || m.tags[0] || '—'}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="mem-date">
                    {m.date || (m.created_at ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
