# Genesis41 · Patrimônio

Sistema web de inventário e manutenção de equipamentos para igrejas (Next.js 14 + Supabase).

## Rodar

```bash
npm install
npm run dev
```

Sem as variáveis do Supabase, o sistema abre em **modo demonstração**: sem login, com dados de exemplo (13 campus e 18 equipamentos) salvos só no navegador. A faixa amarela no topo tem um botão para restaurar os dados de exemplo.

## Ligar ao Supabase

1. Crie o projeto no Supabase e rode no SQL Editor, nesta ordem:
   1. `schema.sql`
   2. `seed_data.sql` (opcional, dados de teste)
   3. `sql/001_equipamentos_rls_historico.sql` (permissões por perfil e histórico automático)
2. Crie `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

3. Cada pessoa cria a conta na tela de login. A conta nasce **inativa** na tabela `users`. O administrador libera o acesso no Supabase: `is_active = true`, `role` e `campus_id` (ou `region_id` para líder regional).

Os usuários do `seed_data.sql` têm IDs fixos e não correspondem a contas de login. Para usar um deles, crie a conta e copie o `id` de `auth.users` para a linha correspondente em `users`.

Para forçar o modo demonstração mesmo com o Supabase configurado: `NEXT_PUBLIC_DEMO_MODE=true`.

## Quem pode o quê em Equipamentos

| Perfil | Vê | Cadastra e edita | Exclui |
| --- | --- | --- | --- |
| Administração | Todos os campus | Todos | Sim |
| Líder regional | Campus da região | Campus da região | Não |
| Líder de mídia | O próprio campus | O próprio campus | Não |
| Pastor | O próprio campus | Não | Não |
| Técnico | Todos os campus | Não | Não |

A regra vale no banco (RLS). As telas só escondem os botões que dariam erro. Para tirar um equipamento de uso, use **Dar baixa**: ele sai do valor total, mas o cadastro e o histórico ficam guardados. Excluir apaga tudo.

## Estrutura

- `app/equipamentos` — lista, cadastro, ficha e edição
- `lib/equipamentos/repo.ts` — leitura e gravação (Supabase ou demonstração)
- `lib/equipamentos/history.ts` — regras do histórico (espelham o gatilho do banco)
- `lib/profile.tsx` — sessão e perfil do usuário logado
- `sql/` — migrações a rodar depois do `schema.sql`
