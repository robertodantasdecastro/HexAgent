### Prompt for Antigravity AI: Global Project Revision and Architecture Update (English)

**Context:**
The `HexAgentGUI` project requires a structural consolidation to align with its new operational concept: a multi-platform interface for AI customization backed by `hexstrike-ai`, focusing on security and offline capabilities (Kali Linux base). The current configuration, lifecycle management, and dependency integration need synchronization and optimization.

**Objective:**
Revise the entire project structure to update the main task goals. **Perform a Deep Structural Analysis** of the codebase, enforcing **Strict OOP Compliance** to ensure scalability and evolution. Focus on synchronizing the user configuration structure (`~/.hexagent-gui/`), unifying communication with the dependent `hexstrike-ai` application, optimizing the application lifecycle (Load/Connect/Close), and rewriting the core documentation to reflect the new "HexStrike-AI" identity.

**Instructions:**

0.  **Codebase Hygiene & Architecture (Deep Analysis):**
    *   **Full Scan:** Analyze EVERY file in the `hexagent-gui` structure.
    *   **Strict OOP:** Refactor any procedural code into robust, modular classes.
    *   **Cleanup:** Identifiy and remove ALL redundancies, duplicate functions, and obsolete code.
    *   **Consistency:** Ensure naming conventions and logic are consistent throughout to prevent future technical debt.
    *   **Security:** Verify that the architecture promotes secure data handling and execution.

1.  **Language Policy:**
    *   **Strict Rule:** All code comments and documentation MUST be in **Portuguese (BR)** and **English**.

2.  **Configuration System & User Data Architecture:**
    *   **Analysis:** Explore the post-installation user configuration directory at `~/.hexagent-gui/`. Analyze all subfolders, files, and variables related to system functioning, configuration, and personalization.
    *   **Synchronization:** Compare this structure with the main system folder `HexAgentGUI` to identify unimplemented or partial features.
    *   **Restructuring:** Create a optimized structure for `~/.hexagent-gui/` containing *only* useful and active files, considering feature evolution.
    *   **Templates & Installation:**
        *   Update `/HexAgentGUI/config_templates/` to reflect this new optimized structure.
        *   Revise and update the `install.sh` script to ensure it correctly synchronizes these templates to the user directory during installation/update.

3.  **Dependent Application Analysis (`hexstrike-ai`):**
    *   **Integration Audit:** Analyze the `hexstrike-ai` application in detail. Map all resources and communication channels with `HexAgentGUI`.
    *   **Redundancy Removal:** Ensure there is **exactly one** clear communication channel. Methodically remove all redundancies that could cause bugs or errors.
    *   **VENV Configuration:** specific references to the virtual environment (venv) must be unique for `hexstrike-ai` and `HexAgentGUI`.
        *   These paths must be configurable in the "System Settings" modal.
        *   They should be referenced (read-only) in the "HexStrike-AI" tab of the "AI Configuration" modal.

4.  **Application Lifecycle Refactoring:**
    *   **LOAD Phase:**
        *   First, load all files/variables from `~/.hexagent-gui/`.
        *   Start necessary subsystems, specifically `hexstrike-ai`.
        *   Attempt to connect to the configured AI Engine. If no configuration exists, open the **AI Configuration Guide/Modal** immediately.
    *   **AI Engine Setup (Panel/Guide):**
        *   **Selection:** Allow choice between Online (ChatGPT, DeepSeek, Claude via API Key) or Offline/Local Network (LM Studio, Ollama).
        *   **Online Mode:** Input fields for API Key and selected provider endpoints (pre-configured connection methods based on research). Include a **"Test Connection"** button that prompts the server and displays the raw response or suggests fixes for errors.
        *   **Offline/Local Mode:** Focus initially on **LM Studio**. Provide configuration fields for Host (Local/IP/Remote), Port, and other parameters.
        *   **MCP Connection (Inference):** Add support for **Model Context Protocol (MCP)** to use external IDEs (e.g., Cursor, Antigravity) as the AI engine.
        *   **Dynamic Connection:** The system must establish dynamic connections based on the selection, following `hexstrike-ai` instructions for integration.
    *   **Security Initialization:**
        *   **Block** potentially dangerous local ports (e.g., `8888` used by HexStrike, `5000` local server) by default upon startup.
        *   Allow user override via the "Services Panel" or "HexStrike-AI Config" tab.
    *   **CLOSE Phase:**
        *   Terminate **all** processes initiated by the system (`hexstrike-ai`, background workers).
        *   Restore pre-existing security rules.

5.  **UI/UX Logic Review:**
    *   Methodically revise the logic of all panels and modals (Services, AI Configuration, System Settings).
    *   Eliminate functional redundancies.
    *   Verify that *all* configuration data is correctly read from and saved to `~/.hexagent-gui/`.

6.  **Documentation Rewrite (README.md):**
    *   **Concept Shift:** Rewrite `README.md` entirely. Remove *all* references to "HexSecGPT". Use **"HexStrike-AI"** exclusively.
    *   **New Description:** Explain `HexAgent` as a multi-platform AI engine interface dedicated to AI personalization and security support via `hexstrike-ai` (Kali Linux based).
    *   **Value Prop:** Highlight open-source nature, offline capability, security focus, and independence for critical testing environments.
    *   **Installation/Usage:** Update instructions to match the new architecture.

