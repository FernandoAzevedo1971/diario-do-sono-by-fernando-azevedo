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
    prompt: 'Dificuldade para iniciar o sono',
    options: ['Nenhuma', 'Leve', 'Moderada', 'Grave', 'Muito grave'],
  },
  {
    prompt: 'Dificuldade para manter o sono',
    options: ['Nenhuma', 'Leve', 'Moderada', 'Grave', 'Muito grave'],
  },
  {
    prompt: 'Acordar mais cedo do que gostaria',
    options: ['Nenhuma', 'Leve', 'Moderada', 'Grave', 'Muito grave'],
  },
  {
    prompt: 'Satisfação com o padrão atual de sono',
    options: ['Muito satisfeito', 'Satisfeito', 'Indiferente', 'Insatisfeito', 'Muito insatisfeito'],
  },
  {
    prompt: 'Quanto seu problema de sono interfere nas atividades do dia a dia',
    options: ['Não interfere', 'Interfere um pouco', 'Interfere de algum modo', 'Interfere muito', 'Interfere extremamente'],
  },
  {
    prompt: 'Quanto outras pessoas percebem prejuízo em sua qualidade de vida relacionado ao sono',
    options: ['Não percebem', 'Percebem um pouco', 'Percebem de algum modo', 'Percebem muito', 'Percebem extremamente'],
  },
  {
    prompt: 'Quanto você está preocupado(a) ou incomodado(a) com seu problema de sono',
    options: [
      'Não estou preocupado',
      'Um pouco preocupado',
      'De algum modo preocupado',
      'Muito preocupado',
      'Extremamente preocupado',
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
