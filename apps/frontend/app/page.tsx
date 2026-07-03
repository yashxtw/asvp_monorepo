import Header from "@/components/landingPage/header";
import Hero from "@/components/landingPage/hero";
import DashboardPreview from "@/components/landingPage/DashboardPreview";
import PricingSection from "@/components/landingPage/SubscriptionPlans";
import Footer from "@/components/landingPage/Footer";
import BottomCTA from "@/components/landingPage/BottomCTA";
import PartnersSection from "@/components/landingPage/Partners";
import BenefitsSection from "@/components/landingPage/Benefits";
import HowItWorks from "@/components/landingPage/HowItWorks";
import Testimonials from "@/components/landingPage/Reviews";
import FAQ from "@/components/landingPage/FAQ";
import DemoSection from "@/components/landingPage/DemoVideo";

export default async function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <DashboardPreview />
        <PartnersSection />
        <BenefitsSection />
        <DemoSection />
        <HowItWorks />
        <PricingSection />
        <Testimonials />
        <FAQ />
        <BottomCTA />
      </main>
      <Footer />
    </>
  );
}