7.  **Future Feature Prep (Monitoring & Personalization):**
    *   **Passive Monitoring:** Prepare the architecture for a future module that passively monitors for intrusion attempts, identifies attackers, and plans countermeasures based on behavioral analysis.
    *   **MCP Services Integration:** Prepare the architecture to integrate **MCP Services** that act in conjunction with `hexstrike-ai` for OS and application control (e.g., `mcp-kali-server`).
    *   **Personalization:** Create a task to evolve the personalization model (synced via `install.sh` and `config_templates`), refactoring the entire configuration system (AI & System) to support this.

---

### Prompt para Antigravity AI: Revisão Global de Projeto e Atualização de Arquitetura (Português-BR)

**Contexto:**
O projeto `HexAgentGUI` requer uma consolidação estrutural para se alinhar ao seu novo conceito operacional: uma interface multiplataforma para personalização de IA apoiada pelo `hexstrike-ai`, com foco em segurança e capacidades offline (base Kali Linux). A configuração atual, o gerenciamento do ciclo de vida e a integração de dependências precisam de sincronização e otimização.

**Objetivo:**
Revisar toda a estrutura do projeto para atualizar as metas principais da task. **Realizar uma Análise Estrutural Profunda** da base de código, impondo **Conformidade Estrita com POO** para garantir escalabilidade e evolução. Focar na sincronização da estrutura de configuração do usuário (`~/.hexagent-gui/`), unificar a comunicação com a aplicação dependente `hexstrike-ai`, otimizar o ciclo de vida da aplicação (Load/Connect/Close) e reescrever a documentação central para refletir a nova identidade "HexStrike-AI".

**Instruções:**

0.  **Higiene da Base de Código e Arquitetura (Análise Profunda):**
    *   **Varredura Completa:** Analise CADA arquivo na estrutura do `hexagent-gui`.
    *   **POO Estrita:** Refatore qualquer código procedural em classes modulares e robustas.
    *   **Limpeza:** Identifique e remova TODAS as redundâncias, funções duplicadas e códigos obsoletos.
    *   **Consistência:** Garanta que convenções de nomenclatura e lógica sejam consistentes em todo o projeto para prevenir dívida técnica futura.
    *   **Segurança:** Verifique se a arquitetura promove o manuseio seguro de dados e execução.

1.  **Política de Idioma:**
    *   **Regra Rígida:** Todos os comentários de código e documentação DEVEM estar em **Português (BR)** e **Inglês**.

2.  **Sistema de Configuração e Arquitetura de Dados do Usuário:**
    *   **Análise:** Explore a pasta de configuração pós-instalação do usuário em `~/.hexagent-gui/`. Analise todas as subpastas, arquivos e variáveis que fazem referência ao funcionamento, configuração e personalização.
    *   **Sincronização:** Compare essa estrutura com a pasta do sistema principal `HexAgentGUI` para identificar recursos não implementados ou parciais.
    *   **Reestruturação:** Crie uma nova estrutura otimizada para `~/.hexagent-gui/` contendo *somente* arquivos úteis e em uso, considerando a evolução dos recursos.
    *   **Templates e Instalação:**
        *   Atualize `/HexAgentGUI/config_templates/` para refletir essa nova estrutura otimizada (Pasta /HexAgentGUI/ estará localizadao no local de instalação do git clone realizado pelo usuário, deve indicar buscar hexstrike-ai provavelmente na raiz onde baixou `/HexAgentGUI/`, se não encontrar pergutar ao usuário e setar no arquivo de configuração em `~/.hexagent-gui/`).
       
3.  **Análise da Aplicação Dependente (`hexstrike-ai`):**
    *   **Auditoria de Integração:** Analise a aplicação `hexstrike-ai` detalhadamente. Mapeie todos os recursos e canais de comunicação com o `HexAgentGUI`.
    *   **Remoção de Redundância:** Garanta que exista **apenas um** canal de comunicação pleno. Analise metodicamente em busca de redundâncias que geram bugs e erros, corrigindo tudo.
    *   **Configuração de VENV:** As referências aos arquivos de configuração para o ambiente virtual (venv) devem ser únicas para o `hexstrike-ai` e para o `HexAgentGUI`.
        *   Esses caminhos devem ser configuráveis no modal de "Configuração do Sistema".
        *   Devem ser referenciados (somente leitura) na guia "HexStrike-AI" do modal de configuração de IA.

4.  **Refatoração do Ciclo de Vida da Aplicação:**
    *   **Fase LOAD (Carregamento):**
        *   Ao abrir, carregue primeiro todos os arquivos e variáveis da pasta de configuração do usuário `~/.hexagent-gui/`.
        *   Inicie os subsistemas necessários, especificamente o `hexstrike-ai`.
        *   Conecte-se ao motor de IA configurado. Se não existir configuração, abra o **Guia/Modal de Configuração** imediatamente.
    *   **Configuração do Motor de IA (Painel/Guia):**
        *   **Seleção:** Permita escolher entre Online (ChatGPT, DeepSeek, Claude via API Key) ou Offline/Rede Local (LM Studio, Ollama).
        *   **Modo Online:** Campos para API Key e endpoints do provedor selecionado (métodos de conexão pré-configurados baseados em pesquisa). Inclua botão **"Testar Conexão"** que retorna a resposta do servidor ou sugestões de correção.
        *   **Modo Offline/Local:** Focar inicialmente no **LM Studio**. O painel deve conter campos para Host (Local/IP/Remoto), Porta e outros parâmetros. Inclua botão **"Testar Conexão"** que retorna a resposta do servidor ou sugestões de correção.
        *   **Conexão MCP (Inferência):** Adicionar suporte ao **Model Context Protocol (MCP)** para utilizar IDEs externas (ex: Cursor, Antigravity) como motor de IA.
        *   **Conexão Dinâmica:** O sistema deve fazer conexões dinâmicas baseadas na escolha, seguindo instruções do `hexstrike-ai` para integração.
    *   **Inicialização de Segurança:**
        *   **Bloquear** portas locais potencialmente perigosas e iniciadas pelo hexagentgui, como o hexstrike-ai e o backend do hexagentgui (exp: `8888` usada pelo HexStrike, `5000` servidor local) por padrão ao iniciar.
        *   Permitir liberação pelo usuário no "Painel de Serviços" ou guia de configuração do "HexStrike-AI".
    *   **Fase CLOSE (Encerramento):**
        *   Encerrar **todos** os processos iniciados pelo sistema (`hexstrike-ai`, workers de fundo).
        *   Restaurar todas as regras de segurança pretéritas à inicialização.

