export interface IsiAnswer {
  item: number;
  value: number;
}

export interface IsiResult {
  score: number;
  interpretation: string;
  severity: 'none' | 'subclinical' | 'moderate' | 'severe';
  isValid: boolean;
}

export const ISI_ITEMS = [
  {
    prompt: 'Dificuldade para INICIAR o sono (dificuldade para adormecer)',
    options: ['Nenhuma', 'Leve', 'Moderada', 'Grave', 'Muito grave'],
  },
  {
    prompt: 'Dificuldade para MANTER o sono (acordar durante a noite e ter dificuldade para adormecer novamente)',
    options: ['Nenhuma', 'Leve', 'Moderada', 'Grave', 'Muito grave'],
  },
  {
    prompt: 'Problema de ACORDAR muito cedo (mais cedo do que desejado e dificuldade para voltar a dormir)',
    options: ['Nenhuma', 'Leve', 'Moderada', 'Grave', 'Muito grave'],
  },
  {
    prompt: 'SATISFAÇÃO com o seu padrão de sono atual',
    options: ['Muito satisfeito(a)', 'Satisfeito(a)', 'Neutro(a)', 'Insatisfeito(a)', 'Muito insatisfeito(a)'],
  },
  {
    prompt: 'Em que medida o seu problema de sono INTERFERE no seu funcionamento diário? (ex.: cansaço, humor, desempenho no trabalho, concentração, memória)',
    options: ['Não interfere', 'Interfere um pouco', 'Interfere moderadamente', 'Interfere muito', 'Interfere extremamente'],
  },
  {
    prompt: 'Em que medida o seu problema de sono é PERCEBIDO PELOS OUTROS como prejudicial à sua qualidade de vida? (ex.: família, amigos, colegas)',
    options: ['De forma alguma', 'Um pouco', 'Moderadamente', 'Muito', 'Extremamente'],
  },
  {
    prompt: 'O quanto você está PREOCUPADO(A) com o seu atual problema de sono?',
    options: [
      'Nada preocupado(a)',
      'Um pouco preocupado(a)',
      'Moderadamente preocupado(a)',
      'Muito preocupado(a)',
      'Extremamente preocupado(a)',
    ],
  },
] as const;

export function calculateIsiScore(values: number[]): IsiResult {
  const isValid = values.length === 7 && values.every((value) => Number.isInteger(value) && value >= 0 && value <= 4);

  if (!isValid) {
    return {
      score: 0,
      interpretation: 'Respostas incompletas ou inválidas.',
      severity: 'none',
      isValid: false,
    };
  }

  const score = values.reduce((sum, value) => sum + value, 0);

  if (score <= 7) {
    return {
      score,
      interpretation: 'Ausência de insônia clinicamente significativa',
      severity: 'none',
      isValid: true,
    };
  }

  if (score <= 14) {
    return {
      score,
      interpretation: 'Insônia subclínica',
      severity: 'subclinical',
      isValid: true,
    };
  }

  if (score <= 21) {
    return {
      score,
      interpretation: 'Insônia clínica moderada',
      severity: 'moderate',
      isValid: true,
    };
  }

  return {
    score,
    interpretation: 'Insônia clínica grave',
    severity: 'severe',
    isValid: true,
  };
}

export function shouldPromptIsi(params: {
  now: Date;
  lastCompletedAt?: Date | null;
  lastPromptedAt?: Date | null;
  intervalDays?: number;
}): boolean {
  const intervalDays = params.intervalDays ?? 14;
  const baselineDate = params.lastCompletedAt ?? params.lastPromptedAt;

  if (!baselineDate) {
    return true;
  }

  const elapsedMs = params.now.getTime() - baselineDate.getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

  return elapsedDays >= intervalDays;
}
