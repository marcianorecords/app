import type { AccentTheme, Idea, UserProfile } from '../types/impulso';

export const ACCENT_THEMES: Array<{
  id: AccentTheme;
  label: string;
  hex: string;
  desc: string;
}> = [
  { id: 'terracota', label: 'Terracota', hex: '#d95d47', desc: 'Calor humano e acolhimento' },
  { id: 'rose', label: 'Rosa Afeto', hex: '#e11d48', desc: 'Conexão e expressão emocional' },
  { id: 'sage', label: 'Verde Sálvia', hex: '#0d9488', desc: 'Equilíbrio, calma e presença' },
  { id: 'indigo', label: 'Índigo Sereno', hex: '#4f46e5', desc: 'Clareza mental e foco profundo' },
  { id: 'amber', label: 'Âmbar Solar', hex: '#d97706', desc: 'Energia vital e criatividade' },
  { id: 'plum', label: 'Ameixa Suave', hex: '#7c3aed', desc: 'Introspecção e propósito' },
];

export const HOBBY_OPTIONS: string[] = [
  'Música',
  'Leitura',
  'Culinária',
  'Caminhada / Esportes',
  'Fotografia & Arte',
  'Conversas Profundas',
  'Meditação & Fé',
  'Cinema & Cultura',
  'Escrita / Diário',
  'Viagens & Natureza',
  'Jogos / Estratégia',
  'Organização & Casa',
];

export const EDUCATION_OPTIONS: string[] = [
  'Ensino Médio',
  'Técnico / Profissionalizante',
  'Graduação em andamento',
  'Ensino Superior Completo',
  'Pós-graduação / Mestrado / Doutorado',
  'Autodidata / Educação Contínua',
];

export const SOCIAL_STATUS_OPTIONS: string[] = [
  'Em relacionamento — buscando restauração',
  'Casado(a) / União estável',
  'Noivo(a) / Namorando',
  'Em reconstrução pessoal pós-término',
  'Solteiro(a) — cultivando amor próprio',
  'Prefiro não detalhar',
];

export const RELIGION_OPTIONS: string[] = [
  'Cristã / Católica / Evangélica',
  'Espiritualidade livre (sem religião fixa)',
  'Espírita / Kardecista',
  'Budista / Contemplativa',
  'Judaica / Islâmica / Outras tradições',
  'Agnóstico(a) / Ateu / Filosófica',
  'Prefiro não informar',
];

export const DEFAULT_USER_PROFILE: UserProfile = {
  completedOnboarding: false,
  name: '',
  avatar: '',
  birthDate: '',
  country: 'Brasil',
  profession: '',
  education: 'Ensino Superior Completo',
  socialStatus: 'Em relacionamento — buscando restauração',
  religion: 'Espiritualidade livre (sem religião fixa)',
  hobbies: ['Música', 'Conversas Profundas'],
};

const HOBBY_CATEGORY_KEYWORDS: Array<{
  hobbyMatch: RegExp;
  categories: Idea['category'][];
  textKeywords: RegExp;
  label: string;
}> = [
  {
    hobbyMatch: /m[uú]sica|viol[aã]o|cantar|som/i,
    categories: ['criatividade', 'lazer-cultura'],
    textKeywords: /m[uú]sica|som|playlist|ouvir|instrumento/i,
    label: 'seu interesse em Música',
  },
  {
    hobbyMatch: /leitura|livro|escrita|di[aá]rio/i,
    categories: ['estudos', 'criatividade'],
    textKeywords: /ler|livro|p[aá]ginas|escrever|anotar|di[aá]rio/i,
    label: 'seu hábito de Leitura & Escrita',
  },
  {
    hobbyMatch: /culin[aá]ria|cozinhar|receita/i,
    categories: ['saude-culinaria'],
    textKeywords: /cozinhar|receita|refei[cç][aã]o|[aá]gua|ch[aá]|fruta/i,
    label: 'seu gosto por Culinária & Cuidado',
  },
  {
    hobbyMatch: /caminhada|esporte|treino|natureza|viagem/i,
    categories: ['bem-estar', 'saude-culinaria'],
    textKeywords: /caminh|ar livre|sol|respir|corpo|energia|alongar/i,
    label: 'sua conexão com Movimento & Natureza',
  },
  {
    hobbyMatch: /conversa|afeto|arte|cinema|cultura|fotografia/i,
    categories: ['social-amor', 'lazer-cultura', 'criatividade'],
    textKeywords: /mensagem|pessoa|querid|elogio|conversa|relacion|arte|foto/i,
    label: 'seu foco em Conexões & Expressão',
  },
  {
    hobbyMatch: /medita[cç][aã]o|f[eé]|espiritual/i,
    categories: ['espiritualidade', 'bem-estar'],
    textKeywords: /respira|sil[eê]ncio|agradec|medita|prop[oó]sito|perd[aã]o/i,
    label: 'sua prática Contemplativa',
  },
  {
    hobbyMatch: /organiza|casa|estrat[eé]gia/i,
    categories: ['organizacao', 'foco'],
    textKeywords: /organiz|mesa|pasta|lista|planej|limpeza/i,
    label: 'seu perfil de Organização',
  },
];