5.  **Revisão da Lógica UI/UX:**
    *   Revise metodicamente a lógica de todos os painéis e modais (Serviços, Configurações de IA, Configurações do Sistema).
    *   Elimine redundâncias funcionais.
    *   Verifique se *todos* os dados, configurações e personalizações estão sendo lidos e salvos corretamente na pasta de usuário `~/.hexagent-gui/`.

6.  **Reescrita da Documentação (README.md):**
    *   **Mudança de Conceito:** Reescreva todo o `README.md`. Remova *tudo* que faz referência a "HexSecGPT". Use exclusivamente **"HexStrike-AI"**.
    *   **Nova Descrição:** Explique o `HexAgent` como uma multiplataforma de motores de IA associada à personalização pelo HexAgent em suporte com o `hexstrike-ai` (base Kali Linux).
    *   **Proposta de Valor:** Destaque código aberto, uso offline, segurança e independência em ambientes de testes críticos.
    *   **Instalação/Uso:** Atualize instruções para condizer com a nova arquitetura.

7.  **Preparação de Recursos Futuros (Monitoramento e Personalização):**
    *   **Monitoramento Passivo:** Prepare a arquitetura para um módulo futuro de monitoramento passivo completo (detecção de invasão, identificação de atacante, contra-medidas).
    *   **Integração de Serviços MCP:** Prepare a arquitetura para integrar **Serviços MCP** que agem em conjunto com o `hexstrike-ai` para controle do sistema operacional e aplicativos (ex: `mcp-kali-server`).
    *   **Personalização:** Crie uma task para evoluir o modelo de personalização (sincronizado via `install.sh` e `config_templates`), com integração na GUI e refatoração completa dos sistemas de configuração.

****Sincronizar o estado atual com o plano de desenvolvimento de longo prazo, garantindo padrões POO, escalabilidade e sincronização total de todas as variáveis atuais da interface GUI.****


### Prompt Complementar: Atualização do Cronograma de Longo Prazo

**Objetivo:** Realize uma análise profunda de todo o projeto e histórico de chat para atualizar o roadmap de desenvolvimento.

**Instruções de Execução:**

1.  **Análise de Estado Atual:**
    *   Avalie a implementação final da interface GUI e a sincronização com o backend `hexstrike-ai`.
    *   Verifique a integridade dos arquivos em `~/.hexagent-gui/` e a eficácia do script `install.sh`.

2.  **Atualização do Roadmap (Long Term):**
    *   **Fase de Monitoramento:** Detalhe os marcos para o "Módulo de Monitoramento Passivo", definindo requisitos de rede e triggers de detecção.
    *   **Ecossistema MCP:** Planeje a integração sequencial de servidores MCP (ex: `mcp-kali-server`, `mcp-filesystem`) para expandir a capacidade de execução do agente.
    *   **Personalização Dinâmica:** Proponha um sistema de "Plugins de Comportamento" ou "Profiles de Engajamento" que possam ser alterados via GUI.

3.  **Critérios de Qualidade:**
    *   Mantenha a conformidade rigorosa com **POO** e **SOLID**.
    *   Garanta que toda nova funcionalidade proposta seja agnóstica a SO (multiplataforma), mas otimizada para o ambiente base Kali Linux.
    *   Documente as dependências futuras para evitar quebras de retrocompatibilidade.

4.  **Entrega:**
    *   Gere um arquivo `ROADMAP.md` atualizado ou uma seção detalhada de cronograma, dividida por marcos (Milestones), priorizando segurança, performance e independência offline.

**Sincronize todas as variáveis de estado da GUI com este novo plano para garantir que o desenvolvimento futuro seja refletido na interface de usuário de forma nativa.**


### Prompt de Sincronização de Memória e Atualização de Roadmap (Contexto Completo)

**Objetivo:** Atuar como Arquiteto de Sistemas Sênior para realizar uma análise exaustiva do projeto `HexAgentGUI` e consolidar o conhecimento acumulado em um novo roadmap estratégico, garantindo continuidade absoluta e evolução sem dívida técnica.

---

**1. Contexto e Identidade do Projeto:**
*   **Nome:** HexAgentGUI (Interface para o ecossistema `hexstrike-ai`).
*   **Missão:** Prover uma interface multiplataforma para personalização de IA focada em segurança cibernética, operando primariamente em ambiente Kali Linux com suporte total a modelos offline (LM Studio, Ollama) e protocolos MCP.
*   **Transição Crítica:** O projeto abandonou a nomenclatura "HexSecGPT" em favor de **HexStrike-AI**. Toda a lógica e documentação devem refletir essa mudança.

