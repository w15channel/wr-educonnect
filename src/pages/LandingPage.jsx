import LandingNav from '../components/landing/LandingNav';
import LandingHero from '../components/landing/LandingHero';
import LandingCourses from '../components/landing/LandingCourses';
import LandingProfessor from '../components/landing/LandingProfessor';
import LandingTestimonials from '../components/landing/LandingTestimonials';
import LandingCerts from '../components/landing/LandingCerts';
import LandingFooter from '../components/landing/LandingFooter';

export default function LandingPage({ onLogin }) {
  const scrollToCourses = () => {
    document.getElementById('cursos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#111827]">
      <LandingNav onLogin={onLogin} />
      <LandingHero onScrollToCourses={scrollToCourses} />
      <LandingCourses />
      <LandingProfessor />
      <LandingTestimonials />
      <LandingCerts />
      <LandingFooter onLogin={onLogin} />
    </div>
  );
}