export function scoreIdeaForProfile(
  idea: Idea,
  profile: UserProfile
): { score: number; reason: string | null } {
  let score = 0;
  let reason: string | null = null;
  const hay = `${idea.title} ${idea.description}`.toLowerCase();

  // 1. Hobby match
  for (const hobby of profile.hobbies || []) {
    const hLower = hobby.toLowerCase();
    for (const rule of HOBBY_CATEGORY_KEYWORDS) {
      if (rule.hobbyMatch.test(hLower)) {
        if (rule.categories.includes(idea.category) || rule.textKeywords.test(hay)) {
          score += 30;
          if (!reason) reason = `Combina com ${rule.label}`;
        }
      }
    }
    if (hay.includes(hLower.split(' ')[0]) && hLower.length > 3) {
      score += 20;
      if (!reason) reason = `Relacionado ao hobby ${hobby}`;
    }
  }

  // 2. Relationship / Social Status correlation
  const status = (profile.socialStatus || '').toLowerCase();
  if (
    (status.includes('relacionamento') || status.includes('casado') || status.includes('noivo')) &&
    (idea.category === 'social-amor' || /afeto|escuta|mensagem|relacion|empatia/i.test(hay))
  ) {
    score += 35;
    if (!reason) reason = 'Fortalece vínculo e escuta afetiva';
  } else if (
    (status.includes('reconstrução') || status.includes('solteiro')) &&
    (idea.category === 'vieses-gatilhos' || idea.category === 'bem-estar' || idea.category === 'estudos')
  ) {
    score += 25;
    if (!reason) reason = 'Apoia sua reconstrução e autonomia';
  }

  // 3. Religion / Spirituality correlation
  const rel = (profile.religion || '').toLowerCase();
  if (
    !rel.includes('não informar') &&
    !rel.includes('ateu') &&
    (idea.category === 'espiritualidade' || /gratid[aã]o|prop[oó]sito|perd[aã]o|paz/i.test(hay))
  ) {
    score += 20;
    if (!reason) reason = 'Alinhado aos seus valores espirituais';
  } else if (
    (rel.includes('ateu') || rel.includes('filosófica')) &&
    (idea.category === 'vieses-gatilhos' || idea.category === 'estudos')
  ) {
    score += 20;
    if (!reason) reason = 'Baseado em clareza racional e prática';
  }

  // 4. Profession & Education correlation
  const prof = (profile.profession || '').toLowerCase();
  if (
    prof &&
    (/tech|dev|engenh|design|analis|gest|prof|escrit|psic/i.test(prof) &&
      (idea.category === 'foco' || idea.category === 'estudos' || idea.category === 'vieses-gatilhos'))
  ) {
    score += 18;
    if (!reason) reason = `Útil para sua rotina como ${profile.profession}`;
  }

  // 5. Age bracket gentle correlation from birthDate
  if (profile.birthDate) {
    const year = parseInt(profile.birthDate.slice(0, 4), 10);
    const age = new Date().getFullYear() - year;
    if (!Number.isNaN(age) && age > 10 && age < 110) {
      if (age < 30 && (idea.category === 'estudos' || idea.category === 'criatividade')) {
        score += 10;
      } else if (age >= 30 && (idea.category === 'social-amor' || idea.category === 'bem-estar')) {
        score += 10;
      }
    }
  }

  // 6. Country / Cultural touch
  if (profile.country && profile.country.toLowerCase() !== 'brasil' && idea.category === 'lazer-cultura') {
    score += 8;
  }

  return { score, reason };
}

export function sortIdeasByProfile(ideas: Idea[], profile: UserProfile): Idea[] {
  if (!profile.completedOnboarding) return ideas;
  return [...ideas].sort((a, b) => {
    const scoreA = scoreIdeaForProfile(a, profile).score;
    const scoreB = scoreIdeaForProfile(b, profile).score;
    return scoreB - scoreA;
  });
}

export function formatTimeClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
