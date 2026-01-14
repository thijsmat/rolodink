// src/components/AllConnectionsView.tsx
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import styles from './AllConnectionsView.module.css';
import { useConnection } from '../context/ConnectionContext';
import { useExtensionTranslation } from '../hooks/useExtensionTranslation';

export function AllConnectionsView() {
  const { t } = useExtensionTranslation();
  const { allConnections, selectConnection, isLoading, showSettingsView } = useConnection();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'withNotes' | 'recent'>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounce search query for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard shortcuts for search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+F or Cmd+F to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      // Escape to clear search
      if (event.key === 'Escape' && searchQuery) {
        event.preventDefault();
        setSearchQuery('');
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  // Helper function to highlight search terms
  const highlightText = useCallback((text: string, query: string) => {
    if (!query.trim() || !text) return text;

    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    const parts = text.split(regex);

    // Check if any part matches the query (case-insensitive)
    const isMatch = (part: string) => part.toLowerCase() === query.toLowerCase();

    return parts.map((part, index) =>
      isMatch(part) ? (
        <mark key={index} className={styles.searchHighlight}>{part}</mark>
      ) : part
    );
  }, []);

  const filteredConnections = useMemo(() => {
    if (!allConnections) return [];

    let filtered = [...allConnections];

    // Apply search filter with debounced query
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
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
      case 'recent': {
        // Sort by ID (assuming higher IDs are more recent) and take recent ones
        const toNumericId = (value: string | undefined) => {
          const parsed = Number(value);
          return Number.isFinite(parsed) ? parsed : 0;
        };
        filtered = filtered
          .sort((a, b) => toNumericId(b.id) - toNumericId(a.id))
          .slice(0, 10);
        break;
      }
      default:
        break;
    }

    return filtered;
  }, [allConnections, debouncedSearchQuery, filter]);

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
          {/* Title removed to avoid duplication; handled by parent */}
          <div className={styles.searchContainer}>
            <div className={styles.searchInputWrapper}>
              <input
                ref={searchInputRef}
                type="text"
                placeholder={t('search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className={styles.clearSearchButton}
                  title={t('clear_search_title')}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>👥</div>
            <h3 className={styles.emptyTitle}>{t('empty_list_title')}</h3>
            <p className={styles.emptyDescription}>
              {t('empty_list_desc')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.searchContainer}>
          <div className={styles.searchInputWrapper}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className={styles.clearSearchButton}
                title={t('clear_search_title')}
              >
                ✕
              </button>
            )}
          </div>
          {debouncedSearchQuery && (
            <div className={styles.searchInfo}>
              {t('search_results_count', [filteredConnections.length.toString(), debouncedSearchQuery])}
            </div>
          )}
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <span>📊</span>
              <span>{stats.total}</span>
            </div>
            <div className={styles.stat}>
              <span>📝</span>
              <span>{stats.withNotes}</span>
            </div>
          </div>

          <div className={styles.controlsRight}>
            <div className={styles.filterTabs}>
              <button
                className={`${styles.filterTab} ${filter === 'all' ? styles.filterTabActive : ''}`}
                onClick={() => setFilter('all')}
              >
                {t('filter_all')}
              </button>
              <button
                className={`${styles.filterTab} ${filter === 'withNotes' ? styles.filterTabActive : ''}`}
                onClick={() => setFilter('withNotes')}
              >
                {t('filter_with_notes')}
              </button>
              <button
                className={`${styles.filterTab} ${filter === 'recent' ? styles.filterTabActive : ''}`}
                onClick={() => setFilter('recent')}
              >
                {t('filter_recent')}
              </button>
            </div>

            <button
              onClick={showSettingsView}
              className={styles.settingsButton}
              title={t('open_settings_title')}
            >
              ⚙️
            </button>
          </div>
        </div>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>{t('loading_connections')}</div>
        ) : filteredConnections.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔍</div>
            <h3 className={styles.emptyTitle}>{t('empty_search_title')}</h3>
            <p className={styles.emptyDescription}>
              {debouncedSearchQuery
                ? t('empty_search_desc_query', [debouncedSearchQuery])
                : t('empty_search_desc_category')
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
                    {highlightText(conn.name, debouncedSearchQuery)}
                    <span className={styles.badge}>✓</span>
                  </h3>
                  {conn.linkedInUrl && (
                    <button
                      title={t('open_linkedin_profile_title')}
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
                      <span className={styles.detailLabel}>{t('label_met_at')}</span>
                      <span className={styles.detailValue}>{highlightText(conn.meetingPlace, debouncedSearchQuery)}</span>
                    </div>
                  )}

                  {conn.userCompanyAtTheTime && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailIcon}>🏢</span>
                      <span className={styles.detailLabel}>{t('label_my_company')}</span>
                      <span className={styles.detailValue}>{highlightText(conn.userCompanyAtTheTime, debouncedSearchQuery)}</span>
                    </div>
                  )}

                  {conn.notes && (
                    <div className={styles.notesPreview}>
                      {highlightText(conn.notes, debouncedSearchQuery)}
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
