# Revisão SEO da página — Divórcio SP

- **URL canônica:** https://vieiraemarquesadvogados.com/divorcio-sao-paulo/
- **Data da captura:** 2026-10-09 (arquivo `index.html` do repositório; página ainda não verificada ao vivo)
- **Idioma / público:** pt-BR, pessoas em qualquer cidade do estado de SP que querem se divorciar
- **Papel da página:** landing page de serviço (captação de leads), indexável
- **Família de buscas:** "advogado de divórcio SP / São Paulo / [cidade]", "divórcio consensual / litigioso / em cartório / online SP", "guarda, pensão, partilha de bens SP"
- **Status:** correções técnicas aplicadas; itens do site principal pendentes

## Limitações

- Sem dados de Search Console, ranking ou tráfego: nada aqui afirma indexação ou posição.
- Captura renderizada feita em Chromium headless local, com React/Lenis servidos localmente (a rede do ambiente bloqueia o unpkg.com).

## Apresentação no resultado de busca

| Campo | Estado antes | Estado agora |
|---|---|---|
| `<title>` | Presente, específico, **só após o JS** | No HTML cru: "Advogado de Divórcio em SP \| Todo o Estado \| Vieira & Marques" |
| Meta description | Presente, **só após o JS**; sem o diferencial "online" | No HTML cru, com "atendimento 100% online" |
| H1 | "Advogado de divórcio em todo o estado de São Paulo para você resolver sem decidir nada sozinho." — alinhado ao title | Sem mudança |
| Canonical / robots | Corretos, **só após o JS** | No HTML cru |
| Open Graph / Twitter | **Só após o JS** (WhatsApp/Facebook não executam JS → prévia sem título/imagem); `og:image` declarava 1200×630, real 1228×819 | No HTML cru, dimensões corretas |
| `lang` do documento | Ausente | `pt-BR` |
| Favicon | Nenhum declarado na LP | Pendente (ver abaixo) |

## Achados confirmados e corrigidos

1. **SEO dependente de JavaScript (crítico).** Todas as tags de `<head>` (title, description, canonical, OG, JSON-LD e o preload da imagem da hero) estavam dentro de `<helmet>`, injetadas pelo runtime só depois de baixar React + Babel do unpkg. Crawlers que não executam JS (prévia de link do WhatsApp/Facebook, vários robôs de IA) não viam nada disso. **Correção:** tags movidas para o `<head>` real; o runtime não as duplica (verificado: 1 title, 1 canonical, 1 FAQPage após renderizar).
2. **Preload da hero sem efeito (desempenho/LCP).** O `<link rel="preload">` com `fetchpriority="high"` só entrava após o JS. Agora o navegador começa a baixar a imagem da hero imediatamente. Preconnect de fontes e do unpkg também foram para o `<head>`.
3. **`og:image` com dimensões erradas.** Corrigido para 1228×819.
4. **Sem `lang`.** Adicionado `lang="pt-BR"`.
5. **Schema `Attorney`.** Adicionados `@id`, `sameAs` (Instagram, Facebook) e `hasMap`, todos já presentes na página.
6. **Alt do Dr. Oscar** genérico → "Dr. Oscar Vieira, advogado de família e divórcio — OAB/SP 442.118" (OAB já citada na página).
7. **Sitemap:** `lastmod` atualizado.

## Riscos e oportunidades não alterados (decisão do dono)

| Item | Por que não mudei | Próximo passo |
|---|---|---|
| `robots.txt` está em `/divorcio-sao-paulo/` | Buscadores só leem o `robots.txt` da raiz do domínio; este arquivo é ignorado | Adicionar `Sitemap: https://vieiraemarquesadvogados.com/divorcio-sao-paulo/sitemap.xml` ao robots.txt da raiz **ou** enviar o sitemap no Search Console |
| Favicon | O logo é horizontal (1848×410), não serve como ícone | Navegadores usam `/favicon.ico` da raiz do domínio; confirmar que o site principal tem um |
| `aggregateRating` (5,0 / 159) no schema da própria empresa | Google não exibe estrelas para avaliações auto-declaradas de LocalBusiness/Organization; não é penalidade, mas não gera rich result | Manter só se o número bater com o Perfil da Empresa no Google |
| Conteúdo renderizado no cliente | O texto existe no HTML cru, mas com placeholders `{{ }}` em partes dinâmicas (depoimentos, formulário); Google renderiza JS, outros robôs não | Longo prazo: exportar HTML pré-renderizado |
| React/Babel/Lenis via unpkg | Se o unpkg falhar, a página fica preta; Babel no navegador pesa no PageSpeed | Hospedar os arquivos junto da LP |
| Endereço em Boituva vs. "todo o estado" | Coerente com o texto da página ("Sede em Boituva, atendimento em todo o estado") | Nenhum |

## Verificação após publicar

1. "Ver código-fonte" da página publicada deve mostrar `<title>`, canonical e `og:image` antes do `<body>`.
2. Testar no [Rich Results Test](https://search.google.com/test/rich-results) (Attorney, FAQPage, BreadcrumbList).
3. Recolher a prévia no [Sharing Debugger do Facebook](https://developers.facebook.com/tools/debug/) e reenviar o link no WhatsApp.
4. Rodar pagespeed.web.dev e comparar o LCP mobile.

**Reverter:** `git revert` do commit desta revisão.
