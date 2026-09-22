Você vai atuar como um **Senior Full-Stack Engineer + Application Security Engineer + DevSecOps**, com experiência avançada em **Next.js, React, TypeScript/JavaScript, HTML, APIs, autenticação, headers de segurança, proteção de secrets, OWASP e segurança de aplicações web em produção**.

## OBJETIVO PRINCIPAL

Faça uma **auditoria técnica profunda de segurança neste projeto**, que utiliza Next.js e possui algumas partes legadas ou específicas em HTML/Index HTML.

O objetivo é **reduzir ao máximo a exposição desnecessária do código, informações internas, configurações, secrets, endpoints e lógica sensível no navegador**, mantendo o site funcionando exatamente como está.

### REGRA FUNDAMENTAL

**NÃO redesenhe o site.**
**NÃO altere layout.**
**NÃO altere identidade visual.**
**NÃO altere textos comerciais.**
**NÃO altere funcionalidades que já funcionam.**
**NÃO faça uma refatoração estética desnecessária.**

A missão é exclusivamente:

> **SEGURANÇA + LIMPEZA DO CÓDIGO + REDUÇÃO DE EXPOSIÇÃO + HARDENING**

---

# 1. PRIMEIRO: AUDITORIA, NÃO MODIFICAÇÃO

Antes de alterar qualquer arquivo:

1. Analise toda a estrutura do projeto.
2. Identifique seções Next.js, React, TypeScript/JavaScript e HTML.
3. Identifique arquivos `index.html`, páginas estáticas, componentes client-side e server-side.
4. Identifique APIs e rotas internas.
5. Identifique variáveis de ambiente.
6. Identifique possíveis secrets ou credenciais expostas.
7. Identifique informações internas aparecendo no navegador.
8. Analise o que aparece através do DevTools/F12.
9. Analise HTML gerado.
10. Analise JavaScript enviado ao cliente.
11. Analise source maps.
12. Analise comentários no código que estejam chegando ao frontend.
13. Analise mensagens de erro.
14. Analise endpoints expostos.
15. Analise headers HTTP.
16. Analise configurações do Next.js.
17. Analise dependências e versões vulneráveis.
18. Procure configurações inseguras de CORS, CSP, cookies e armazenamento.
19. Procure informações sensíveis armazenadas em `localStorage`, `sessionStorage` ou cookies inadequados.
20. Procure dados que deveriam estar exclusivamente no servidor sendo enviados para o cliente.

**Não altere nada ainda.**

Primeiro apresente um relatório organizado com:

* Problema encontrado
* Arquivo afetado
* Nível de risco: CRÍTICO / ALTO / MÉDIO / BAIXO
* Por que aquilo está exposto
* Impacto
* Correção recomendada
* Se a correção pode alterar comportamento existente

---

# 2. SEGURANÇA DO FRONTEND

Quero reduzir a exposição desnecessária no frontend.

Importante:

**Entenda que JavaScript executado no navegador sempre poderá ser inspecionado pelo usuário.**

Portanto, não tente criar soluções falsas como:

* bloquear F12;
* bloquear DevTools;
* bloquear Ctrl+U;
* bloquear botão direito;
* detectar abertura do DevTools;
* ofuscar tudo artificialmente;
* scripts anti-inspeção;
* esconder código usando truques de JavaScript.

Essas técnicas NÃO são consideradas segurança real.

Em vez disso, faça o correto:

### Mover para o servidor tudo aquilo que não precisa estar no cliente.

Verifique cuidadosamente:

* regras de negócio;
* chaves privadas;
* tokens;
* secrets;
* credenciais;
* lógica sensível;
* consultas privilegiadas;
* informações administrativas;
* configurações internas;
* dados de banco;
* tokens de APIs;
* service role keys;
* credenciais de terceiros.

Nada disso deve chegar ao bundle do navegador.

---

# 3. ENVIRONMENT VARIABLES

Audite completamente:

`.env`
`.env.local`
`.env.production`
`.env.development`

e todas as referências a:

`process.env`

Verifique especialmente variáveis com:

`NEXT_PUBLIC_`

Explique quais realmente precisam ser públicas.

### REGRA:

Qualquer secret deve permanecer exclusivamente no servidor.

Nunca exponha:

* API keys privadas;
* database credentials;
* service-role keys;
* tokens administrativos;
* secrets de autenticação;
* private keys;
* credenciais de serviços externos.

Se encontrar alguma secret exposta:

1. NÃO simplesmente apague sem entender o impacto.
2. Identifique onde ela é utilizada.
3. Migre a utilização para ambiente server-side quando possível.
4. Informe claramente que a credencial deverá ser ROTACIONADA se já tiver sido exposta.

