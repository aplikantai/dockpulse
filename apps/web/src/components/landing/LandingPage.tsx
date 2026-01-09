'use client';

import Header from './Header';
import Hero from './Hero';
import OnboardingForm from './OnboardingForm';
import Features from './Features';
import Pricing from './Pricing';
import FAQ from './FAQ';
import Footer from './Footer';

export function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen gradient-mesh">
      <Header />
      <main className="flex-grow">
        <Hero />
        <OnboardingForm />
        <Features />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}

export default LandingPage;
