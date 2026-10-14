---
name: love-quest-qa
description: QA funcional, acessibilidade, mobile e deploy para LOVE QUEST.
---

# LOVE QUEST — QA e Publicação

## Testes de fluxo
- Entrada aceita os dois nomes e define Alexandre como remetente padrão.
- Campos vazios recebem validação amigável ou um nome padrão.
- Nomes longos, acentos, emojis e caracteres especiais não quebram a interface.
- Toda fase pode ser concluída sem habilidade especial.
- Tentar a escolha negativa mostra a piada e não prende a pessoa.
- O final exibe os nomes e a mensagem de carinho.
- Reiniciar funciona.
- Áudio pode ser silenciado e não começa inesperadamente.
- Não há erros no console nem assets quebrados.

## Testes de dispositivos
- Desktop com mouse e teclado.
- Celular com toque, sem hover.
- Viewports estreitas e largas.
- Movimento reduzido ativado.
- Conexão limitada: reduzir peso de imagens e áudio.

## Deploy
- Rodar o build local.
- Verificar a configuração `base` do Vite.
- Conferir o workflow do GitHub Actions.
- Após deploy, abrir a URL real do GitHub Pages e testar o fluxo completo.
- Verificar que os caminhos de assets funcionam em subdiretório.
- Documentar limitações e qualquer teste não realizado.
