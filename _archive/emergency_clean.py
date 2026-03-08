#!/usr/bin/env python3
import subprocess
import re
import sys
import os

def run_command(command):
    print(f"Executando: {command}")
    try:
        result = subprocess.run(command, shell=True, check=False, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        return result.stdout
    except Exception as e:
        print(f"Erro ao executar {command}: {e}")
        return ""

def main():
    if os.geteuid() != 0:
        print("❌ ESTE SCRIPT PRECISA SER EXECUTADO COMO ROOT (sudo).")
        sys.exit(1)

    print("🔍 Iniciando análise de pacotes quebrados (dpkg -C)...")
    audit_output = run_command("dpkg -C")
    
    if not audit_output:
        print("✅ Nenhuma saída do dpkg -C. O sistema parece estar consistente ou o comando falhou.")
        return

    lines = audit_output.split('\n')
    
    # Categorias para remoção segura (evitar remover pacotes que estão apenas esperando triggers de sistema)
    # Vamos focar em pacotes que falharam na instalação ou configuração.
    # As seções de Triggers geralmente contêm pacotes do sistema (systemd, glibc) que não devem ser removidos.
    
    target_sections = [
        "meio instalados", 
        "half-installed",
        "meio configurados",
        "half-configured",
        "sem o arquivo de controle",
        "missing the list control file",
        "missing the md5sums control file"
    ]
    
    ignore_sections = [
        "aguardando processamento de gatilhos",
        "awaiting trigger processing",
        "disparados por gatilhos",
        "triggered"
    ]

    packages_to_remove = []
    current_section_action = "IGNORE" # ou "REMOVE"
    
    # Regex para pegar o nome do pacote no início da linha (indentado ou não)
    # Formato típico: " pacote-nome      descrição..."
    package_pattern = re.compile(r'^\s+([a-zA-Z0-9][a-zA-Z0-9-.:+]+)\s+')

    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue

        # Verificar se é um cabeçalho de seção
        is_header = False
        
        # Detector de seções alvo (REMOVER)
        for section in target_sections:
            if section in line.lower() and ("seguintes" in line.lower() or "following" in line.lower()):
                current_section_action = "REMOVE"
                is_header = True
                print(f"📂 Seção detectada para REMOÇÃO: {line[:50]}...")
                break
        
        # Detector de seções para IGNORAR
        for section in ignore_sections:
            if section in line.lower() and ("seguintes" in line.lower() or "following" in line.lower()):
                current_section_action = "IGNORE"
                is_header = True
                print(f"🛡️ Seção detectada para PRESERVAR (Triggers): {line[:50]}...")
                break
        
        if is_header:
            continue

        # Se estamos numa seção de remoção, tentar extrair pacote
        if current_section_action == "REMOVE":
            match = package_pattern.match(line)
            if match:
                pkg = match.group(1)
                packages_to_remove.append(pkg)

    # Remover duplicatas mantendo ordem
    packages_to_remove = list(dict.fromkeys(packages_to_remove))

    print(f"\n📋 Pacotes identificados para remoção: {len(packages_to_remove)}")
    if not packages_to_remove:
        print("Nenhum pacote crítico para remoção encontrado nas categorias alvo.")
        print("Dica: Se houver problemas de triggers, tente 'dpkg --configure -a' após liberar espaço.")
    else:
        for p in packages_to_remove:
            print(f" - {p}")
        
        print("\n⚠️  ATENÇÃO: A remoção forçada pode ser perigosa.")
        print("Será executado: dpkg --remove --force-remove-reinstreq <pacote>")
        
        # Modo não interativo para automação, mas seguro
        # O usuário pediu para limpar.
        
        print("\n🚀 Iniciando limpeza em 3 segundos...")
        import time
        time.sleep(3)

        for pkg in packages_to_remove:
            print(f"🗑️ Removendo {pkg}...")
            out = run_command(f"dpkg --remove --force-remove-reinstreq {pkg}")
            print(out[:200] + "..." if len(out) > 200 else out)

    print("\n🧹 Executando limpeza geral (apt-get clean)...")
    run_command("apt-get clean")
    run_command("apt-get autoremove -y")
    
    print("\n✅ Processo finalizado. Execute 'sudo dpkg --configure -a' para tentar corrigir os pacotes restantes (triggers).")

if __name__ == "__main__":
    main()
