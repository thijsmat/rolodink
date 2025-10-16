import React from 'react';
import { Button } from '@/components/ui/button';
import { Linkedin } from 'lucide-react';

const VintageHero = () => {
  return (
    <div className="relative min-h-screen bg-[#0f172a] overflow-hidden">
      {/* Paper texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />
      
      <div className="container mx-auto px-4 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[calc(100vh-6rem)]">
          {/* Left Content */}
          <div className="space-y-8 z-10">
            {/* Headline */}
            <h1 
              className="text-5xl md:text-6xl lg:text-7xl text-[#faf8f3] leading-tight"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              Professional Networking,
              <span className="block text-[#d4af37] mt-2">Reimagined</span>
            </h1>
            
            {/* Subheadline */}
            <p 
              className="text-lg md:text-xl text-[#faf8f3]/80 max-w-xl leading-relaxed"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Transform your traditional business card into a dynamic digital presence. 
              Connect seamlessly with LinkedIn and build meaningful professional relationships.
            </p>
            
            {/* CTA Button styled as business card */}
            <div className="pt-4">
              <div className="inline-block">
                <div className="relative group">
                  {/* Business card shadow effect */}
                  <div className="absolute inset-0 bg-[#d4af37] blur-xl opacity-20 group-hover:opacity-30 transition-opacity" />
                  
                  <Button
                    size="lg"
                    className="relative bg-[#d4af37] hover:bg-[#c4a137] text-[#0f172a] font-semibold px-8 py-6 text-lg shadow-2xl border-2 border-[#d4af37]/20 transition-all duration-300 group-hover:scale-105"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    <span className="flex items-center gap-3">
                      Get Your Digital Card
                      <Linkedin className="w-5 h-5" />
                    </span>
                  </Button>
                  
                  {/* Decorative corner elements */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#d4af37]/40" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-[#d4af37]/40" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-[#d4af37]/40" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#d4af37]/40" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Visual - Business Card to LinkedIn */}
          <div className="relative z-10 flex items-center justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              {/* Business Card */}
              <div className="relative transform hover:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 bg-[#d4af37] blur-2xl opacity-20" />
                
                <div className="relative bg-[#faf8f3] rounded-lg shadow-2xl p-8 border-2 border-[#d4af37]/30">
                  {/* Card texture */}
                  <div 
                    className="absolute inset-0 opacity-[0.05] rounded-lg"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise2'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' /%3E%3C/filter%3E%3Crect width='60' height='60' filter='url(%23noise2)' opacity='0.4'/%3E%3C/svg%3E")`,
                    }}
                  />
                  
                  <div className="relative space-y-6">
                    {/* Logo/Brand */}
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-[#0f172a] rounded-full flex items-center justify-center">
                        <span className="text-[#d4af37] font-bold text-xl" style={{ fontFamily: 'Playfair Display, serif' }}>R</span>
                      </div>
                      <h3 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Playfair Display, serif' }}>
                        Rolodink
                      </h3>
                    </div>
                    
                    {/* Card details */}
                    <div className="space-y-2 pt-4 border-t border-[#0f172a]/10">
                      <p className="text-[#0f172a] font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>
                        John Anderson
                      </p>
                      <p className="text-[#0f172a]/70 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Senior Product Manager
                      </p>
                      <p className="text-[#0f172a]/60 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
                        john.anderson@company.com
                      </p>
                    </div>
                    
                    {/* LinkedIn connection indicator */}
                    <div className="flex items-center gap-2 pt-4">
                      <div className="flex-1 h-px bg-gradient-to-r from-[#0f172a]/20 to-transparent" />
                      <Linkedin className="w-6 h-6 text-[#0077b5]" />
                      <div className="flex-1 h-px bg-gradient-to-l from-[#0f172a]/20 to-transparent" />
                    </div>
                  </div>
                  
                  {/* Decorative corners */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#d4af37]" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#d4af37]" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#d4af37]" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#d4af37]" />
                </div>
              </div>
              
              {/* Animated arrow/connection line */}
              <div className="absolute -right-8 top-1/2 -translate-y-1/2 hidden xl:block">
                <div className="flex items-center gap-2 animate-pulse">
                  <div className="w-12 h-px bg-gradient-to-r from-[#d4af37] to-transparent" />
                  <div className="w-2 h-2 bg-[#d4af37] rounded-full" />
                </div>
              </div>
              
              {/* LinkedIn badge */}
              <div className="absolute -bottom-6 -right-6 bg-[#0077b5] rounded-full p-4 shadow-xl border-4 border-[#0f172a] animate-bounce">
                <Linkedin className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-32 h-32 border border-[#d4af37]/10 rounded-full" />
      <div className="absolute bottom-20 right-10 w-48 h-48 border border-[#d4af37]/10 rounded-full" />
      <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-[#d4af37]/30 rounded-full" />
      <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-[#d4af37]/30 rounded-full" />
    </div>
  );
};

export default VintageHero;
