/** Carbynetech logo that follows the display mode: the original logo in the
 * light theme, the official dark-theme logo in the dark theme. Both images
 * are the same size, and the swap is pure CSS (see .brand-logo rules in
 * global.css), so switching themes doesn't flicker or shift the layout. */
export function BrandLogo({ className }: { className?: string }) {
  const alt = 'Carbynetech - Data to decisions made simpler';
  return (
    <span className={`brand-logo ${className ?? ''}`}>
      <img className="brand-logo-light" src="/carbynetech-logo.png" alt={alt} />
      <img className="brand-logo-dark" src="/carbynetech-logo-dark.png" alt={alt} />
    </span>
  );
}
