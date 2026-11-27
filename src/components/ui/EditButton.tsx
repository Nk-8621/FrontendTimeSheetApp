import type { MouseEvent } from 'react';
import { Icon } from './Icon';
import styles from './EditButton.module.css';

interface EditButtonProps {
  /** What is being edited, e.g. "Edit project Website". Used as the tooltip
   * and the screen-reader label. */
  label: string;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  /** 'sm' for dense rows (task lines, module/task lists). */
  size?: 'md' | 'sm';
  className?: string;
  /** Defaults to the blue pencil. Other icons/tones are for the few
   * non-edit row actions shown the same way (Deactivate, Reactivate). */
  icon?: string;
  tone?: 'edit' | 'danger' | 'ok';
}

/** EDIT ACTION (Nov 2026): the one edit control used everywhere in the app -
 * a blue pencil icon, no box or text. */
export function EditButton({ label, onClick, disabled, size = 'md', className, icon = 'edit', tone = 'edit' }: EditButtonProps) {
  return (
    <button
      type="button"
      className={`${styles.edit} ${size === 'sm' ? styles.sm : ''} ${tone !== 'edit' ? styles[tone] : ''} ${className ?? ''}`}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      <Icon name={icon} />
    </button>
  );
}
