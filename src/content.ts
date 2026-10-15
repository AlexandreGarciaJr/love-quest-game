// Todos os textos do jogo ficam aqui. Para mudar uma piada, edite só este arquivo.

export type Gender = 'f' | 'm';

export interface Profile {
  playerName: string;
  partnerName: string;
  playerGender: Gender;
  partnerGender: Gender;
}

/** Escolhe a forma feminina ou masculina de uma palavra. */
export const g = (gender: Gender, f: string, m: string): string => (gender === 'f' ? f : m);

/** "seu parceiro" / "sua parceira" */
export const partnerTitle = (p: Profile): string =>
  g(p.partnerGender, 'sua parceira', 'seu parceiro');

export const MAX_NAME_LENGTH = 24;

export const content = {
  title: 'LOVE QUEST',
  tagline: 'Uma pequena aventura para uma grande declaração.',
  shareLine: 'Um jogo para compartilhar com seu amor 💗',
  credits: {
    label: 'feito com 💗 por Alexandre Garcia',
    href: 'https://alexandregarcia.dev/',
    portfolioLabel: 'Conheça meu portfólio →',
    portfolioHref: 'https://alexandregarcia.dev/',
  },

  entry: {
    sentBy: (name: string) => `💌 Uma aventura enviada por ${name}`,
    changePartner: 'trocar nome do parceiro',
    playerLabel: 'Seu nome',
    playerPlaceholder: 'Como você se chama?',
    partnerLabel: 'Nome do seu par',
    partnerPlaceholder: 'ex.: Alexandre',
    iAm: 'Eu sou:',
    myPartnerIs: 'Meu par é:',
    woman: '👩 Mulher',
    man: '👨 Homem',
    partnerM: 'Parceiro',
    partnerF: 'Parceira',
    sound: 'Som',
    start: 'Começar aventura',
    errors: {
      playerName: 'Ei, faltou o seu nome! 🙂',
      partnerName: 'Faltou o nome do seu par. 💭',
      playerGender: 'Escolha como prefere ser chamada(o). 👆',
      partnerGender: 'Escolha se é parceiro ou parceira. 👆',
    },
  },

  hearts: {
    intro: (p: Profile) =>
      `Oi, ${p.playerName}! Eu sou o Coraçãozinho, guia oficial desta missão. Primeiro, um treino rápido: toque nos 3 corações!`,
    hint: 'Psiu… é só tocar nos corações brilhando. ✨',
    counter: (n: number) => `${n}/3 corações`,
    done: (p: Profile) =>
      `Uau! Reflexos de quem nasceu para ser ${g(p.playerGender, 'amada', 'amado')}. Treinamento concluído com louvor.`,
    next: 'Próxima fase',
  },

  choice: {
    question: (p: Profile) =>
      `Pergunta séria (muito séria): você aceita receber uma quantidade irresponsável de carinho de ${p.partnerName}?`,
    yes: 'Sim, obviamente 💖',
    no: 'Não',
    noConverted: 'Sim também 💖',
    reactions: [
      'Opa! Esse botão é meio tímido.',
      'Ele está fugindo de você. Que feio, botão.',
      'Pronto, consertei o botão. De nada. 😌',
    ],
    accepted: (p: Profile) =>
      `Resposta registrada em cartório. ${p.partnerName} já foi ${g(p.partnerGender, 'avisada', 'avisado')}. Sem devolução.`,
    next: 'Continuar',
  },

  compat: {
    title: 'Teste de compatibilidade',
    subtitle: 'completamente científico (confia)',
    question: (p: Profile) => `Qual o melhor programa a dois com ${p.partnerName}?`,
    options: (p: Profile) => [
      'Pizza e série 🍕',
      'Dormir de conchinha 😴',
      `Qualquer coisa, desde que seja com ${p.partnerName} ✨`,
    ],
    blocked: (p: Profile) => `Ficar longe de ${p.partnerName}`,
    blockedTag: 'indisponível na sua região',
    blockedToast: 'Erro 404: opção de ficar longe não encontrada. 🛰️',
    analyzing: 'Analisando dados com tecnologia de ponta…',
    steps: ['Contando borboletas no estômago', 'Medindo nível de fofura', 'Consultando as estrelas'],
    result: 'Compatibilidade',
    resultNote: 'O medidor quebrou. Cientistas chocados. Margem de erro: zero.',
    contest: 'Contestar resultado',
    contestToast: 'Contestação negada pelo Tribunal do Amor. ⚖️💗',
    next: 'Ver a última fase',
  },

  final: {
    intro: (p: Profile) =>
      `${p.playerName}, ${p.partnerName} deixou uma mensagem especial pra você. O que deseja fazer?`,
    open: 'Abrir mensagem 💌',
    leave: 'Sair sem receber carinho',
    leaveLocked: '🔒 Porta trancada (por amor)',
    leaveReactions: [
      'Essa porta está de folga hoje. Volte nunca! 🚪🚫',
      'Já disse que está de folga! A mensagem é ali em cima. 👆',
      'A porta pediu demissão. Só resta abrir a mensagem. 😌',
    ],
    greeting: (p: Profile) => `${p.playerName},`,
    message: (p: Profile) =>
      `${capitalize(partnerTitle(p))} ${p.partnerName} te ama muito e te mandou isso com carinho. ❤️`,
    paragraph:
      'Cada risada, cada abraço e cada dia ao seu lado valem mais do que qualquer tesouro de qualquer jogo. Você é a melhor aventura de todas, e essa missão não tem fim.',
    signature: (p: Profile) => `— ${p.partnerName} 💗`,
    score: (p: Profile, n: number, total: number) =>
      `Você coletou ${n}/${total} corações… mas o coração de ${p.partnerName} já era todo seu.`,
    replay: 'Jogar de novo',
    share: 'Compartilhar jogo',
    copied: 'Link copiado! 💌',
    shareText: 'LOVE QUEST — uma pequena aventura para uma grande declaração. 💗',
  },

  sound: { on: 'Desligar som', off: 'Ligar som' },
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Limpa o nome digitado: remove espaços extras e limita o tamanho (respeitando emojis). */
export function sanitizeName(raw: string): string {
  const clean = raw.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  return Array.from(clean).slice(0, MAX_NAME_LENGTH).join('');
}

// ---------------------------------------------------------------- Jogo (v2)

export const MASCOT_NAME = 'Coraçãozinho';

export const gameText = {
  intro: (p: Profile) => [
    { speaker: p.partnerName, text: `${p.playerName}! Que noite linda pra gente passear… 💗` },
    { speaker: 'Tédio', text: 'Romance? Que preguiça… *bocejo* Vou levar isso aqui comigo!' },
    {
      speaker: MASCOT_NAME,
      text: `Oh não! O Chefão Tédio levou ${p.partnerName} para o Castelo nas Nuvens! Vamos atrás, ${p.playerName}. Eu te ajudo!`,
    },
  ],
  letterFound: 'Você achou uma carta secreta! 💌',
  checkpoint: 'Checkpoint! ❤️',
  levelComplete: {
    title: 'Fase concluída!',
    hearts: 'Corações',
    letter: 'Carta secreta',
    deaths: 'Tropeços',
    found: 'encontrada 💌',
    missing: 'não encontrada',
    next: 'Continuar',
    replay: 'Jogar a fase de novo',
  },
  pause: {
    title: 'Pausa',
    resume: 'Continuar',
    layout: 'Layout dos controles',
    landscape: 'Deitado',
    portrait: 'Em pé',
    sound: 'Som',
    fullscreen: 'Tela cheia',
    restart: 'Voltar ao checkpoint',
    map: 'Mapa do mundo',
    quit: 'Desistir do amor',
    quitToast: 'Opção em manutenção eterna. 🛠️💗',
  },
  rotate: {
    title: 'Gire o celular 🔄',
    text: 'A aventura fica melhor deitada.',
    portrait: 'Prefiro jogar em pé',
  },
  controls: { jump: 'Pular', action: 'Ação', pause: 'Pausar' },
};

// ---------------------------------------------------------------- Etapa 2: NPCs, poderes, mapa

export interface Choice {
  yes: string;
  no: string;
  /** Falas do botão "Não" fugindo (uma por tentativa). */
  dodges: string[];
}

export interface Line {
  speaker: string;
  text: string;
  choice?: Choice;
}

export const npcText: Record<'snail' | 'owl' | 'calango', (p: Profile) => Line[]> = {
  snail: (p) => [
    { speaker: 'Caracol Carteiro', text: `Correio do Amor, entregas lentas porém garantidas. ${p.playerName}, certo?` },
    {
      speaker: 'Caracol Carteiro',
      text: `Tenho aqui uma carta escondida de ${p.partnerName} pra você, em algum lugar desta fase. Quer ajuda pra resgatar ${g(p.partnerGender, 'ela', 'ele')}?`,
      choice: { yes: 'Sim, por favor!', no: 'Não', dodges: ['O "não" escorregou na minha gosma.', 'Não aceitamos devoluções.', 'Vou considerar isso um sim.'] },
    },
    { speaker: 'Caracol Carteiro', text: 'Dica de carteiro: cartas gostam de lugares altos. Olhe para cima e para trás!' },
  ],
  owl: (p) => [
    { speaker: 'Coruja Fofoqueira', text: `Uhuu! Então você é ${p.playerName}? Todo mundo no jardim só fala de vocês dois.` },
    {
      speaker: 'Coruja Fofoqueira',
      text: `Dizem que ${p.partnerName} suspira seu nome até dormindo. Posso espalhar essa fofoca?`,
      choice: { yes: 'Pode espalhar 💗', no: 'Melhor não', dodges: ['Hmm? Não ouvi. Coruja só escuta "sim".', 'A fofoca já saiu voando, sinto muito.', 'Tarde demais, já contei pras abelhas.'] },
    },
    { speaker: 'Coruja Fofoqueira', text: 'Cuidado com as abelhas: elas também querem saber de tudo. E use o pulo duplo nas flores altas!' },
  ],
  calango: (p) => [
    { speaker: 'Calango do Cerrado', text: `Ô, ${p.playerName}! Chegou de avião, é? Aqui é seca, mas o coração é úmido.` },
    {
      speaker: 'Calango do Cerrado',
      text: `${p.partnerName} já passou por aqui um monte de vez. Vai atrás ou vai ficar tomando um sol comigo?`,
      choice: { yes: 'Vou atrás!', no: 'Tomar sol', dodges: ['Sol aqui queima, melhor ir.', 'A pedra tá ocupada, foi mal.', 'Calango manda: vai atrás!'] },
    },
    { speaker: 'Calango do Cerrado', text: 'Os pombos do governo carimbam tudo. Pule por cima ou atire corações com B. E no ar, depois do pulo duplo, aperte PULAR de novo pra ir longe!' },
  ],
};

export const powerText = {
  wings: (p: Profile): Line[] => [
    { speaker: MASCOT_NAME, text: 'Você pegou as Asas do Amor! 🪽' },
    { speaker: MASCOT_NAME, text: `Agora dá pra pular de novo no ar: aperte PULAR duas vezes. ${p.partnerName} está cada vez mais perto!` },
  ],
  dash: (): Line[] => [
    { speaker: MASCOT_NAME, text: 'Você pegou a Saudade Acelerada! ⚡' },
    { speaker: MASCOT_NAME, text: 'No ar, depois do pulo duplo, aperte PULAR mais uma vez para dar um impulso para a frente. Perfeito para os vãos longos da cidade.' },
  ],
};

export const carinhoText = {
  offer: (p: Profile): Line => ({
    speaker: MASCOT_NAME,
    text: `Ei, ${p.playerName}… esse trecho tá difícil. Quer ativar o Modo Carinho? (pulo extra e nada de inimigo te machuca)`,
    choice: { yes: 'Quero sim 💗', no: 'Não preciso', dodges: ['Tem certeza? Pensa de novo…', 'Vou fingir que não ouvi.', 'Ativando mesmo assim, por precaução. 💗'] },
  }),
  on: { speaker: MASCOT_NAME, text: 'Modo Carinho ativado! Agora você brilha e os Tedinhos ficam com vergonha de encostar. ✨' },
};

export const levelIntros: Record<string, (p: Profile) => Line[]> = {
  garden: (p) => [{ speaker: MASCOT_NAME, text: `O Jardim Florido! ${p.partnerName} adorava passear por aqui. Pegue as asas logo ali na frente!` }],
  city: (p) => [
    { speaker: MASCOT_NAME, text: `Pousamos na Cidade à Noite! Quantas vezes vocês dois já se encontraram num aeroporto assim… ✈️` },
    { speaker: MASCOT_NAME, text: `O castelo do Tédio fica depois dos telhados. Vamos, ${p.playerName}!` },
  ],
};

export const mapText = {
  title: 'Mapa do Mundo',
  enter: (name: string) => `${name} · aperte A para entrar`,
  locked: 'Trancado: termine a fase anterior 🔒',
  home: 'Casa',
  castle: 'Castelo nas Nuvens',
  castleSoon: 'O castelo do Tédio abre na próxima etapa 🏰',
  continue: (name: string) => `Continuar aventura de ${name}`,
  newGame: 'Nova aventura',
};

// ---------------------------------------------------------------- Etapa 3: chefão e final

export const bossText = {
  name: 'Castelo nas Nuvens',
  intro: (p: Profile): Line[] => [
    { speaker: 'Tédio', text: `*bocejo* Você de novo, ${p.playerName}? Que preguiça… ${p.partnerName} agora mora aqui, no tédio eterno.` },
    { speaker: p.partnerName, text: `${p.playerName}! Eu sabia que você vinha! 💗` },
    { speaker: MASCOT_NAME, text: 'Amor é o ponto fraco do Tédio! Aperte B para arremessar corações nele. Pule para desviar!' },
  ],
  phase2: { speaker: 'Tédio', text: 'Ai! Isso… doeu de um jeito fofo. Agora vou te atropelar! *zum*' },
  phase3: { speaker: 'Tédio', text: 'Vou bocejar tão forte que você vai ficar com sono… *BOCEEEJO*' },
  defeated: (p: Profile): Line[] => [
    { speaker: 'Tédio', text: 'Nããão… tanto carinho assim é… é… divertido demais… 💨' },
    { speaker: p.partnerName, text: `Você atravessou o céu, o jardim e a cidade só por mim, ${p.playerName}?` },
    { speaker: p.playerName, text: 'Óbvio. Até o fim do mundo, se precisasse. 💗' },
    { speaker: MASCOT_NAME, text: `Missão cumprida! E ${p.partnerName} deixou uma mensagem especial pra você…` },
  ],
  hint: 'Aperte B (ou X) para arremessar corações no Tédio!',
  slowed: 'Bocejo pega! Você ficou com sono… 😴',
};

/** Frases extras na mensagem final, uma por carta secreta encontrada. */
export const letterLines = [
  'Carta 1: Cada mensagem sua de bom dia chega antes do café e já melhora o dia inteiro.',
  'Carta 2: A distância é só um detalhe quando o destino é você.',
  'Carta 3: Toda vez que a gente se encontra, parece a primeira vez.',
];
export const allLettersLine = '💌 Você encontrou todas as cartas. Isso quer dizer que você me conhece como ninguém.';
