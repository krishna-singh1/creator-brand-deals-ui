/** Re-mounts on every navigation, giving each page a soft fade-and-rise entrance. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col animate-page-in">{children}</div>;
}
