// Renders a JSON-LD block. `<` is escaped so a string value can never close the script tag.
export function JsonLd({ data }: Readonly<{ data: Record<string, unknown> }>) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll('<', String.raw`<`) }}
    />
  )
}
