# Como o sistema está montado e como levá-lo para outro lugar

Este documento descreve onde cada parte do Inventário ILAN roda hoje e o passo a passo para mudar de hospedagem no futuro. Atualize-o sempre que mudar algo na infraestrutura.

## Visão geral

| Parte | Onde está hoje | O que faz |
| --- | --- | --- |
| Aplicação (telas e regras) | Vercel, projeto `ilan-inventario-sistema-1rkc`, pasta raiz `ilan-sistema-inventario/` | Next.js 14 (Node.js). Gera as páginas no servidor. |
| Banco de dados | Supabase, projeto `tffdimvvjneahqfwlmxz` | PostgreSQL com todas as tabelas (campus, equipamentos, manutenções, usuários, logs, categorias, locais). |
| Senhas de acesso | Supabase Auth (mesmo projeto) | Guarda as senhas com segurança. Cada usuário tem um e-mail interno `<usuario>@ilan.local`, que nunca recebe mensagens. |
| Sessão (quem está logado) | Cookie `ilan_sessao`, assinado pela própria aplicação | Não depende da Vercel nem do Supabase. |
| Domínio | `inventario-ilan.nex4.com.br`, DNS no Cloudflare | Registro CNAME para `cname.vercel-dns.com`, com o proxy do Cloudflare **desligado** (nuvem cinza). |
| Código | GitHub `gleeisond/ilan-inventario-sistema` | Cada mudança entra por pull request. A Vercel publica sozinha o que chega na `main`. |

Nada no código depende de recursos exclusivos da Vercel. A aplicação é um projeto Next.js comum e roda em qualquer lugar que execute Node.js.

## Variáveis de ambiente

Toda hospedagem precisa destas variáveis:

| Variável | Obrigatória | Para que serve |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | Endereço do projeto Supabase (`https://<ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Chave pública do Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Chave secreta do Supabase. Usada só no servidor, para criar e trocar senhas. Nunca exponha. |
| `SESSION_SECRET` | Recomendada | Texto longo e aleatório que assina o cookie de sessão. Sem ela, a aplicação usa a `SUPABASE_SERVICE_ROLE_KEY`. Trocar esse valor desconecta todo mundo. |
| `LOGIN_ATIVO` | Sim, em produção | `1` exige login. Sem ela, o sistema fica aberto (modo de teste). |

Os valores atuais estão na Vercel, em **Settings > Environment Variables**. Não guarde as chaves no código nem neste documento.

## Levar a aplicação para outra hospedagem

Requisitos: Node.js 18.17 ou mais novo.

```bash
cd ilan-sistema-inventario
npm ci
npm run build
npm start          # sobe na porta 3000 (use PORT=8080 npm start para outra porta)
```

Isso serve para:

- **Hospedagens que leem o GitHub** (Railway, Render, Netlify, Cloudflare Pages com Next, AWS Amplify): aponte para o repositório, defina a pasta raiz `ilan-sistema-inventario`, comando de build `npm run build`, comando de início `npm start`, e cadastre as variáveis acima.
- **Servidor próprio ou VPS**: instale o Node.js, rode os comandos acima e mantenha o processo ativo com `pm2` ou `systemd`, com um Nginx na frente para o HTTPS.
- **Docker**: um `Dockerfile` simples com `node:20-alpine`, `npm ci`, `npm run build` e `CMD ["npm","start"]` resolve.

Depois de publicar, troque o registro DNS no Cloudflare para o endereço que a nova hospedagem indicar. Faça um teste antes da troca (login, cadastro de equipamento, abertura de chamado). A Vercel pode continuar ativa até tudo estar confirmado.

## Levar o banco de dados para outro lugar

Existem dois caminhos.

### 1. Manter o Supabase (mais simples)

A aplicação pode mudar de hospedagem e continuar usando o mesmo Supabase. Basta copiar as variáveis. Para mudar de conta ou de região do Supabase, crie o novo projeto, rode os scripts da seção "Criar o banco do zero" e copie os dados (veja o item 2).

### 2. Sair do Supabase

Os dados são PostgreSQL padrão. Para exportar tudo, pegue a connection string em **Supabase > Project Settings > Database** e rode:

```bash
pg_dump "postgresql://postgres:<senha>@db.<ref>.supabase.co:5432/postgres" \
  --schema=public --no-owner --no-privileges -f ilan_backup.sql
```

O arquivo pode ser restaurado em qualquer PostgreSQL 15 ou mais novo (`psql -f ilan_backup.sql`).

O que exige trabalho de código ao sair do Supabase:

- **Acesso aos dados**: a aplicação conversa com o banco pela biblioteca `@supabase/supabase-js` (API REST do Supabase). Num PostgreSQL comum é preciso trocar essas consultas por uma biblioteca de banco (por exemplo `postgres` ou Prisma). As consultas ficam em `app/**/page.tsx`, `app/**/actions.ts` e `lib/relatorios.ts`.
- **Senhas**: elas ficam no Supabase Auth e não saem num `pg_dump` do esquema `public`. Ao migrar, o mais simples é guardar as senhas numa tabela própria (com bcrypt) e pedir que cada pessoa receba uma senha nova do administrador. Os pontos a trocar estão em `app/login/actions.ts`, `app/minha-senha/actions.ts` e `app/usuarios/actions.ts`.

## Criar o banco do zero

Num projeto Supabase novo, rode no SQL Editor, nesta ordem:

1. `schema.sql`: tabelas, tipos, índices e permissões.
2. `seed_data.sql`: dados de exemplo, só se quiser um ambiente de teste.
3. `sql/01_activity_logs.sql`: tabela de logs.
4. `sql/02_cadastros.sql`: categorias e locais.
5. `sql/03_fluxo_reparo.sql`: etapas do fluxo de reparo (triagem, aprovação de orçamento, descarte, instalação).

Toda mudança futura de banco deve ganhar um arquivo novo em `sql/` com o próximo número e ser registrada aqui.

## Backups

O plano gratuito do Supabase não guarda backups por muito tempo. Recomenda-se rodar o `pg_dump` acima periodicamente (por exemplo, uma vez por mês) e guardar o arquivo fora do Supabase.
