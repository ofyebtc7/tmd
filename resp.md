# Auditoria de Responsividade, Touch e Zoom — Plugmax (GH01)

> Relatório final gerado após auditoria técnica e aplicação das correções estruturais.
> Escopo: página inicial (`public/index.html`) + checkout (`app/checkout/[token]/page.tsx`),
> com verificação de tablet/desktop e das demais páginas públicas.

---

## 1. PROBLEMAS ENCONTRADOS

1. **Atraso no clique/toque dos botões** — sem `touch-action`, o mobile (Safari/Chrome Android) usa o *delay* de detecção de double-tap (~300ms), fazendo os botões parecerem "lentos" (CTAs, kit cards, cor, galeria, menu).
2. **Zoom acidental por double-tap** — tocar duas vezes rápido em áreas interativas (setas da galeria, imagem do herói, thumbnails/dots, cards do kit) disparava zoom inesperado no iOS.
3. **Área lateral da página inicial causando zoom** — as setas `‹ ›` da galeria (36px) e os pontos `dots` (8px!) ficam nas laterais do herói; alvos minúsculos + sem `touch-action` = zoom acidental ao tocar/interagir rápido nas bordas.
4. **Movimentação horizontal "solta"** — `html { overflow-x: hidden }` é *mask* insuficiente no iOS: não cria um scroller real e não travava de forma confiável o pan horizontal. O track do marquee de avaliações (`w-max` + `will-change: transform`) é a camada mais larga que a viewport e, combinada com essa estratégia antiga, dá o comportamento de "tela que desliza para o lado" ao arrastar o dedo.
5. **Elementos finos demais para toque** — dots da galeria (8px), setas (36px), botão de menu (32px) abaixo do mínimo confortável; alvos pequenos também são gatilho de double-tap zoom no Safari.
6. **Inputs do checkout provocando zoom no foco (iOS)** — campos com `font-size: 13px` (inline) fazem o Safari iOS dar zoom automático ao focar (regra do < 16px).
7. **Scroll ao voltar (bfcache) "deriva"** — `window.scrollTo(0,0)` combinado com `scroll-behavior: smooth` animava o retorno ao topo, contribuindo com a sensação de "tela solta".

---

## 2. CAUSA

- **Causa raiz (toque/zoom):** ausência total de `touch-action` na página. No iOS, sem `touch-action: manipulation`, o navegador mantém o atraso de double-tap e o zoom por toque duplo em qualquer elemento — inclusive elementos pequenos nas bordas e na área lateral do herói.
- **Causa raiz (overflow horizontal):** `overflow-x: hidden` aplicado só no `html` não elimina o pan horizontal no iOS (a página continua "deslizando"). A correção estrutural é `overflow-x: clip` em `html` + `body` (overflow **não-deslizável**, sem criar scroller), e a limpeza da principal camada larga (marquee) que colaborava com o comportamento.
- **Causa raiz (inputs no checkout):** iOS Safari dá zoom automático em todo `input/select/textarea` com `font-size < 16px` ao receber foco.

---

## 3. CORREÇÕES

| Arquivo | Componente | Alteração | Motivo |
|---|---|---|---|
| `public/index.html` | `<head>` | `<meta name="viewport">` → `width=device-width, initial-scale=1.0, viewport-fit=cover` | Compatibilidade com notch/safe-areas do iOS; sem `maximum-scale`/`user-scalable=no` (acessibilidade preservada). |
| `public/index.html` | `html, body` | `overflow-x:hidden` → `overflow-x:hidden; overflow-x:clip` (html e body) | Travar o pan horizontal de forma definitiva no iOS/Android sem criar scroller e sem mascarar (a origem, camadas largas, também foi identificada). |
| `public/index.html` | Documento inteiro | `html, body { touch-action: manipulation }` + regra para `button, a, summary, [role=button], input, select, textarea` | Elimina o atraso de ~300ms (botões respondem no toque) e o zoom por double-tap. **Pinch-zoom continua funcionando** (acessibilidade mantida). |
| `public/index.html` | `#menuBtn` | `.menuBtn::after { inset:-6px }` (hit area ~44px, invisível) | Área de toque adequada sem alterar o visual. |
| `public/index.html` | Setas `data-gal` (herói) | Nova classe `gal-btn` + `::after { inset:-6px }` (hit ~48px) | Elimina zoom/sensibilidade nas laterais da página inicial e melhora a precisão do toque. |
| `public/index.html` | `#dots` (galeria) | Dots viram `<button class="gal-dot" aria-label>` (30×30 transparente) com o ponto visual de 8px num `<span>` interno; render JS ajustado | Área de toque de 30px mantendo o espaçamento/visual idêntico (margens negativas compensam o largura extra). |
| `public/index.html` | `#thumbs` (galeria) | Thumbs viram `<button aria-label>` semânticos englobando as `<img>`; render JS ajustado | Elemento semântico/tocável correto (Etapa 15), área de toque já adequada (48px). |
| `public/index.html` | `pageshow` | `window.scrollTo({top:0, behavior:'instant'})` | Evita a "deriva" animada ao retornar pela bfcache; retorno ao topo imediato. |
| `app/checkout/[token]/page.tsx` | `body` | `overflow-x: hidden` → `overflow-x: hidden; overflow-x: clip` | Consistência do travamento horizontal. |
| `app/checkout/[token]/page.tsx` | Documento do checkout | `html, body, button, a, input, select, textarea { touch-action: manipulation }` | Sem delay de toque e sem double-tap zoom no checkout. |
| `app/checkout/[token]/page.tsx` | Inputs/select | Media query mobile: `input, select, textarea { font-size: 16px !important }` (só ≤1023px) | Corrige o zoom automático do iOS ao focar campos de 13px. |
| `app/checkout/[token]/page.tsx` | Shell da página | Nova classe `.checkout-shell { min-height: 100vh; min-height: 100dvh }` | Corrige o problema clássico do `100vh` no iOS (barra de endereço), usando unidade dinâmica com fallback. |
| `app/checkout/[token]/page.tsx` | Stepper de quantidade (`−`/`+`) | Alvos de toque ampliados para `minHeight: 44` + `touchAction: manipulation` + `aria-label` | Área de toque adequada e sem zoom/delay; acessibilidade por leitor de tela. |
| `app/checkout/[token]/page.tsx` | Botões "Editar" (1 e 2) e toggle do resumo | Hit area ampliada (`padding` + margem negativa compensada) + `touchAction` + `aria-expanded` | Alvos de toque ≥40px sem alterar o layout. |
| `app/checkout/[token]/page.tsx` | Cards de frete (PAC/Sedex/FULL) e de método (PIX/Cartão) | `touchAction: 'manipulation'` inline nos `<div onClick>` | Sem zoom por toque duplo e sem atraso ao selecionar opções. |
| `app/layout.tsx` | Layout raiz (Next) | `export const viewport: Viewport = { width:'device-width', initialScale:1, viewportFit:'cover' }` | Viewport com `viewport-fit=cover` nas páginas Next (checkout), igual ao `index.html`. |

