import VintageHero from '@/components/vintage-hero'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { PageSection } from '@/components/layout/page-section'
import { PageContainer } from '@/components/layout/page-container'
import { PageHeader } from '@/components/layout/page-header'

export default function VintageDemoPage() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader />
      
      <main className="flex-1">
        <VintageHero />
        
        {/* Additional demo content */}
        <PageSection background="white">
          <PageContainer>
            <PageHeader>
              <h2 className="text-4xl font-bold text-gray-900">
                Vintage Hero Component Demo
              </h2>
              <p className="text-lg text-gray-600 max-w-prose mx-auto">
                This is a demonstration of the VintageHero component integrated into your Rolodink website.
                The component features a dark vintage theme with business card aesthetics and LinkedIn integration.
              </p>
            </PageHeader>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Features Included:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Enhanced button component with improved styling</li>
                  <li>• Tailwind v4 CSS variables and color system</li>
                  <li>• Vintage business card design elements</li>
                  <li>• LinkedIn integration with animated elements</li>
                  <li>• Responsive design for all screen sizes</li>
                  <li>• Custom paper texture overlays</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4">Technical Details:</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• React with TypeScript</li>
                  <li>• Tailwind CSS v4 with OKLCH colors</li>
                  <li>• Lucide React icons</li>
                  <li>• Class Variance Authority for variants</li>
                  <li>• Radix UI primitives</li>
                  <li>• Modern CSS custom properties</li>
                </ul>
              </div>
            </div>
          </PageContainer>
        </PageSection>
      </main>
      
      <SiteFooter />
    </div>
  )
}
