================================== REVISÃO DE PROJETO ======================================
**Objetivo:**
Realizar uma análise profunda do projeto HexAgentGUI para sincronizar o estado atual com o plano de desenvolvimento de longo prazo, garantindo padrões POO, escalabilidade e sincronização total de todas as variáveis atuais da interface GUI.

**Instruções:**

1.  **Mapeamento e Sincronização de Variáveis GUI:**
    *   Identifique e mapeie todas as variáveis atuais na interface GUI. Garanta que sejam inicializadas corretamente, sincronizadas com a lógica do backend e sigam os princípios de encapsulamento POO. Esta é uma tarefa de alta prioridade.

2.  **Análise Recursiva e Auditoria POO:**
    *   Escaneie todos os arquivos do projeto para identificar a lógica central e dependências de componentes. Avalie o progresso da migração POO e refatore códigos procedurais legados em classes modulares.

3.  **Documentação Multilíngue e Padrões:**
    *   Atualize toda a documentação (arquivos .md) e comentários de código para seguir rigorosamente o formato Inglês (Primário) / Português-BR (Secundário). Garanta que a logo, referências de desenvolvimento e links de doação sejam preservados e atualizados.

4.  **Detecção de Redundância e Bugs:**
    *   Localize funções duplicadas e unifique a lógica redundante. Identifique variáveis não utilizadas ou recursos desativados para evitar a obsolescência de recursos.

5.  **Mapeamento Arquitetural:**
    *   Gere uma Árvore de Arquivos, Diagrama de Classes e Stack de Bibliotecas (dependências e papéis) atualizados.

6.  **Atualização do Roadmap de Desenvolvimento:**
    *   Atualize a lista de TAREFAS e o ROADMAP com base nas descobertas, priorizando a escalabilidade e a integração multi-desenvolvedor (humano/IA).

**Formato de Saída:**
*   **Resumo das Descobertas:** Status das variáveis GUI, progresso POO e bugs identificados.
*   **Roadmap de Refatoração:** Guia passo a passo para a próxima fase de desenvolvimento.
*   **Doc de Arquitetura Atualizada:** Arquivo Markdown descrevendo a estrutura do sistema.



### Prompt for Antigravity AI: Restoration and OOP Refactoring of Inference Engine (English)

**Context:**
The core inference and command execution engine in the current `@HexAgentGUI` project has ceased to function correctly following the migration to an Object-Oriented Programming (OOP) structure. A functional version exists in the `./HexAgentGUI_v1/` directory.

**Objective:**
Restore the functional logic from the legacy version while successfully integrating it into the modern OOP architecture of the current project.

**Instructions:**

1. **Cleanup and Removal:**
    *   Identify and remove all current (broken) modules or code segments related to inference and command execution within the `@HexAgentGUI` folder.

2. **Reverse Engineering (Legacy Analysis):**
    *   Analyze the directory `./HexAgentGUI_v1/`. Identify the exact algorithms and logic flow used for inference and command execution.
    *   Study how input is processed and how commands are triggered in this working version.
  
3.  **OOP Implementation:**
    *   Rewrite the inference engine from scratch using the logic identified in the legacy version.
    *   Apply strict OOP principles: create dedicated classes (e.g., `InferenceManager`, `CommandHandler`, `ActionDispatcher`).
    *   Ensure high cohesion and low coupling.

4.  **System Integration:**
    *   Synchronize the new classes with the existing GUI panels and configuration modules.
    *   Follow the current hierarchical file structure strictly.
    *   Ensure all GUI state variables are correctly mapped to the new engine's properties.

5.  **Documentation:**
    *   All new code must contain bilingual comments: English (Primary) / Portuguese-BR (Secondary).
    *   Update the internal documentation to reflect the new architecture.

---

### Prompt para Antigravity AI: Restauração e Refatoração POO do Motor de Inferência (Português-BR)

**Contexto:**
O motor central de inferência e execução de comandos no projeto `@HexAgentGUI` atual parou de funcionar corretamente após a migração para uma estrutura de Programação Orientada a Objetos (POO). Uma versão funcional existe no diretório `./HexAgentGUI_v1/`.

**Objetivo:**
Restaurar a lógica funcional da versão legada enquanto a integra com sucesso na arquitetura POO moderna do projeto atual.

**Instruções:**

1.  **Limpeza e Remoção:**
    *   Identifique e remova todos os módulos ou segmentos de código atuais (quebrados) relacionados à inferência e execução de comandos dentro da pasta `@HexAgentGUI`.


2. **Engenharia Reversa (Análise Legada):**
    *   Analise o diretório `./HexAgentGUI_v1/`. Identifique os algoritmos exatos e o fluxo de lógica usados para inferência e execução de comandos.
    *   Estude como a entrada é processada e como os comandos são acionados nesta versão funcional.
 
