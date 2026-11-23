/** Renders JSON-LD for crawlers; data is assembled server-side only. */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
  <>
    {items.map((block, i) => (
      <script
        key={i}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(block) }}
      />
    ))}
  </>
  );
}