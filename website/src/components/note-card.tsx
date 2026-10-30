import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";

// Een notitie heeft drie regels: waar je elkaar zag, een detail, en wat je
// nog moet doen.
const NOTE_STYLES = [
  { id: "where", dot: "bg-gold", text: "text-grey italic" },
  { id: "detail", dot: "bg-link-blue", text: "text-grey" },
  { id: "todo", dot: "bg-azure", text: "text-azure font-medium" },
];

/**
 * A fictional example note, shown on the homepage and on the landing pages.
 * The texts come from the `Examples` messages, so both places stay identical.
 */
export function NoteCard({
  situation,
  role,
  notes,
  findWith,
  query,
}: Readonly<{
  situation: string;
  role: string;
  notes: readonly string[];
  findWith: string;
  query: string;
}>) {
  return (
    <Card className="bg-white border border-azure/10 rounded-lg sm:rounded-2xl p-4 sm:p-8">
      <CardHeader className="mb-4 sm:mb-6 p-0">
        <h3 className="font-semibold text-azure text-sm sm:text-base">{situation}</h3>
        <p className="text-xs sm:text-sm text-grey">{role}</p>
      </CardHeader>

      <CardContent className="p-0">
        <div className="bg-background border border-gold/20 rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-sm space-y-3">
          {NOTE_STYLES.map((style, noteIndex) => (
            <div key={style.id} className="flex items-start gap-2">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1 ${style.dot}`}></div>
              <p className={`text-xs sm:text-sm ${style.text}`}>{notes[noteIndex]}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 sm:mt-4 flex items-center gap-2 text-xs sm:text-sm text-grey">
          <Search className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {findWith}{" "}
            <span className="font-medium text-azure">&ldquo;{query}&rdquo;</span>
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