**2. Estado Atual da Arquitetura (Para Análise):**
*   **Configuração:** Sincronização entre a pasta de instalação e `~/.hexagent-gui/`.
*   **Ciclo de Vida:** Implementação das fases LOAD (carregamento de configs/IA), CONNECT (estabilização de túneis e serviços) e CLOSE (limpeza de processos e restauração de regras de firewall).
*   **Integração:** Comunicação via venv dedicada com o backend `hexstrike-ai`.
*   **Segurança:** Bloqueio automático de portas sensíveis (`8888`, `5000`) no startup.

**3. Diretrizes de Execução (Strict Rules):**
*   **POO e SOLID:** Todo código deve ser modular, baseado em classes e altamente escalável.
*   **Bilinguismo:** Comentários e documentação técnica em **Inglês (Primário)** seguido de **Português-BR**.
*   **Higiene de Código:** Identificar e remover redundâncias entre a GUI e o backend.

**4. Tarefas de Memória e Planejamento:**
1.  **Auditoria de Código:** Analise a estrutura de diretórios atual, o script `install.sh` e os `config_templates`. Verifique se a lógica de persistência em `~/.hexagent-gui/` está íntegra.
2.  **Sincronização de Variáveis:** Garanta que todas as variáveis de estado da GUI (Configurações de IA, Serviços, System Settings) estejam mapeadas para o plano de longo prazo.
3.  **Atualização do ROADMAP.md:**
    *   **Milestone 1 (Estabilização):** Refatoração POO completa e limpeza de referências legadas.
    *   **Milestone 2 (Ecossistema MCP):** Integração de `mcp-kali-server` e controle de filesystem.
    *   **Milestone 3 (Monitoramento Passivo):** Arquitetura para detecção de intrusão e contramedidas automatizadas.
    *   **Milestone 4 (Personalização):** Sistema de perfis de comportamento dinâmicos via GUI.

**5. Entrega Esperada:**
*   Um resumo executivo do estado técnico atual.
*   O arquivo `ROADMAP.md` atualizado e detalhado.
*   Uma lista de "Próximos Passos Imediatos" para a próxima sessão de codificação.

---
**Instrução Final:** "Com base nestas informações e na análise dos arquivos do repositório, assuma o controle do desenvolvimento e proponha a primeira refatoração necessária para alinhar o sistema ao novo Roadmap."




### **PROMPT DE REVISÃO E REESTRUTURAÇÃO DO MÓDULO DE INFERÊNCIA IA**

**Objetivo:** Realizar uma análise profunda do projeto HexAgentGUI para sincronizar o estado atual com o plano de desenvolvimento de longo prazo, garantindo padrões POO, escalabilidade e sincronização total de todas as variáveis atuais da interface GUI. Com esse conhecimento como base, Realize uma auditoria completa e refatoração do subsistema de IA, priorizando a integração entre a GUI e o backend de inferência, otimizando a lógica de comandos e a experiência do usuário nos modos Chat e Comando.

---

**1. Contexto Técnico e Auditoria (Technical Context & Audit):**
*   **Análise de Código:** Mapear todas as funções de inferência existentes no backend e sua comunicação com a GUI. Identificar redundâncias e gargalos de performance.
*   **Sincronização de Estado:** Garantir que o estado da IA (modelos, parâmetros, histórico) esteja perfeitamente sincronizado entre a interface e o motor de execução.
*   **Higiene de Código:** Identificar e remover redundâncias entre a GUI e o backend, garantindo que a lógica de inferência seja centralizada e reutilizável.

**2. Reestruturação do Módulo de Inferência (Inference Module Restructuring):**
*   **Arquitetura POO (SOLID):** Implementar uma estrutura de classes modular para gerenciar diferentes tipos de respostas (Texto, Comandos, Sugestões).
*   **Blocos de Resposta:** Padronizar o modelo de blocos de resposta para facilitar o parsing e a exibição dinâmica na GUI, revisando toda a lógica de controle de chat.

**3. Refatoração dos Modos de Operação (Operation Modes Refactoring):**
*   **Modo Chat (Chat Mode):**
    *   Revisar o fluxo de comunicação: Operador <-> IA <-> Comandos do Sistema.
    *   Analisar e revisar a lógica de funcionamento e interação entre os componentes.
*   **Modo Comando (Command Mode):**
    *   Implementar funcionalidade de terminal de sistema assistido por IA.
    *   Habilitar inferência em comandos: a IA deve auxiliar na construção e execução de comandos complexos baseada no contexto.

**4. Diretrizes de Execução (Execution Guidelines):**
*   **Bilinguismo:** Todos os comentários e documentação técnica devem ser em **Inglês (Primário)** seguido de **Português-BR**.
*   **Otimização:** Analisar pastas e arquivos para identificar funções e recursos que possam ser aproveitados, garantindo uma estrutura limpa e intercomunicável.
*   **Documentação:** Atualizar todos os arquivos do projeto com comentários bilíngues e revisar a documentação global do projeto.

**5. Tarefas de Memória e Planejamento (Memory & Planning Tasks):**
1.  **Auditoria de Status:** Analisar o progresso das tasks atuais e elevar a reestruturação da IA para a prioridade máxima.
2.  **Sincronização de Variáveis:** Mapear todas as variáveis de estado da GUI (Configurações de IA, Serviços) para o plano de longo prazo.
3.  **Atualização do ROADMAP.md:**
    *   **Milestone 1 (IA Core):** Refatoração POO do módulo de inferência e comandos.
    *   **Milestone 2 (Terminal Híbrido):** Estabilização do Modo Comando com auxílio de IA.

