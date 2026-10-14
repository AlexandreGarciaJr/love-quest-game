# LOVE QUEST — Prompt mestre para Claude Code

Atue como engenheiro de software sênior, game designer e diretor de arte de um pequeno jogo web. Desenvolva o projeto **LOVE QUEST**, uma experiência romântica curta, engraçada e compartilhável. O objetivo é que pareça uma mensagem interativa carinhosa, e não um jogo difícil ou demorado.

## Conceito

A pessoa abre um link e informa:
- Nome de quem vai jogar.
- Nome do parceiro que enviou a experiência.

O jogo deve usar esses nomes nos diálogos e na mensagem final. O nome do remetente pode vir preenchido como **Alexandre**, mas deve ser editável. No final, exibir uma mensagem fofa equivalente a:

“[NOME DA JOGADORA], seu parceiro [NOME DO PARCEIRO] te ama muito e te mandou isso com carinho. ❤️”

Use gramática natural em português brasileiro. Não presuma que quem joga é necessariamente mulher: o nome e os textos devem poder ser personalizados; a experiência padrão pode usar “jogadora” conforme o conceito.

## Princípios obrigatórios

1. **Curto:** duração-alvo de 1 a 3 minutos.
2. **Fácil:** ninguém deve ficar preso, perder de verdade ou precisar de reflexos rápidos.
3. **Mais mensagem do que jogo:** o gameplay serve para criar humor, surpresa e expectativa antes da mensagem final.
4. **Engraçado e carinhoso:** humor leve, absurdo e brincalhão; nunca humilhante, ameaçador ou agressivo.
5. **Escolhas negativas bloqueadas de forma cômica:** oferecer escolhas como “Não”, “Cancelar o amor”, “Sair sem receber carinho” ou “Não quero continuar”, mas quando a pessoa tentar selecionar uma escolha cômica de rejeição, o jogo pode impedir a ação com uma reação engraçada — por exemplo, o botão escapa, muda de lugar, fica minúsculo por um instante ou um personagem/NPC apresenta uma desculpa ridícula. A piada deve ser claramente lúdica. Sempre mantenha uma forma acessível de seguir em frente e não crie loops impossíveis.
6. **Sem backend e sem custos recorrentes:** o jogo deve funcionar inteiramente no navegador, como site estático.
7. **Mobile-first:** funcionar bem em celulares, com toque e teclado quando aplicável.
8. **Privacidade:** não enviar nomes nem respostas para servidores. Evitar colocar dados pessoais na URL por padrão.
9. **Sem dependências pagas, APIs pagas, login, banco de dados ou analytics.**
10. **Não usar assets sem licença clara.** Preferir arte própria em CSS/SVG, assets criados para o projeto ou recursos com licença compatível e documentada.

## Direção criativa

Nome: **LOVE QUEST**  
Tagline sugerida: “Uma pequena aventura para uma grande declaração.”

Estética: indie game 2D, pixel art moderna, noite estrelada, corações, flores, brilhos e cores rosa/violeta sobre fundo azul-marinho. Interface refinada, divertida e legível, não infantilizada. Animações suaves e microinterações. Evitar exagero de efeitos que prejudiquem desempenho ou leitura.

## Fluxo sugerido

1. **Tela de entrada:** logo LOVE QUEST, uma frase curta e dois campos: “Seu nome” e “Nome de quem te enviou isso”. O segundo vem preenchido com “Alexandre”, mas pode ser editado. Botão “Começar aventura”.
2. **Cena 1 — Tutorial do amor:** movimento ou interação simples para coletar 3 corações. Pode ser um clique/toque por coração; não exigir habilidade.
3. **Cena 2 — Escolha impossível:** pergunta divertida com opções positivas e negativas. Se tentar a negativa, bloquear de modo cômico, mas permitir continuar sem frustração. Exemplo: “Você aceita receber uma quantidade irresponsável de carinho?” / “Sim, obviamente” / “Não”. Ao tentar “Não”: “Erro 404: opção de fugir do carinho não encontrada.” Depois, liberar o avanço.
4. **Cena 3 — Teste de compatibilidade completamente científico (confia):** uma escolha absurda ou minigame de 10–20 segundos, com resultado garantidamente positivo e engraçado. Não exigir respostas corretas.
5. **Cena final — Mensagem:** pequena animação com corações e estrelas, seguida da mensagem: “[NOME DA JOGADORA], seu parceiro [NOME DO PARCEIRO] te ama muito e preparou isso com carinho só para você. ❤️” Ajuste a frase para soar natural. Botão para jogar novamente e opção para copiar/compartilhar o link genérico. Não alegar que a mensagem foi enviada por um serviço externo.