---

# 4. NEXT.JS

Audite profundamente a configuração do Next.js.

Verifique:

* `next.config.js`
* `next.config.mjs`
* `next.config.ts`
* middleware
* API Routes
* Route Handlers
* Server Components
* Client Components
* Server Actions
* SSR
* SSG
* páginas públicas
* endpoints internos

Procure oportunidades para manter lógica sensível exclusivamente server-side.

Analise também:

* source maps em produção;
* exposição de informações de build;
* stack traces;
* mensagens de erro;
* headers;
* redirects;
* rewrites;
* configurações de imagem;
* configurações de domínio;
* configurações de CORS.

---

# 5. HTML / INDEX.HTML

Existem partes do projeto que utilizam HTML.

Faça uma auditoria específica nelas.

Procure:

* comentários internos;
* informações de desenvolvimento;
* URLs internas;
* endpoints;
* dados sensíveis;
* scripts desnecessários;
* atributos desnecessários;
* código duplicado;
* código morto;
* referências internas;
* credenciais;
* configurações expostas;
* mensagens deixadas pela IA durante desenvolvimento.

Limpe somente aquilo que for realmente desnecessário.

Não altere a estrutura visual ou funcional do site.

---

# 6. LIMPEZA DE CÓDIGO

Procure no projeto inteiro por:

* comentários de IA;
* comentários como "TODO";
* instruções internas;
* prompts;
* mensagens deixadas durante desenvolvimento;
* textos como "generated by AI";
* comentários explicando informações que não deveriam estar no código público;
* logs de debug;
* `console.log`;
* `console.error` desnecessários;
* informações de desenvolvimento;
* código morto;
* arquivos temporários;
* testes esquecidos no build;
* dados fictícios;
* credenciais de teste;
* endpoints de teste.

### IMPORTANTE

Não remova comentários úteis para manutenção.

Remova somente:

> informações internas, comentários desnecessários, rastros de desenvolvimento e conteúdo que não agrega valor ao código de produção.

O código final deve parecer **código profissional produzido e mantido por uma equipe humana**, sem mensagens ou rastros desnecessários de ferramentas de IA.

---

# 7. SOURCE MAPS

Verifique se source maps estão sendo disponibilizados em produção.

Analise se eles revelam:

* estrutura interna;
* nomes de arquivos;
* código-fonte;
* comentários;
* lógica interna;
* informações de desenvolvimento.

Se houver exposição desnecessária, corrija de maneira compatível com o ambiente de produção.

Não quebre debugging necessário.

---

# 8. HEADERS DE SEGURANÇA

Implemente, quando compatível com o projeto, uma política profissional de headers de segurança.

Avalie cuidadosamente:

* Content-Security-Policy (CSP)
* Strict-Transport-Security (HSTS)
* X-Content-Type-Options
* Referrer-Policy
* Permissions-Policy
* frame-ancestors / proteção contra clickjacking
* X-Frame-Options quando apropriado

### ATENÇÃO

Não implemente uma CSP genérica que quebre o site.

Primeiro identifique:

* scripts necessários;
* fontes;
* imagens;
* APIs;
* analytics;
* pagamentos;
* serviços externos;
* CDNs;
* integrações.

Depois crie uma política compatível e o mais restritiva possível.

---

# 9. COOKIES E SESSÕES

Audite cookies e autenticação.

Verifique:

* Secure
* HttpOnly
* SameSite
* domínio
* path
* duração
* armazenamento de tokens

Evite colocar tokens sensíveis em:

`localStorage`

quando houver alternativa server-side mais segura.

---

# 10. API E BACKEND

Audite todas as APIs.

Verifique:

* autenticação;
* autorização;
* validação de entrada;
* rate limiting;
* exposição de erros;
* enumeração de recursos;
* acesso direto a dados;
* parâmetros manipuláveis;
* CORS;
* métodos HTTP;
* dados retornados ao cliente.

### PRINCÍPIO

Nunca confie no frontend para segurança.

Toda autorização importante deve ser validada no servidor.

Exemplo:

Não basta esconder um botão de administrador.

O endpoint também precisa impedir acesso não autorizado.

---

# 11. BANCO DE DADOS

Se houver banco de dados ou Supabase:

audite:

* credenciais;
* policies;
* RLS;
* queries;
* acesso client-side;
* service role;
* exposição de tabelas;
* permissões.

A `service_role` ou equivalente jamais deve chegar ao navegador.

Verifique se o frontend consegue acessar dados que não deveria.

