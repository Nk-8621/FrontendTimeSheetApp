import { useState } from 'react';

interface AvatarProps {
  employeeCode: string;
  initials: string;
  name?: string;
  className?: string;
}

/** Circular profile picture. Looks for /avatars/<employeeCode>.jpg (files in
 * public/avatars); falls back to the employee's initials when there is no
 * photo for them. */
export function Avatar({ employeeCode, initials, name, className }: AvatarProps) {
  const [failed, setFailed] = useState<string | null>(null);
  const src = employeeCode ? `/avatars/${encodeURIComponent(employeeCode)}.jpg` : '';
  const showPhoto = src && failed !== src;

  return (
    <span className={className}>
      {showPhoto ? (
        <img
          src={src}
          alt={name ? `${name} profile photo` : ''}
          onError={() => setFailed(src)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
        />
      ) : (
        initials
      )}
    </span>
  );
}