A duração total deve ficar entre 1 e 3 minutos. Se o jogador ficar parado, deve existir uma forma simples de avançar. O final deve ser sempre alcançável.

## Stack e hospedagem

- Vite + TypeScript.
- Phaser 3 apenas se trouxer benefício real ao minigame; se a experiência for mais narrativa que gameplay, considere HTML/CSS/TypeScript sem motor de jogo. Prefira a solução mais simples e confiável.
- CSS responsivo e animações com CSS/SVG.
- `localStorage` apenas para preferências opcionais, como som; não é necessário persistir nomes.
- Build estático compatível com GitHub Pages.
- Configurar corretamente o `base` do Vite para publicação em um repositório de projeto do GitHub Pages.
- Criar GitHub Actions para build e deploy em Pages, com instruções claras.
- Nenhum servidor/backend.

## Requisitos de implementação

- Antes de codificar, inspecione o repositório existente. Preserve código e convenções úteis. Não sobrescreva arquivos do usuário sem entender o projeto.
- Apresente um plano curto e a estrutura de pastas antes de mudanças grandes.
- Implemente o projeto funcional, não apenas mockups ou pseudocódigo.
- Componentes e funções pequenos, nomes claros, TypeScript sem `any` desnecessário.
- Tratar campos vazios, nomes longos, acentos e caracteres especiais.
- Respeitar `prefers-reduced-motion`.
- Som desligado por padrão ou iniciado somente após interação explícita, respeitando as políticas dos navegadores.
- Não depender de hover como única forma de interação. O botão que foge precisa ter comportamento alternativo por toque e teclado.
- As escolhas negativas devem ser engraçadas, mas nunca bloquear navegação essencial, acessibilidade ou saída da página.
- Garantir legibilidade, foco visível, contraste adequado e botões grandes para toque.
- Otimizar para carregamento rápido e não incluir bibliotecas desnecessárias.

## Critérios de aceite

- [ ] A pessoa informa os dois nomes e os vê corretamente ao longo da experiência.
- [ ] “Alexandre” é o remetente padrão, mas pode ser editado.
- [ ] O jogo completo leva aproximadamente 1–3 minutos.
- [ ] É possível chegar ao final sem habilidade especial e sem ficar preso.
- [ ] Pelo menos uma escolha negativa é bloqueada com uma piada.
- [ ] A piada funciona em mouse, toque e teclado sem prejudicar acessibilidade.
- [ ] A mensagem final inclui os dois nomes e a declaração de carinho.
- [ ] Funciona em desktop e celular.
- [ ] `npm run build` termina sem erros.
- [ ] A publicação funciona no GitHub Pages em caminho de subdiretório.
- [ ] README documenta execução local, build, deploy e personalização.
- [ ] Não há APIs pagas, backend, banco de dados ou custos recorrentes necessários.

## Forma de trabalho

1. Inspecione o projeto.
2. Apresente arquitetura mínima, fluxo e riscos.
3. Implemente um MVP completo.
4. Execute build e testes disponíveis.
5. Corrija problemas encontrados.
6. Informe os arquivos alterados, comandos executados e passos exatos para publicar no GitHub Pages.
7. Não diga que testou algo que não executou de fato.

Priorize uma experiência pequena, polida, engraçada e memorável em vez de adicionar funcionalidades desnecessárias.