3.  **Implementação POO:**
    *   Reescreva o motor de inferência do zero usando a lógica identificada na versão legada.
    *   Aplique princípios rigorosos de POO: crie classes dedicadas (ex: `InferenceManager`, `CommandHandler`, `ActionDispatcher`).
    *   Garanta alta coesão e baixo acoplamento.

4.  **Integração de Sistema:**
    *   Sincronize as novas classes com os painéis da GUI e módulos de configuração de IA. Implemente a gestão dinâmica de motores e modelos em abas dedicadas, garantindo que formulários e variáveis de configuração específicas sejam mapeados via POO (ex: Padrão Strategy ou Factory). A interface principal deve gerenciar o ciclo de vida do motor (Start, Restart, Stop, Status) de forma reativa; em caso de falhas, o sistema deve fornecer diagnósticos claros e redirecionamento para as opções de correção na aba correspondente ao motor.
    *   Siga rigorosamente a estrutura de arquivos hierárquica atual (./HexAgentGUI/) com os arquivos de configuração do usuários ~/hexagent-gui/(analise esssa pasta).
    *   Garanta que todas as variáveis de estado da GUI estejam mapeadas corretamente para as propriedades do novo motor.

5.  **Documentação:**
    *   Todo o novo código deve conter comentários bilíngues: Inglês (Primário) / Português-BR (Secundário).
    *   Atualize a documentação interna para refletir a nova arquitetura.




### Prompt for Antigravity AI: Multi-Engine AI Integration and Backend Refactoring (English)

**Context:**
The current inference and command execution logic in `HexAgentGUI` is fragmented and non-functional. While `HexSecGPT` and `HexStrike` are primary components, the system requires a unified, scalable architecture capable of supporting multiple AI engines and models dynamically.

**Objective:**
Perform a complete overhaul of the AI backend and frontend configuration. Delete obsolete modules, implement a simplified multi-engine architecture using OOP patterns, and redesign the GUI configuration interface for full synchronization.

**Instructions:**

1.  **Backend Purge and Rewrite:**
    *   Identify and delete all current modules and files responsible for inference and command execution that are redundant or non-functional.
    *   Rewrite the core logic from scratch: implement a `ProviderFactory` and `InferenceStrategy` to support `HexSecGPT`, `HexStrike`, and future AI models (Local/API).
    *   Optimize algorithms for performance and direct execution, ensuring a clean path for future scalability.

2.  **Frontend Redesign (AI Configuration Modal):**
    *   Redesign the AI Configuration Modal to allow dynamic selection of Engines (e.g., HexSecGPT, OpenAI, Ollama) and specific Models.
    *   Ensure the UI components are reactively mapped to the backend's state variables.

3.  **Inference and Command Integration:**
    *   Establish a functional link between the GUI input, the selected AI engine, and the `CommandHandler` for action execution.
    *   Ensure the inference loop provides real-time feedback to the GUI.

4.  **Documentation:**
    *   All code must include bilingual comments: English (Primary) / Portuguese-BR (Secondary).

---

### Prompt para Antigravity AI: Integração Multi-Motor de IA e Refatoração de Backend (Português-BR)

**Contexto:**
A lógica atual de inferência e execução de comandos no `HexAgentGUI` está fragmentada e não funcional. Embora `HexSecGPT` e `HexStrike` sejam componentes primários, o sistema exige uma arquitetura unificada e escalável, capaz de suportar múltiplos motores e modelos de IA dinamicamente.

**Objetivo:**
Realizar uma reformulação completa do backend de IA e da configuração do frontend. Excluir módulos obsoletos, implementar uma arquitetura multi-motor simplificada usando padrões POO e redesenhar a interface de configuração da GUI para sincronização total.

**Instruções:**

1.  **Limpeza e Reescrita do Backend:**
    *   Identifique e exclua todos os módulos e arquivos atuais responsáveis pela inferência e execução de comandos que sejam redundantes ou não funcionais.
    *   Reescreva a lógica central do zero: implemente um `ProviderFactory` e `InferenceStrategy` para suportar `HexSecGPT`, `HexStrike` e futuros modelos de IA (Local/API).
    *   Otimize os algoritmos para desempenho e execução direta, garantindo um caminho limpo para escalabilidade futura.

2.  **Redesign do Frontend (Modal de Configuração de IA):**
    *   Redesenhe o Modal de Configuração de IA para permitir a seleção dinâmica de Motores (ex: HexSecGPT, OpenAI, Ollama) e Modelos específicos.
    *   Garanta que os componentes da UI estejam mapeados reativamente às variáveis de estado do backend.

3.  **Integração de Inferência e Comandos:**
    *   Estabeleça um vínculo funcional entre a entrada da GUI, o motor de IA selecionado e o `CommandHandler` para execução de ações.
    *   Garanta que o loop de inferência forneça feedback em tempo real para a GUI.

4.  **Documentação:**
    *   Todo o código deve incluir comentários bilíngues: Inglês (Primário) / Português-BR (Secundário).