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
        *   Revise e atualize o script `install.sh` para garantir que ele sincronize corretamente esses templates para o diretório do usuário durante a instalação/atualização.

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