**6. Entrega Esperada (Expected Delivery):**
*   Resumo executivo do estado técnico atual com foco no módulo de IA.
*   Código refatorado e modularizado seguindo padrões POO.
*   Documentação técnica e comentários de arquivos atualizados (EN/PT-BR).
*   ROADMAP.md atualizado com as novas prioridades de inferência.





### **PROMPT DE AUDITORIA INTEGRAL: MALTBOT CLOUDBOT AI**

**Objetivo:** Atuar como Engenheiro de Software Especialista em Segurança Ofensiva e Arquiteto de Software para realizar uma análise exaustiva, técnica e forense da aplicação **Maltbot Cloudbot AI**. O foco principal é a desconstrução da lógica operacional, identificação de vulnerabilidades críticas e detecção de comportamentos maliciosos ocultos.

---

#### **1. Auditoria de Arquitetura e Lógica (Architectural & Logic Audit)**
*   **Análise de Código-Fonte (Source Code Analysis):** Realizar o parsing integral de todos os arquivos. Mapear o fluxo de execução desde o ponto de entrada (entry point) até os módulos periféricos.
    *   *EN: Map the execution flow from entry point to peripheral modules.*
    *   *PT-BR: Mapear o fluxo de execução do ponto de entrada aos módulos periféricos.*
*   **Integração e Controle GUI (GUI Integration & Control):** Analisar como a aplicação interage com ambientes gráficos, métodos de interpretação de tela (OCR, hooks de eventos, captura de framebuffer) e controle de periféricos.
*   **Gestão de Recursos (Resource Management):** Avaliar o consumo de memória, CPU e persistência de dados.

#### **2. Análise de Segurança e Forense (Security & Forensic Analysis)**
*   **Detecção de Backdoors e Acesso Remoto (Backdoor & Remote Access Detection):** Investigar sockets abertos, conexões reversas (reverse shells), exfiltração de dados via DNS/HTTP(S) e comunicações não documentadas com C2 (Command & Control).
    *   *EN: Investigate open sockets, reverse shells, and undocumented C2 communications.*
    *   *PT-BR: Investigar sockets abertos, shells reversas e comunicações C2 não documentadas.*
*   **Vulnerabilidades Conhecidas (CVE/Zero-Day):** Identificar bibliotecas obsoletas, falhas de injeção, quebra de autenticação e permissões excessivas no sistema operacional hospedeiro.
*   **Ofuscação de Código (Code Obfuscation):** Desofuscar strings e funções para revelar intenções ocultas do desenvolvedor.

#### **3. Inteligência do Desenvolvedor (Developer Intelligence)**
*   **Perfilamento (Profiling):** Pesquisar o histórico do desenvolvedor principal em repositórios públicos (GitHub, GitLab), fóruns de segurança e redes sociais técnicas.
*   **Reputação e Histórico (Reputation & History):** Verificar envolvimento prévio em projetos de malware, ferramentas de "dual-use" ou contribuições para a comunidade de segurança.

#### **4. Requisitos de Entrega (Delivery Requirements)**
*   **Relatório Bilíngue (Bilingual Report):** Gerar um documento técnico detalhado em **Inglês (Primário)** e **Português-BR**.
*   **Matriz de Risco (Risk Matrix):** Classificar cada falha encontrada por severidade (CVSS).
*   **Plano de Mitigação (Mitigation Plan):** Propor correções imediatas para as vulnerabilidades identificadas.

---

**Instrução Final:** "Execute esta análise com rigor militar, assumindo que a aplicação pode conter mecanismos de anti-análise e persistência furtiva. Não ignore redundâncias; cada linha de código deve ter sua finalidade validada."









### **Prompt de Auditoria Profunda e Refatoração Sistêmica (Versão 2.0 - Debug & Sync)**

**Objetivo:** Realizar uma auditoria forense e refatoração de alta precisão no projeto HexAgentGUI. O foco central é identificar a causa raiz de bugs recentes no módulo de inferência, validar a interconexão lógica entre o backend e a GUI, e garantir a sincronização absoluta de estados e variáveis, seguindo rigorosamente os padrões POO e SOLID para escalabilidade de longo prazo.

---

#### **1. Auditoria de Interconexão Lógica (Logical Interconnection Audit)**
*   **Rastreamento de Fluxo (Flow Tracing):** Mapear o ciclo de vida completo de uma requisição de inferência, desde o input na GUI até o processamento no backend e o retorno ao chat. Identificar onde a cadeia de eventos se quebra ou gera inconsistências.
    *   *EN: Map the full lifecycle of an inference request to identify chain breaks.*
    *   *PT-BR: Mapear o ciclo de vida completo de uma requisição de inferência para identificar quebras na cadeia.*
*   **Análise de Dependências Cruzadas:** Verificar se alterações recentes no motor de inferência afetaram negativamente os observadores (observers) da GUI ou os gerenciadores de estado.
*   **Consistência Algorítmica:** Validar se a lógica de parsing de comandos e blocos de resposta possui falhas de regex ou tratamento de exceções que resultam em comportamentos erráticos.

