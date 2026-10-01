import { Button } from "@/components/ui/button";
import { storeUrl, type StorePlacement } from "@/lib/utils";

/**
 * The closing band with one button to the Chrome Web Store, used at the end of
 * /help, /how-it-works and the Over pages. The texts come from the page's own
 * translations; `placement` ends up in the link's utm_content.
 */
export function StoreCtaBand({
  title,
  description,
  button,
  placement,
}: Readonly<{
  title: string;
  description: string;
  button: string;
  placement: StorePlacement;
}>) {
  return (
    <section className="bg-azure/5">
      <div className="container mx-auto max-w-4xl py-16 text-center md:py-24">
        <h2 className="font-playfair text-3xl font-bold tracking-tight text-azure sm:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-lg leading-8 text-grey">{description}</p>
        <div className="mt-8">
          <Button asChild size="lg">
            <a href={storeUrl("chrome", placement)} target="_blank" rel="noreferrer">
              {button}
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