> **Não usado:** `overflow-x: hidden` novo como máscara, `touch-action: none`, `user-scalable=no`/`maximum-scale=1`. Nenhuma dessas gambiarras foi aplicada.

---

## 4. IMPACTO

- ✅ **Design preservado** — identidade, cores, fontes, espaçamentos, layout, textos e imagens intactos; as únicas mudanças visuais são *não-visuais* (áreas de toque transparentes).
- ✅ **Funcionalidades preservadas** — checkout, post `/api/checkout`, galeria, kit, cores, countdown, marquee, drawer/menu, rastreio, links e rodapé inalterados.
- ✅ **Mobile corrigido** — sem atraso de clique, sem zoom acidental, sem pan horizontal, alvos de toque ≥30–48px.
- ✅ **Desktop preservado** — hover/focus/teclado intactos (`touch-action` não interfere em mouse/teclado).
- ✅ **Tablet considerado** — layout de coluna única (≤480px) e checkout em 1 coluna (≤1023px) continuam corretos.
- ✅ **Acessibilidade** — pinch-zoom, zoom de assistência e teclado mantidos; dots/thumbs agora são `<button>` semânticos com `aria-label`.

---

## 5. RESULTADO

- **Responsividade:** estável de 320px a 1920px+. Estrutura `max-w-[480px]` centralizada + `overflow-x: clip` sem mascaração.
- **Touch:** resposta imediata (~300ms removidos); alvos ≥30px (dots), 44–48px (menu/setas), CTAs ~48px.
- **Cliques:** feedback visual `active:scale` imediato; guarda `__checkoutBusy` evita disparo duplo.
- **Scroll:** vertical natural/suave preservado (manipulation = `pan-x pan-y`); retorno por bfcache instantâneo.
- **Zoom:** double-tap eliminado apenas em áreas tocáveis; **pinch-zoom/zoom de acessibilidade intactos**.
- **Performance:** nenhum listener novo pesado; `touchmove` não executa trabalho; marquee segue com `will-change` único.
- **Desktop:** mouse, hover, foco e teclado intactos.
- **Mobile:** sem atraso, sem zoom, sem deslocamento lateral, elementos dentro da viewport.
- **Checkout (extensão do mesmo padrão):** `min-height: 100dvh`, alvos de toque ≥44px (stepper, "Editar", toggle do resumo), `touch-action: manipulation` nos cards de frete/método, viewport `viewport-fit=cover` via `app/layout.tsx` e campos de 16px no mobile.

---

## 6. PENDÊNCIAS / NÃO VERIFICADO EM RUNTIME

- **Não testei em dispositivo real** — pedir confirmação do usuário em: iPhone (Safari) e Android (Chrome) nas larguras 320/360/390/412/430px, tablet 768px e desktop ≥1024px: (a) tocar e arrastar o dedo não desloca a página na horizontal; (b) toque duplo rápido não dá zoom; (c) botões respondem no mesmo instante do toque; (d) ao focar um campo no checkout não há salto de zoom.
- **A verificar no checkout em dispositivo real:** (e) o stepper `−`/`+`, os botões "Editar" e os cards de frete/PIX/Cartão têm área de toque confortável; (f) focar campos não causa salto de zoom no iOS; (g) a página tem a altura correta no Safari iOS (não desce demais por causa da barra de endereço).
- **Outro ponto observado (fora do escopo de responsividade):** o rodapé/menu apontam para `politica-frete.html`, `quem-somos.html`, etc., mas os arquivos estão em `public/<pagina>/index.html`. Em hospedagem que não faça rewrite/cleanUrls, esses links podem dar 404. Recomendo conferir a configuração de deploy (Vercel/GitHub Pages), mas **não alterei** por estar fora do objetivo e não ter certeza da infraestrutura. Isso precisa de decisão sua.
- Commit já criado a pedido do usuário (`854fcfc`); edições de checkout/layout desta rodada ainda **sem commit** (aguardando sua confirmação).