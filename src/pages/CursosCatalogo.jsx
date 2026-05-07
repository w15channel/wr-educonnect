import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Lock, CheckCircle, ExternalLink, BookOpen, Clock, Star, Sparkles, ChevronRight, MessageCircle, GraduationCap, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Fallback courses if none created in DB yet
const FALLBACK_COURSES = [
  {
    id: 'flagship',
    name: 'Profissionalizante de Prática da Terapia Cognitivo Comportamental',
    short_description: 'Seu curso atual — formação completa com experiência terapêutica prática ao longo da jornada.',
    duration: '6 meses',
    workload: '120 horas',
    modules_count: 12,
    status: 'active',
    is_flagship: true,
    highlight_color: '#5b5ef4',
    price: null,
    order: 1,
  },
  {
    id: 'sexologia',
    name: 'Profissionalizante de Sexologia Sistêmica',
    short_description: 'Formação aprofundada em Sexologia com abordagem sistêmica, integrando aspectos emocionais, relacionais e culturais da sexualidade humana.',
    duration: '4 meses',
    workload: '80 horas',
    modules_count: 8,
    status: 'locked',
    is_flagship: false,
    highlight_color: '#e879a0',
    price: null,
    order: 2,
  },
  {
    id: 'psicanalitico',
    name: 'Profissionalizante para Terapeutas do Método Psicanalítico',
    short_description: 'Imersão nas bases do método psicanalítico aplicado à prática terapêutica contemporânea, com foco em escuta clínica e intervenções.',
    duration: '5 meses',
    workload: '100 horas',
    modules_count: 10,
    status: 'coming_soon',
    is_flagship: false,
    highlight_color: '#8b5cf6',
    price: null,
    order: 3,
  },
];

const WHATSAPP_LINK = 'https://wa.me/5541999999999?text=Olá! Tenho interesse em adquirir um curso da WR-EDU.';

const courseColors = {
  '#5b5ef4': { bg: 'from-[#5b5ef4]/20 to-[#5b5ef4]/5', border: 'border-[#5b5ef4]/30', badge: 'bg-[#5b5ef4]/20 text-[#9b9ef7] border-[#5b5ef4]/30', glow: 'shadow-[#5b5ef4]/20' },
  '#e879a0': { bg: 'from-[#e879a0]/20 to-[#e879a0]/5', border: 'border-[#e879a0]/30', badge: 'bg-[#e879a0]/20 text-[#f0a0c0] border-[#e879a0]/30', glow: 'shadow-[#e879a0]/20' },
  '#8b5cf6': { bg: 'from-[#8b5cf6]/20 to-[#8b5cf6]/5', border: 'border-[#8b5cf6]/30', badge: 'bg-[#8b5cf6]/20 text-[#c4b5fd] border-[#8b5cf6]/30', glow: 'shadow-[#8b5cf6]/20' },
};

const defaultColor = { bg: 'from-white/10 to-white/3', border: 'border-white/15', badge: 'bg-white/10 text-white/60 border-white/15', glow: 'shadow-black/20' };

function getColor(hex) { return courseColors[hex] || defaultColor; }

function CourseCard({ course, isEnrolled }) {
  const isLocked = course.status === 'locked' && !isEnrolled;
  const isComingSoon = course.status === 'coming_soon';
  const col = getColor(course.highlight_color);

  return (
    <div className={`relative bg-gradient-to-br ${col.bg} border ${col.border} rounded-2xl p-6 shadow-lg ${col.glow} flex flex-col gap-4 transition-all hover:scale-[1.01]`}>
      {/* Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider border px-3 py-1 rounded-full ${col.badge}`}>
          {isEnrolled || course.is_flagship ? (
            <><CheckCircle size={10} /> Matriculado</>
          ) : isComingSoon ? (
            <><Clock size={10} /> Em Breve</>
          ) : (
            <><Lock size={10} /> Disponível para aquisição</>
          )}
        </span>
        {course.is_flagship && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 px-2.5 py-0.5 rounded-full">
            <Star size={9} className="fill-current" /> Seu Curso Atual
          </span>
        )}
      </div>

      {/* Name */}
      <div>
        <h3 className="text-white font-bold text-base leading-snug mb-2">{course.name}</h3>
        <p className="text-white/50 text-sm leading-relaxed">{course.short_description}</p>
      </div>

      {/* Meta */}
      <div className="flex flex-wrap gap-3">
        {course.duration && (
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <Clock size={11} /> {course.duration}
          </div>
        )}
        {course.workload && (
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <GraduationCap size={11} /> {course.workload}
          </div>
        )}
        {course.modules_count && (
          <div className="flex items-center gap-1.5 text-xs text-white/40">
            <BookOpen size={11} /> {course.modules_count} módulos
          </div>
        )}
      </div>

      {/* CTA */}
      {!course.is_flagship && !isEnrolled && (
        <div className="mt-auto pt-3 border-t border-white/8">
          {isLocked ? (
            <div className="space-y-2">
              <div className="bg-black/30 rounded-xl p-3 flex items-start gap-2">
                <Sparkles size={13} className="text-yellow-400 shrink-0 mt-0.5" />
                <p className="text-xs text-white/50">
                  Já é aluno WR-EDU? Entre em contato para condições exclusivas de alumni!
                </p>
              </div>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: course.highlight_color || '#5b5ef4' }}
              >
                <MessageCircle size={15} /> Quero adquirir este curso
              </a>
            </div>
          ) : isComingSoon ? (
            <div className="bg-black/30 rounded-xl p-3 flex items-center gap-2">
              <Clock size={13} className="text-white/40 shrink-0" />
              <p className="text-xs text-white/40">Este curso estará disponível em breve. Fique atento aos avisos!</p>
            </div>
          ) : null}
        </div>
      )}

      {(course.is_flagship || isEnrolled) && (
        <div className="mt-auto pt-3 border-t border-white/8 flex items-center gap-2 text-xs text-white/30">
          <CheckCircle size={11} className="text-green-400" />
          <span>Acesso completo ativo</span>
        </div>
      )}
    </div>
  );
}

