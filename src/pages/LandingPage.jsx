import HeroSection from '../components/landing/HeroSection';
import CertificacoesSection from '../components/landing/CertificacoesSection';
import CursosSection from '../components/landing/CursosSection';
import DepoimentosSection from '../components/landing/DepoimentosSection';
import VendasSection from '../components/landing/VendasSection';
import FooterSection from '../components/landing/FooterSection';

export default function LandingPage({ onLogin }) {
  return (
    <div className="min-h-screen bg-[#111827]">
      <HeroSection onLogin={onLogin} />
      <CertificacoesSection />

      {/* Cursos + Depoimentos — two column */}
      <section className="bg-[#111827] py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <CursosSection />
            <DepoimentosSection />
          </div>
        </div>
      </section>

      <VendasSection />
      <FooterSection />
    </div>
  );
}