/** Creator photo, or their initial on ink. */
export function CreatorAvatar({ name, url, size = "size-14 text-xl" }: { name: string; url?: string; size?: string }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" className={`${size} shrink-0 rounded-full object-cover ring-2 ring-gold/30`} />
  ) : (
    <span aria-hidden className={`${size} grid shrink-0 place-items-center rounded-full bg-ink font-display text-gold-soft`}>
      {name.charAt(0)}
    </span>
  );
}
