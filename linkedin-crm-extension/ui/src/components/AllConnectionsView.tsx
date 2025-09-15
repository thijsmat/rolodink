// src/components/AllConnectionsView.tsx
import styles from '../App.module.css';
import { useConnection } from '../context/ConnectionContext';

export function AllConnectionsView() {
  const { allConnections, selectConnection } = useConnection();

  if (!allConnections || allConnections.length === 0) {
    return <p className={styles.empty}>Geen connecties gevonden.</p>;
  }

  return (
    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
      {allConnections.map((conn) => (
        <div key={conn.id || conn.linkedInUrl} className={styles.connectionItem}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => selectConnection(conn)}
              className={styles.button}
              style={{ padding: '6px 10px' }}
            >
              {conn.name}
            </button>
            {conn.linkedInUrl && (
              <a
                href={conn.linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open LinkedIn-profiel"
                style={{ color: 'var(--linkedin-blue)', textDecoration: 'none', fontSize: '14px' }}
              >
                in
              </a>
            )}
          </div>
          {conn.meetingPlace && <div>Ontmoet op: {conn.meetingPlace}</div>}
          {conn.notes && <div>Notities: {conn.notes}</div>}
        </div>
      ))}
    </div>
  );
}
