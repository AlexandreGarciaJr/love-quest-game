---
name: love-quest-static-web
description: Implementação de LOVE QUEST como experiência estática gratuita e publicável no GitHub Pages.
---

# LOVE QUEST — Implementação Web Estática

## Stack preferencial
- Vite + TypeScript.
- HTML/CSS/SVG para menus, diálogos e animações.
- Phaser 3 somente se o protótipo justificar um canvas de jogo; para interações narrativas simples, preferir DOM e CSS.
- Sem backend, banco de dados, autenticação, APIs pagas ou serviços obrigatórios.

## Regras técnicas
- Separar cenas/estados do jogo da apresentação visual.
- Centralizar nomes e textos configuráveis em uma estrutura tipada.
- Sanitizar e limitar o comprimento dos nomes para evitar layout quebrado; usar `textContent` ou renderização segura, nunca interpolar texto do usuário como HTML.
- Tratar acentos e Unicode.
- Não registrar nomes ou respostas em serviços externos.
- Persistir apenas preferências não sensíveis se necessário.
- Som somente após interação explícita; permitir silenciar.
- Implementar navegação por teclado, foco visível, rótulos acessíveis e alternativas para interações por mouse.
- Manter dependências enxutas e build reproduzível.

## GitHub Pages
- Configurar `base` do Vite para o nome do repositório quando publicar em `https://<usuario>.github.io/<repositorio>/`.
- Usar caminhos relativos para assets ou garantir que respeitem o `base`.
- Criar workflow GitHub Actions para instalar dependências, executar build e publicar a pasta `dist`.
- Documentar a configuração de Pages em Settings → Pages → GitHub Actions.
- Testar links, fontes, imagens e rotas no caminho publicado, não apenas em localhost.

## Verificação
- `npm run build`.
- Testar desktop e viewport mobile.
- Testar nomes vazios, longos, com acentos e caracteres especiais.
- Testar todos os botões e todas as escolhas.
- Confirmar que nenhuma escolha negativa bloqueia o final.
- Verificar `prefers-reduced-motion` e controles sem hover.
- Nunca afirmar que um teste passou sem executar o comando ou reproduzir o comportamento.