---

# 12. DEPENDÊNCIAS

Analise:

`package.json`

e lockfiles.

Procure:

* dependências desnecessárias;
* pacotes abandonados;
* versões vulneráveis;
* bibliotecas usadas somente durante desenvolvimento;
* dependências que podem ser removidas sem impacto.

Não atualize versões indiscriminadamente.

Primeiro identifique riscos e compatibilidade.

---

# 13. ERROS E LOGS

Em produção:

Não quero mensagens detalhadas revelando:

* stack trace;
* caminhos internos;
* nomes de arquivos;
* queries;
* banco;
* variáveis;
* estrutura interna;
* detalhes de infraestrutura.

As mensagens públicas devem ser seguras e profissionais.

Os detalhes técnicos devem permanecer nos logs apropriados do servidor.

---

# 14. PRINCÍPIO DE MÍNIMA EXPOSIÇÃO

Aplique o princípio:

> "Tudo que não precisa estar no cliente, não deve estar no cliente."

O navegador pode visualizar o código necessário para executar a interface.

Isso é normal.

O objetivo não é tornar o frontend "invisível".

O objetivo é garantir que:

**frontend = interface + lógica necessária ao cliente**

e

**backend/server = secrets + regras sensíveis + autorização + operações privilegiadas.**

---

# 15. NÃO FAZER

Não faça:

❌ bloquear F12
❌ bloquear DevTools
❌ bloquear Ctrl+U
❌ desabilitar botão direito como "segurança"
❌ scripts anti-inspeção
❌ esconder elementos apenas com CSS
❌ técnicas falsas de proteção
❌ ofuscação excessiva
❌ criptografar código frontend achando que isso impede inspeção
❌ alterar o design
❌ alterar UX
❌ trocar bibliotecas sem necessidade
❌ reescrever o projeto inteiro
❌ modificar funcionalidades sem justificativa

---

# 16. EXECUÇÃO EM ETAPAS

Depois da auditoria, trabalhe em etapas.

### ETAPA 1

Auditoria completa.

### ETAPA 2

Correções críticas de segurança.

### ETAPA 3

Redução de exposição frontend.

### ETAPA 4

Limpeza de código e rastros de desenvolvimento/IA.

### ETAPA 5

Headers e hardening.

### ETAPA 6

APIs, autenticação e autorização.

### ETAPA 7

Dependências.

### ETAPA 8

Validação final.

Após cada etapa:

* explique o que foi alterado;
* informe os arquivos;
* explique o motivo;
* confirme que não alterou o design;
* confirme que não alterou funcionalidades sem necessidade.

---

# 17. TESTE FINAL

Depois das alterações, faça uma auditoria final simulando um usuário externo.

Verifique:

* DevTools;
* Network;
* Sources;
* Application;
* Console;
* HTML;
* JS bundles;
* source maps;
* headers;
* cookies;
* APIs;
* respostas HTTP;
* mensagens de erro.

Procure novamente por:

* secrets;
* tokens;
* credenciais;
* comentários internos;
* mensagens de IA;
* endpoints administrativos;
* dados sensíveis;
* informações de desenvolvimento.

---

# 18. REGRA DE SEGURANÇA CRÍTICA

Se você encontrar algo que possa causar:

* quebra de produção;
* perda de dados;
* alteração de pagamentos;
* alteração de autenticação;
* alteração de banco;
* quebra de integração;
* indisponibilidade do site;

NÃO aplique automaticamente.

Pare e me informe:

1. O problema.
2. O risco.
3. A correção proposta.
4. O impacto.
5. O arquivo afetado.

Aguarde minha autorização antes dessa alteração específica.

---

# RESULTADO ESPERADO

Quero terminar com um projeto:

* mais seguro;
* profissional;
* limpo;
* organizado;
* com menor exposição desnecessária;
* sem secrets no frontend;
* sem rastros desnecessários de IA;
* sem informações internas no HTML/JS público;
* com APIs mais protegidas;
* com headers de segurança adequados;
* com configuração de produção endurecida;
* mantendo o mesmo design;
* mantendo a mesma experiência do usuário;
* mantendo as funcionalidades existentes.

### REGRA FINAL

**Não tente esconder o que tecnic
amente precisa ser público.**

Faça segurança real, baseada em arquitetura, isolamento server/client, autenticação, autorização, validação, headers, proteção de secrets e princípio de menor privilégio.

Antes de modificar qualquer coisa, faça a auditoria e me mostre o diagnóstico.

**Comece agora pela ETAPA 1 — AUDITORIA. Não faça alterações ainda.**