export default function CursosCatalogo() {
  const { user: session } = useOutletContext();
  const isAdmin = session?.role === 'admin';

  const { data: dbCourses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => base44.entities.Course.list('order', 20),
  });

  const { data: accessCode } = useQuery({
    queryKey: ['access-code', session?.codeId],
    queryFn: () => base44.entities.AccessCode.get(session.codeId),
    enabled: !!session?.codeId,
  });

  const courses = dbCourses.length > 0 ? dbCourses : FALLBACK_COURSES;
  const enrolledIds = accessCode?.enrolled_course_ids || [];

  const flagshipCourse = courses.find(c => c.is_flagship);
  const otherCourses = courses.filter(c => !c.is_flagship).sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="p-4 lg:p-7 max-w-5xl mx-auto animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center shadow-md">
            <GraduationCap size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground">Catálogo de Cursos</h1>
            <p className="text-muted-foreground text-sm">Explore todos os cursos WR-EDU disponíveis</p>
          </div>
        </div>

        <div className="mt-4 bg-gradient-to-r from-[#5b5ef4]/10 to-[#1db89e]/10 border border-[#5b5ef4]/20 rounded-2xl p-4 flex items-start gap-3">
          <Shield size={16} className="text-[#1db89e] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Representado junto à ABED</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Todos os cursos WR-EDU são coordenados pelo Prof. William Ribeiro e representados oficialmente junto à{' '}
              <a href="https://www.abed.org.br/site/associados/consulta-associados-ativos/" target="_blank" rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1">
                ABED <ExternalLink size={10} />
              </a>
              {' '}— Associação Brasileira de Educação a Distância. Base legal: Lei nº 9.394/96 e Decreto nº 5.154/04.
            </p>
          </div>
        </div>
      </div>

      {/* Flagship */}
      {flagshipCourse && (
        <div className="mb-8">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Seu Curso Atual</p>
          <CourseCard course={flagshipCourse} isEnrolled={true} />
        </div>
      )}

      {/* Other courses */}
      {otherCourses.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Outros Cursos Disponíveis</p>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/20">
              Benefício Alumni
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {otherCourses.map(course => (
              <CourseCard
                key={course.id}
                course={course}
                isEnrolled={enrolledIds.includes(course.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Professor section */}
      <div className="mt-10 border-t border-border pt-8">
        <div className="bg-gradient-to-br from-card to-secondary/30 border border-border rounded-2xl p-6">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">Sobre a Coordenação</p>
          <div className="flex gap-4 items-start">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#5b5ef4] to-[#1db89e] flex items-center justify-center text-white font-black text-lg shrink-0">
              WR
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground">Prof. William Ribeiro</h3>
              <p className="text-muted-foreground text-xs mt-0.5 mb-2">Psicoterapeuta · Psicanalista Diplomado · Logoterapeuta · Sexólogo Integrativo</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Dirigente do grupo Sinapse Coletiva, formado por profissionais da saúde comportamental. Educador Social pelo programa ADRA Vida Digital. Com extensa trajetória multidisciplinar, lidera a formação de novos terapeutas com foco em prática, dignidade e empatia.
              </p>
              <a href="/sobre" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary text-xs mt-3 hover:underline font-medium">
                Ver currículo completo e credenciais <ChevronRight size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}