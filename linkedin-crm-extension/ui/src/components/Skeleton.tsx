// src/components/Skeleton.tsx
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
}

export function Skeleton({ 
  width = '100%', 
  height = '1em', 
  borderRadius = 'var(--radius-sm)',
  className = '',
  variant = 'rectangular'
}: SkeletonProps) {
  const skeletonStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: variant === 'circular' ? '50%' : borderRadius,
  };

  return (
    <div 
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={skeletonStyle}
    />
  );
}

// Predefined skeleton components for common use cases
export function SkeletonText({ lines = 1, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton 
          key={index}
          variant="text" 
          width={index === lines - 1 ? '75%' : '100%'}
          className={index > 0 ? styles.skeletonLine : ''}
        />
      ))}
    </div>
  );
}

export function SkeletonConnectionItem({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.connectionSkeleton} ${className}`}>
      <div className={styles.connectionHeader}>
        <div className={styles.nameAndBadge}>
          <Skeleton width="60%" height="1.2em" className={styles.nameSkeleton} />
          <Skeleton width="20px" height="20px" variant="circular" />
        </div>
        <Skeleton width="40px" height="20px" />
      </div>
      <div className={styles.connectionDetails}>
        <div className={styles.detailRow}>
          <Skeleton width="16px" height="16px" variant="circular" />
          <Skeleton width="80px" height="14px" />
          <Skeleton width="40%" height="14px" />
        </div>
        <div className={styles.detailRow}>
          <Skeleton width="16px" height="16px" variant="circular" />
          <Skeleton width="100px" height="14px" />
          <Skeleton width="35%" height="14px" />
        </div>
        <div className={styles.notesSkeleton}>
          <SkeletonText lines={2} />
        </div>
      </div>
    </div>
  );
}

export function SkeletonForm({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.formSkeleton} ${className}`}>
      <div className={styles.formHeader}>
        <Skeleton width="50%" height="1.5em" />
        <Skeleton width="80%" height="1em" />
      </div>
      <div className={styles.formFields}>
        <div className={styles.fieldGroup}>
          <Skeleton width="60%" height="1em" />
          <Skeleton width="100%" height="2.5em" />
          <Skeleton width="90%" height="0.8em" />
        </div>
        <div className={styles.fieldGroup}>
          <Skeleton width="40%" height="1em" />
          <Skeleton width="100%" height="2.5em" />
          <Skeleton width="85%" height="0.8em" />
        </div>
        <div className={styles.fieldGroup}>
          <Skeleton width="20%" height="1em" />
          <Skeleton width="100%" height="4em" />
          <Skeleton width="15%" height="0.8em" />
        </div>
      </div>
      <div className={styles.formActions}>
        <Skeleton width="120px" height="2.5em" />
        <Skeleton width="80px" height="2.5em" />
      </div>
    </div>
  );
}
