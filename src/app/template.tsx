/**
 * Re-mounts on every navigation, giving each page a soft fade. Opacity only: a transform here (even the identity
 * matrix an animation leaves behind) would make this div the containing block for every `position: fixed` child,
 * pinning the tab bar, notification sheet and profile panel to the page instead of the screen. Pages add their own
 * rise (`<main className="animate-page-in">` in AppShell).
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col animate-fade-in">{children}</div>;
}
