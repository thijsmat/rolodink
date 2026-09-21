import { cn } from "@/lib/utils";

/**
 * Huisstijl voor lange teksten. De kleuren komen uit het typography-thema in
 * tailwind.config.ts (azure koppen, grey body, link-blue links, gouden citaten), zodat
 * dark mode via de bestaande CSS-variabelen meeloopt.
 */
export const proseClassName =
  "prose prose-lg max-w-none " +
  "prose-headings:font-playfair prose-headings:font-semibold prose-headings:tracking-tight " +
  "prose-h2:mt-12 prose-h2:text-3xl prose-h3:text-2xl " +
  "prose-a:underline-offset-4 hover:prose-a:opacity-80 " +
  "prose-img:rounded-xl prose-img:border prose-img:border-azure/10 " +
  "prose-blockquote:font-playfair prose-blockquote:not-italic prose-blockquote:text-xl";

interface ProseProps {
  /** Reeds gesanitizede HTML (zie src/lib/cms.ts). Nooit ruwe gebruikersinvoer. */
  readonly html: string;
  readonly className?: string;
}

export function Prose({ html, className }: ProseProps) {
  return (
    <div
      className={cn(proseClassName, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