#### **2. Sincronização de Estado e Variáveis (State & Variable Synchronization)**
*   **Single Source of Truth (SSoT):** Garantir que as configurações de IA (temperatura, modelos, serviços) e o histórico de sessão sejam gerenciados por uma única entidade, eliminando duplicidade de variáveis entre `gui.py` e o core de inferência.
*   **Persistência de Contexto:** Auditar como a memória de curto e longo prazo da IA é salva e recuperada, garantindo que o estado da interface reflita exatamente o estado do backend após cada interação.

#### **3. Refatoração do Subsistema de IA (AI Subsystem Refactoring)**
*   **Padronização POO:** Refatorar classes de inferência para garantir que cada componente (Chat, Comando, Sugestão) herde de interfaces claras, facilitando a manutenção e eliminando bugs de tipagem ou retorno.
*   **Tratamento de Erros Robusto:** Implementar camadas de "fail-safe" que capturem erros de API ou de processamento local sem travar a interface gráfica.

#### **4. Modos de Operação e Terminal Híbrido (Operation Modes & Hybrid Terminal)**
*   **Modo Chat:** Otimizar o parsing de blocos de código e a renderização dinâmica para evitar bugs visuais e de buffer.
*   **Modo Comando (Terminal Assistido):** Validar a lógica de execução de comandos do sistema via IA, garantindo que o contexto do diretório atual e permissões sejam respeitados e sincronizados com a GUI.

#### **5. Requisitos de Entrega e Documentação (Delivery & Documentation)**
*   **Relatório de Bugs (Bug Report):** Identificar e documentar cada inconsistência encontrada, explicando a correção aplicada.
*   **Documentação Bilíngue (EN/PT-BR):** Atualizar todos os headers de arquivos e métodos complexos com documentação técnica detalhada.
*   **ROADMAP Sync:** Atualizar o `ROADMAP.md` para refletir a estabilização do core e os próximos passos para o Terminal Híbrido.

---

**Instrução de Execução:** "Analise cada linha de código como se fosse um ponto crítico de falha. Não aceite redundâncias. Se uma variável existe na GUI e no Backend, elas devem estar vinculadas por um contrato de sincronização explícito. Priorize a estabilidade do sistema acima de novas funcionalidades."






### **Prompt de Revisão Final: Estabilização e Otimização Global (Post-Roadmap)**

**Objetivo:** Realizar uma auditoria técnica exaustiva em todo o ecossistema **HexStrike-AI** para garantir que a implementação final pós-roadmap adira aos mais altos padrões de Programação Orientada a Objetos (POO), elimine redundâncias e assegure a sincronização perfeita entre a GUI e o Core de Inferência.

---

#### **Diretrizes de Auditoria (Audit Guidelines)**

1.  **Consistência de Estado e Sincronização (State Sync):**
    *   Verifique se não existem variáveis duplicadas ou estados conflitantes entre o `Frontend (React/useAIConfig)` e o `Backend (ConfigController/AgentCore)`.
    *   **Regra:** Toda alteração de configuração na interface deve ser refletida via contrato explícito (API/WebSocket) e persistida imediatamente no `~/.hexagent-gui`.

2.  **Integridade POO e Padrões de Projeto (OOP Integrity):**
    *   Valide se todas as classes de serviço herdam corretamente de suas interfaces/classes abstratas.
    *   Certifique-se de que o `ChatController` atua estritamente como uma *Facade* fina, sem lógica de negócio, delegando toda a inteligência ao `AgentCore`.
    *   Elimine qualquer resquício de lógica procedural ou funções globais fora de contextos de classe.

3.  **Otimização do Subsistema de IA:**
    *   Revise o parsing dos blocos de resposta (`InputBlock`, `ThinkingBlock`, `ShellBlock`). Garanta que a transição entre estados de pensamento e execução seja atômica e livre de bugs de buffer.
    *   Audite o tratamento de erros: falhas em APIs externas ou comandos locais não devem, sob nenhuma circunstância, travar a thread principal da GUI.

4.  **Refatoração de Redundâncias:**
    *   Identifique métodos com funcionalidades similares em diferentes controladores e unifique-os em utilitários ou mixins compartilhados.
    *   **Prioridade:** Estabilidade > Performance > Novas Funcionalidades.

---

#### **Instruções de Saída (Output Instructions)**

Para cada arquivo analisado, forneça:
1.  **Status de Conformidade:** (OK / Necessita Ajuste).
2.  **Refatoração Sugerida:** Código otimizado seguindo o padrão de "Single Source of Truth".
3.  **Justificativa Técnica:** Por que a mudança melhora a escalabilidade ou estabilidade do sistema.

---

**Comando de Execução:**
> "Analise o repositório atual. Identifique cada ponto de falha potencial onde o contrato de sincronização entre GUI e Backend possa ser quebrado. Refatore para garantir que o sistema opere como uma entidade única e coesa, documentando cada mudança em formato bilíngue (EN/PT-BR)."







### Prompt de Auditoria Integral e Refatoração Sistêmica - HexAgentGUI

**Objetivo:** Realizar uma análise profunda em toda a estrutura do `HexAgentGUI` para identificar falhas de sincronização, bugs de concorrência e violações de padrões POO, garantindo que o sistema opere como uma unidade coesa e livre de erros.

---

#### **Escopo da Análise (Scope of Analysis)**

1.  **Sincronização de Estado (State Synchronization):**
    *   **Foco:** Contrato entre `Frontend (GUI)` e `Backend (ConfigController/AgentCore)`.
    *   **Regra:** Toda alteração de configuração na interface deve ser refletida via contrato explícito (API/WebSocket) e persistida imediatamente no arquivo de configuração local.
    *   **Verificação:** Validar se o `Arquivo.log` reporta falhas de escrita ou desserialização.

