# Animações e microinterações

Guia rápido do sistema de movimento do Inventário ILAN. Não há biblioteca de animação: tudo é CSS em `app/globals.css` mais alguns componentes pequenos.

## Princípios

- **Rápido e discreto.** Entradas de 0,45 a 0,8 s; cliques em menos de 0,3 s. A animação nunca atrasa o trabalho.
- **Duas curvas.** `--suave` (saída exponencial) para entradas e deslizes; `--mola` (leve passagem do ponto) para cliques e confirmações.
- **Desfoque + subida.** O padrão de entrada (`@keyframes entrar`) é opacidade, 10 px de subida e 6 px de desfoque.
- **Cascata.** Grupos entram um item de cada vez, com 30 a 70 ms entre eles.
- **Movimento reduzido.** Quem ativa "reduzir movimento" no celular ou no computador vê tudo sem animação (`prefers-reduced-motion`).

## Onde cada coisa está

| Interação | Como usar |
| --- | --- |
| Troca de página | Automática: `app/template.tsx` envolve a página em `.pagina`, e os blocos do primeiro nível entram em cascata. |
| Carregando | `app/loading.tsx` mostra um esqueleto com brilho enquanto o servidor responde. |
| Barra de progresso no topo | `components/Interacoes.tsx`, automática em cliques de link e envios de formulário. |
| Botão enviando | Automático: o botão clicado ganha `data-enviando` e mostra um indicador girando. |
| Cascata em grupo | Classe `cascata` no elemento pai. `--atraso` no `style` adia o início. |
| Linhas de tabela | Automático em `tbody > tr`. |
| Texto palavra por palavra | `<TextoRevelado texto="..." />` |
| Número contando | `<NumeroAnimado valor={n} formato="moeda" />` |
| Cartão que sobe no hover | Classe `cartao`. |
| Barra de proporção crescendo | Classe `barra`. |
| Avisos | Classe `aviso`; erros usam `aviso aviso-erro` e balançam. |
| Abrir e fechar bloco | `<div className="expansivel" data-aberto={aberto}><div>...</div></div>` |
| Elemento que entra sozinho | Classe `entrada`, com `--atraso` opcional. |
| Menu lateral | `components/NavMenu.tsx`: pílula desliza até a tela atual e outra segue o mouse. No celular, `MenuLateral` desliza da esquerda. |
| Abas | `components/Abas.tsx`: sublinhado desliza até a aba ativa. |
| Excluir | `components/BotaoExcluir.tsx`: primeiro toque vira "Confirmar?", segundo envia, volta sozinho em 4 s. |

## Cuidados

- O menu usa navegação sem recarregar a página. O layout não roda de novo nessas trocas, por isso **toda página nova deve chamar `exigirLogin()` ou `exigirAdmin()`** no início, como as atuais.
- Evite animar `width`, `height` ou `top` em listas grandes; prefira `transform` e `opacity`.
