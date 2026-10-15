# Genesis41 · Marca

Identidade visual do Genesis41 (assinatura A2: nome em Sora Bold com o 41 em binário de 7 dígitos, `0101001`, e o G no lugar do zero inicial).

## Pastas

- `svg/` — logos com o nome convertido em curvas (abrem sem a fonte instalada)
- `paginas/manual.html` — manual de identidade visual, pronto para abrir no navegador
- `paginas/site.html` — site de apresentação do produto, arquivo único
- `fonte/` — modelos das páginas e scripts que geram os SVGs e as páginas

## Cores

| Nome | Hex | Uso |
|---|---|---|
| Grafite | `#11141A` | Cor principal |
| Ouro | `#E0AE4E` | Acento sobre fundo escuro |
| Ouro escuro | `#A97A18` | Acento sobre fundo claro |
| Papel | `#F4F3EF` | Fundo claro |
| Tinta | `#16181D` | Texto sobre claro |
| Névoa | `#F2F1EC` | Texto sobre escuro |

Fontes (Google Fonts): Sora, Figtree, IBM Plex Mono.

## Gerar de novo

```bash
pip install fonttools
python3 fonte/gen_logo.py Sora-Bold.ttf svg
python3 fonte/build.py fonte/manual.html svg paginas/manual.html
python3 fonte/build.py fonte/site.html svg paginas/site.html
```

`Sora-Bold.ttf` vem do Google Fonts (licença SIL Open Font License).
