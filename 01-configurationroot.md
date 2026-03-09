# CONFIGURATION ROOT & LIFECYCLE OBRIGATÓRIO (Antigravity Rule)

**REGRA DE OURO (Lifecycle de Personas e Configurações Base):**

1. **A Pasta `~/.hexagent-gui/`:** 
   O objetivo da pasta do usuário (`~/.hexagent-gui/`) é exclusivamente para *suporte pós-instalação*, armazenando os dados em produção do usuário.

2. **Source of Truth de Desenvolvimento:**
   Todos os arquivos fundamentais para desenvolvimento, incluindo os modelos base de personas (JSON) e configurações, **DEVEM ESTAR SEMPRE NA PASTA DA APLICAÇÃO** (`HexAgentGUI/config_templates/agents/`).
   
3. **Mecanismo de Instalação e Expansão:**
   A injeção de novos recursos ou adição de novas Personas à maquina do usuário deve **obrigatoriamente obedecer ao lifecycle do script de instalação (`install.sh`)**. O `install.sh` é quem lê da pasta da aplicação (Source of Truth) e aplica/mescla os componentes em `~/.hexagent-gui` para o uso em *runtime*, sem sobrescrever arbitrariamente os dados do usuário.

Qualquer AI ou desenvolvedor deve editar as configurações padrão apenas em `config_templates/` e rodar o lifecycle (install.sh) caso queira propagar ao runtime atual.
