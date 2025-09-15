// src/components/AllConnectionsView.tsx
import { useState, useMemo } from 'react';
import styles from './AllConnectionsView.module.css';
import { useConnection } from '../context/ConnectionContext';

export function AllConnectionsView() {
  const { allConnections, selectConnection } = useConnection();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'withNotes' | 'recent'>('all');

  const filteredConnections = useMemo(() => {
    if (!allConnections) return [];

    let filtered = allConnections;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(conn => 
        conn.name.toLowerCase().includes(query) ||
        (conn.meetingPlace && conn.meetingPlace.toLowerCase().includes(query)) ||
        (conn.userCompanyAtTheTime && conn.userCompanyAtTheTime.toLowerCase().includes(query)) ||
        (conn.notes && conn.notes.toLowerCase().includes(query))
      );
    }

    // Apply category filter
    switch (filter) {
      case 'withNotes':
        filtered = filtered.filter(conn => conn.notes && conn.notes.trim().length > 0);
        break;
      case 'recent':
        // Sort by ID (assuming higher IDs are more recent) and take recent ones
        filtered = filtered
          .sort((a, b) => {
            const aId = parseInt(a.id || '0', 10);
            const bId = parseInt(b.id || '0', 10);
            return bId - aId;
          })
          .slice(0, 10);
        break;
      default:
        break;
    }

    return filtered;
  }, [allConnections, searchQuery, filter]);

  const getConnectionStats = () => {
    if (!allConnections) return { total: 0, withNotes: 0 };
    
    const total = allConnections.length;
    const withNotes = allConnections.filter(conn => conn.notes && conn.notes.trim().length > 0).length;
    
    return { total, withNotes };
  };

  const stats = getConnectionStats();

  if (!allConnections || allConnections.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Alle Connecties</h1>
          <p className={styles.subtitle}>Bekijk en beheer al je LinkedIn connecties</p>
        </div>
        <div className={styles.content}>
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>👥</div>
            <h3 className={styles.emptyTitle}>Nog geen connecties</h3>
            <p className={styles.emptyDescription}>
              Voeg je eerste LinkedIn connectie toe door op de "Voeg toe aan CRM" knop te klikken op een LinkedIn profiel.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.title}>Alle Connecties</h1>
            <p className={styles.subtitle}>Bekijk en beheer al je LinkedIn connecties</p>
          </div>
        </div>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Zoek in connecties..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.stats}>
          <div className={styles.stat}>
            <span>📊</span>
            <span>Totaal: <span className={styles.statValue}>{stats.total}</span></span>
          </div>
          <div className={styles.stat}>
            <span>📝</span>
            <span>Met notities: <span className={styles.statValue}>{stats.withNotes}</span></span>
          </div>
        </div>

        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${filter === 'all' ? styles.filterTabActive : ''}`}
            onClick={() => setFilter('all')}
          >
            Alle
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'withNotes' ? styles.filterTabActive : ''}`}
            onClick={() => setFilter('withNotes')}
          >
            Met notities
          </button>
          <button
            className={`${styles.filterTab} ${filter === 'recent' ? styles.filterTabActive : ''}`}
            onClick={() => setFilter('recent')}
          >
            Recent
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {filteredConnections.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔍</div>
            <h3 className={styles.emptyTitle}>Geen resultaten</h3>
            <p className={styles.emptyDescription}>
              {searchQuery 
                ? `Geen connecties gevonden voor "${searchQuery}"`
                : 'Geen connecties in deze categorie'
              }
            </p>
          </div>
        ) : (
          <div className={styles.connectionsList}>
            {filteredConnections.map((conn) => (
              <div 
                key={conn.id || conn.linkedInUrl} 
                className={styles.connectionItem}
                onClick={() => selectConnection(conn)}
              >
                <div className={styles.connectionHeader}>
                  <h3 className={styles.connectionName}>
                    {conn.name}
                    <span className={styles.badge}>✓</span>
                  </h3>
                  {conn.linkedInUrl && (
                    <button
                      title="Open LinkedIn-profiel"
                      className={styles.linkedinLink}
                      onClick={async (e) => {
                        e.stopPropagation();
                        try {
                          await chrome.tabs.update({ url: conn.linkedInUrl });
                        } catch (error) {
                          console.error('Failed to navigate to LinkedIn profile:', error);
                        }
                      }}
                    >
                      🔗 in
                    </button>
                  )}
                </div>

                <div className={styles.connectionDetails}>
                  {conn.meetingPlace && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailIcon}>📍</span>
                      <span className={styles.detailLabel}>Ontmoet op:</span>
                      <span className={styles.detailValue}>{conn.meetingPlace}</span>
                    </div>
                  )}

                  {conn.userCompanyAtTheTime && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailIcon}>🏢</span>
                      <span className={styles.detailLabel}>Mijn bedrijf:</span>
                      <span className={styles.detailValue}>{conn.userCompanyAtTheTime}</span>
                    </div>
                  )}

                  {conn.notes && (
                    <div className={styles.notesPreview}>
                      {conn.notes}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
