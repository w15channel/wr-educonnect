# Tratamento Integral para Links do Google NotebookLM

## Resumo das Correções Implementadas

1. **Restrições de Segurança do Google Identificadas**:
   - Links do Google NotebookLM (`notebooklm.google.com` ou `notebook.google.com`) entregam páginas web interativas com autenticação Google e cabeçalho `x-frame-options: DENY`.
   - Por esse motivo, navegadores não permitem que links diretos do NotebookLM sejam tocados como áudio bruto em `<audio>` nem renderizados em `<iframe>` comum (exibindo tela cinza de "recusou a conexão").

2. **Solução para o Podcast na Apostila**:
   - **Quando o link for do NotebookLM**: O card do podcast exibe o botão **"Abrir Podcast no NotebookLM"** (abrindo o caderno interativo diretamente para o aluno) acompanhado de **"Ouvir Leitura por Voz (Voz Eclipse)"** como alternativa integrada imediata.
   - **Upload Direto para Tocar Nativo**: Adicionada a rota `/api/upload-media` no servidor Node.js. O administrador pode simplesmente baixar o áudio no NotebookLM (menu de 3 pontinhos `⋮` > "Fazer download") e clicar em **"Carregar Áudio Local"** no Estúdio. O arquivo é salvo no servidor e toca nativamente no player integrado da apostila com controle de tempo e velocidade.

3. **Solução para as Aulas em Vídeo (/lessons)**:
   - Em `VideoPlayer.jsx` e `videoEmbed.js`, links do NotebookLM são identificados como `kind: 'notebooklm'`.
   - Ao invés de um iframe quebrado, a plataforma renderiza um **card oficial do Google NotebookLM** com design temático, título da aula, descrição pedagógica e botão direto com 1 clique para acessar as anotações, perguntas e fontes no NotebookLM.
   - Para vídeos convencionais, o player aceita YouTube, Vimeo, Google Drive e OneDrive normalmente.