2.  **Integridade POO e Desacoplamento (OOP Integrity & Decoupling):**
    *   **Foco:** Herança e Padrão Facade.
    *   **Regra:** O `ChatController` deve ser uma *Facade* pura. Nenhuma lógica de negócio ou processamento de IA deve residir nos controladores de interface.
    *   **Verificação:** Eliminar funções globais e garantir que todos os serviços herdem de interfaces abstratas.

3.  **Robustez do Subsistema de IA (AI Subsystem Robustness):**
    *   **Foco:** Parsing de blocos (`InputBlock`, `ThinkingBlock`, `ShellBlock`) e Threads.
    *   **Regra:** O processamento de blocos deve ser atômico. Falhas em APIs externas ou comandos de shell não podem bloquear a thread principal (Main GUI Thread).
    *   **Verificação:** Analisar o buffer de stream para evitar truncamento de dados.

4.  **Eliminação de Redundâncias e Tratamento de Erros:**
    *   **Foco:** DRY (Don't Repeat Yourself) e Exception Handling.
    *   **Regra:** Unificar métodos similares em utilitários compartilhados. Implementar logs detalhados para cada falha capturada.

---

#### **Instruções de Saída (Output Instructions)**

Para cada componente ou arquivo analisado, forneça:
1.  **Status de Conformidade (Compliance Status):** (OK / Necessita Ajuste).
2.  **Refatoração Sugerida (Suggested Refactoring):** Código otimizado com comentários bilíngues (EN/PT-BR).
3.  **Justificativa Técnica (Technical Justification):** Explicação de como a mudança resolve o bug e melhora a escalabilidade.

---

**Comando de Execução:**
> "Analise o repositório HexAgentGUI por completo. Identifique a causa raiz do erro reportado no `Arquivo.log` e procure por padrões de erro similares em todos os controladores e serviços. Refatore o código para garantir sincronização total de estado e aderência estrita aos princípios POO, documentando cada alteração em Inglês e Português-BR."


### **Prompt: Auditoria de Estrutura POO e Sincronização de Inicialização**

**Objetivo:**
Realizar uma varredura completa na arquitetura do sistema para identificar falhas de lógica no tratamento de anexos, garantindo a integridade dos princípios de Programação Orientada a Objetos e a sincronização absoluta do estado global durante a inicialização.

**Diretrizes de Revisão (Review Guidelines):**

1.  **Auditoria de Arquitetura e POO:**
    *   **Foco:** Encapsulamento e Responsabilidade Única (SRP).
    *   **Regra:** Verificar se as classes de serviço e controladores não possuem dependências circulares e se o estado é gerenciado de forma centralizada e protegida.
    *   **Verificação:** Garantir que não existam variáveis globais ou estados mutáveis compartilhados fora de padrões controlados (ex: Facades ou Singletons).

2.  **Depuração do Subsistema de Anexos:**
    *   **Foco:** Fluxo de Dados e Parsing de Objetos.
    *   **Regra:** Rastrear o ciclo de vida de um objeto de anexo desde a captura na GUI até a entrega final ao provedor de IA ou processamento local.
    *   **Verificação:** Localizar falhas de referência, erros de buffer ou problemas de desserialização que causam a anomalia relatada.

3.  **Refatoração do Módulo de Inicialização:**
    *   **Foco:** Bootstrapping e Sincronização de Dependências.
    *   **Regra:** Reescrever a sequência de inicialização para garantir que todos os subsistemas (AI, Shell, Logging) estejam instanciados e sincronizados antes da liberação da interface para o usuário.
    *   **Verificação:** Revisar e validar a consistência de todas as variáveis de configuração em todos os módulos para evitar estados indefinidos.

4.  **Sincronização de Estado e Variáveis:**
    *   **Foco:** Coerência entre Controladores e Serviços.
    *   **Regra:** Unificar o mapeamento de variáveis para garantir que alterações em um módulo sejam refletidas instantaneamente nos demais, mantendo a integridade do sistema.

---

**Comando de Execução:**
> "Realize uma análise exaustiva do repositório HexAgentGUI. Identifique a causa raiz do bug no sistema de anexos e valide a integridade POO de cada componente. Reescreva o módulo de inicialização para garantir a sincronização total das funcionalidades e variáveis em todos os controladores e serviços, assegurando o funcionamento perfeito e escalável do sistema. Documente todas as alterações em Inglês e Português-BR."


```markdown
### **Prompt de Auditoria Mestra: Refatoração, Limpeza e Otimização Global (HexAgentGUI)**

**Papel:** Atue como um Arquiteto de Software Sênior e Engenheiro de Segurança.
**Contexto:** O projeto HexAgentGUI é uma interface avançada de IA que integra um core de inferência com uma GUI (React/Python). O sistema deve seguir rigorosamente os princípios POO, SOLID e possuir uma "Fonte Única de Verdade" (SSoT) para o estado das configurações.

---

#### **1. Objetivos da Revisão (Review Objectives)**
*   **Limpeza e Organização de Arquivos (File Cleanup & Organization):** Identificar e mover scripts, arquivos temporários ou obsoletos que não são utilizados diretamente na aplicação para um diretório principal de backup (ex: `/legacy` ou `/archive`), mantendo a raiz limpa.
*   **Limpeza de Código (Code Cleanup):** Remover redundâncias, funções globais e lógica procedural. Aplicar o princípio DRY (Don't Repeat Yourself).
*   **Otimização de Performance:** Refinar o tratamento de buffers em streams de IA e processamento de anexos.
*   **Sincronização de Estado:** Garantir que qualquer alteração na GUI seja refletida no Backend e persistida localmente sem conflitos de variáveis.
*   **Integridade POO:** Validar se os controladores (Controllers) atuam como Facades e se os serviços estão devidamente desacoplados.

#### **2. Requisitos Técnicos (Technical Requirements)**
*   **Gestão de Variáveis Dinâmicas (Dynamic Variable Management):** Editar e validar todas as variáveis de ambiente e caminhos de sistema para garantir que a nova organização de arquivos não quebre as dependências funcionais.
*   **Documentação Bilíngue:** Todos os comentários e headers devem ser em **Inglês (Primário)** e **Português-BR**.
*   **Tratamento de Erros:** Implementar logs detalhados e mecanismos de fail-safe para evitar que falhas de rede ou de subprocessos travem a interface.
*   **Padronização de Blocos:** Auditar o parsing de `InputBlock`, `ThinkingBlock` e `ShellBlock` para garantir atomicidade.

#### **3. Estrutura de Saída Esperada (Output Structure)**
Para cada arquivo analisado:
1.  **Análise Crítica:** Identificação de gargalos ou violações de padrão.
2.  **Código Refatorado:** Versão otimizada e limpa com caminhos atualizados.
3.  **Justificativa Técnica:** Explicação das melhorias em termos de escalabilidade e estabilidade.

---

**Comando de Execução:**
> "Analise todos os arquivos do repositório HexAgentGUI. Identifique e organize arquivos/scripts não utilizados em um diretório de backup. Execute uma refatoração sistêmica para eliminar redundâncias e ajuste todas as variáveis dinâmicas para garantir o funcionamento perfeito após a reorganização. O código final deve ser modular, escalável e documentado de forma bilíngue (EN/PT-BR). Priorize a estabilidade do sistema e a aderência estrita aos padrões POO."
```



```markdown
### **Prompt de Auditoria e Refatoração Sistêmica (Nova Sessão)**

**Contexto do Sistema:**
Você é um Arquiteto de Software Sênior especializado em Sistemas de IA e Cibersegurança. Seu objetivo é realizar uma análise profunda e sistêmica no ecossistema **HexAgentGUI**, preparando a aplicação para uma fase crítica de testes funcionais e auditoria de módulos.

**Diretrizes de Execução:**

1.  **Análise Estrutural e POO:**
    *   Realize uma varredura completa em todos os diretórios e arquivos do repositório.
    *   Valide a integridade da Programação Orientada a Objetos (POO), garantindo que os Controllers atuem como Facades e que os Services estejam devidamente desacoplados.
    *   Identifique e organize scripts obsoletos ou redundantes em um diretório de backup (`./backup_old/`).

2.  **Sincronização de Configurações e Instalação:**
    *   Analise detalhadamente a pasta de configuração ativa em `~/.hexagent-gui/`.
    *   Compare e atualize os modelos em `config_templates/` para refletir as últimas evoluções da aplicação.
    *   Revise o script `install.sh`, garantindo que todas as variáveis dinâmicas, caminhos de sistema e instâncias de arquivos sejam criados corretamente para novas instalações.

3.  **Integração com o Ecossistema (HexStrike-AI):**
    *   O **hexstrike-ai** é o coordenador central de comportamentos e executor de comandos.
    *   Analise profundamente a relação lógica entre o `HexAgentGUI` e o `hexstrike-ai`.
    *   Garanta que todos os motores de IA integrados obedeçam rigorosamente às regras de comportamento e lógica operacional definidas no `hexstrike-ai`.
```markdown
    *   **Dynamic Interface Synchronization (Sincronização Dinâmica da Interface):**
        *   Perform an automated mapping of `hexstrike-ai` capabilities into the GUI components.
        *   Ensure that new modules, tools, or commands registered within the coordinator are dynamically instantiated in the interface, adhering to decoupled and scalable design patterns.
        *   (Realizar um mapeamento automatizado das capacidades do `hexstrike-ai` para os componentes da GUI. Garantir que novos módulos, ferramentas ou comandos registrados no coordenador sejam instanciados dinamicamente na interface, aderindo a padrões de design desacoplados e escaláveis.)
```
    *   Padronize a criação do arquivo de configuração da **Persona do Agente**, permitindo que a identidade e as restrições do agente sejam consistentes, independentemente do motor de IA selecionado.

4.  **Ajustes de Interface e Variáveis:**
    *   Valide a persistência de estado entre a GUI e o Backend.
    *   Garanta que todas as configurações de personalização e ajustes finos estejam mapeadas entre as duas interfaces.

5.  **Objetivo Final:**
    *   Entregar um código modular, escalável e documentado incluido todos os comentários nos arquivos da aplicação de forma bilíngue (EN/PT-BR).
    *   Preparar o ambiente para uma auditoria funcional manual, onde logs e capturas de tela serão utilizados para ajustes finos.

---

**Comando Inicial:**
> "Inicie a análise recursiva de todo o repositório HexAgentGUI e da integração com o hexstrike-ai. Identifique discrepâncias entre `~/.hexagent-gui/` e `config_templates/`, valide o fluxo do `install.sh` e apresente um plano de refatoração para garantir que a lógica de 'Persona Única' seja aplicada a todos os motores de IA, respeitando as diretrizes do coordenador HexStrike."
```