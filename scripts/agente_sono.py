"""
Agente de Análise do Diário do Sono
Dr. Fernando Azevedo — Pneumologista / Somnologista

Uso:
    pip install anthropic
    python scripts/agente_sono.py

O agente recebe registros do diário do sono, calcula métricas clínicas
e fornece uma análise interpretativa completa em português.
"""

import json
import anthropic

# ---------------------------------------------------------------------------
# Lógica clínica (espelha packages/core)
# ---------------------------------------------------------------------------

def minutos_entre_horarios(inicio: str, fim: str) -> int:
    """HH:mm → minutos. Cruza meia-noite se fim < inicio."""
    hi, mi = map(int, inicio.split(":"))
    hf, mf = map(int, fim.split(":"))
    total_inicio = hi * 60 + mi
    total_fim = hf * 60 + mf
    diff = total_fim - total_inicio
    if diff <= 0:
        diff += 1440
    return diff


def adicionar_minutos(horario: str, minutos: int) -> str:
    """Soma minutos a HH:mm e devolve HH:mm."""
    h, m = map(int, horario.split(":"))
    total = h * 60 + m + minutos
    total %= 1440
    return f"{total // 60:02d}:{total % 60:02d}"


def calcular_metricas(entrada: dict) -> dict:
    """Calcula métricas de um registro diário."""
    hora_deitar = entrada["hora_deitar"]
    hora_acordar = entrada["hora_acordar"]
    latencia = entrada["latencia_minutos"]
    waso = entrada["waso_minutos"]
    inercia = entrada["inercia_minutos"]
    despertares = entrada["numero_despertares"]
    tts_percebido = entrada["tts_percebido_minutos"]

    hora_sair_cama = adicionar_minutos(hora_acordar, inercia)
    ttc = minutos_entre_horarios(hora_deitar, hora_sair_cama)
    tts_calculado = ttc - latencia - waso - inercia
    eficiencia = round((tts_calculado / ttc * 100), 1) if ttc > 0 else 0

    return {
        "hora_sair_cama": hora_sair_cama,
        "lis_minutos": latencia,
        "ttc_minutos": ttc,
        "waso_minutos": waso,
        "fragmentacao": despertares,
        "inercia_minutos": inercia,
        "tts_calculado_minutos": tts_calculado,
        "tts_percebido_minutos": tts_percebido,
        "eficiencia_percent": eficiencia,
        "diff_percebido_calculado": tts_percebido - tts_calculado,
    }


def calcular_medias(registros: list[dict]) -> dict:
    """Calcula médias de uma lista de métricas."""
    if not registros:
        return {}

    campos = [
        "lis_minutos", "ttc_minutos", "waso_minutos", "fragmentacao",
        "inercia_minutos", "tts_calculado_minutos", "tts_percebido_minutos",
        "eficiencia_percent", "diff_percebido_calculado",
    ]
    return {
        campo: round(sum(r[campo] for r in registros) / len(registros), 1)
        for campo in campos
    }


def interpretar_igi(pontuacao: int) -> dict:
    """Interpreta o IGI (Índice de Gravidade de Insônia)."""
    if pontuacao <= 7:
        return {"pontuacao": pontuacao, "classificacao": "Ausência de insônia clinicamente significativa", "gravidade": "nenhuma"}
    if pontuacao <= 14:
        return {"pontuacao": pontuacao, "classificacao": "Insônia subclínica", "gravidade": "subclínica"}
    if pontuacao <= 21:
        return {"pontuacao": pontuacao, "classificacao": "Insônia clínica moderada", "gravidade": "moderada"}
    return {"pontuacao": pontuacao, "classificacao": "Insônia clínica grave", "gravidade": "grave"}


# ---------------------------------------------------------------------------
# Ferramentas do agente
# ---------------------------------------------------------------------------

TOOLS = [
    {
        "name": "calcular_metricas_dia",
        "description": (
            "Calcula as métricas clínicas de um único registro do diário do sono: "
            "LIS (latência), TTC (tempo total na cama), WASO, TTS calculado, TTS percebido, "
            "eficiência do sono e fragmentação. Use esta ferramenta para cada dia antes de calcular médias."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "data": {"type": "string", "description": "Data do registro (YYYY-MM-DD)"},
                "hora_deitar": {"type": "string", "description": "Hora de deitar (HH:mm)"},
                "hora_acordar": {"type": "string", "description": "Hora do despertar final (HH:mm)"},
                "latencia_minutos": {"type": "integer", "description": "Minutos para adormecer (LIS)"},
                "waso_minutos": {"type": "integer", "description": "Minutos acordado durante a noite (WASO)"},
                "inercia_minutos": {"type": "integer", "description": "Minutos para sair da cama após acordar (inércia)"},
                "numero_despertares": {"type": "integer", "description": "Quantidade de despertares noturnos"},
                "tts_percebido_minutos": {"type": "integer", "description": "Tempo de sono percebido pelo paciente (minutos)"},
                "qualidade_sono": {"type": "string", "enum": ["boa", "regular", "ruim"], "description": "Qualidade subjetiva do sono"},
                "sensacao_manha": {"type": "string", "enum": ["descansado", "cansado", "sonolento"], "description": "Como o paciente se sentiu ao acordar"},
            },
            "required": ["data", "hora_deitar", "hora_acordar", "latencia_minutos",
                         "waso_minutos", "inercia_minutos", "numero_despertares",
                         "tts_percebido_minutos", "qualidade_sono", "sensacao_manha"],
        },
    },
    {
        "name": "calcular_medias_periodo",
        "description": (
            "Calcula as médias clínicas de múltiplos dias de registros. "
            "Passe uma lista com as métricas já calculadas por calcular_metricas_dia. "
            "Use após calcular os registros individuais."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "metricas_por_dia": {
                    "type": "array",
                    "description": "Lista de objetos com métricas de cada dia (resultado de calcular_metricas_dia)",
                    "items": {"type": "object"},
                }
            },
            "required": ["metricas_por_dia"],
        },
    },
    {
        "name": "interpretar_igi",
        "description": (
            "Interpreta a pontuação do IGI (Índice de Gravidade de Insônia). "
            "Escala: 0–7 sem insônia, 8–14 subclínica, 15–21 moderada, 22–28 grave."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "pontuacao": {"type": "integer", "description": "Pontuação total do IGI (0–28)"},
            },
            "required": ["pontuacao"],
        },
    },
    {
        "name": "identificar_alertas_clinicos",
        "description": (
            "Analisa as médias do período e retorna alertas clínicos objetivos: "
            "eficiência abaixo de 85%, WASO elevado, latência excessiva, TTS insuficiente, "
            "fragmentação alta. Use após calcular_medias_periodo."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "medias": {
                    "type": "object",
                    "description": "Objeto de médias retornado por calcular_medias_periodo",
                },
                "dias_analisados": {"type": "integer", "description": "Total de dias no período"},
            },
            "required": ["medias", "dias_analisados"],
        },
    },
]


# ---------------------------------------------------------------------------
# Execução das ferramentas
# ---------------------------------------------------------------------------

def executar_ferramenta(nome: str, args: dict) -> str:
    if nome == "calcular_metricas_dia":
        metricas = calcular_metricas(args)
        resultado = {"data": args["data"], "metricas": metricas,
                     "qualidade_sono": args["qualidade_sono"],
                     "sensacao_manha": args["sensacao_manha"]}
        return json.dumps(resultado, ensure_ascii=False)

    if nome == "calcular_medias_periodo":
        metricas_lista = args["metricas_por_dia"]
        medias = calcular_medias(metricas_lista)
        return json.dumps({"dias": len(metricas_lista), "medias": medias}, ensure_ascii=False)

    if nome == "interpretar_igi":
        return json.dumps(interpretar_igi(args["pontuacao"]), ensure_ascii=False)

    if nome == "identificar_alertas_clinicos":
        medias = args["medias"]
        dias = args["dias_analisados"]
        alertas = []

        if medias.get("eficiencia_percent", 100) < 85:
            alertas.append(f"⚠️ Eficiência do sono baixa: {medias['eficiencia_percent']}% (referência: ≥ 85%)")
        if medias.get("lis_minutos", 0) > 30:
            alertas.append(f"⚠️ Latência elevada: {medias['lis_minutos']} min (referência: ≤ 30 min)")
        if medias.get("waso_minutos", 0) > 30:
            alertas.append(f"⚠️ WASO elevado: {medias['waso_minutos']} min (referência: ≤ 30 min)")
        if medias.get("tts_calculado_minutos", 999) < 360:
            alertas.append(f"⚠️ TTS insuficiente: {medias['tts_calculado_minutos']} min ({medias['tts_calculado_minutos']/60:.1f}h — referência: ≥ 6h)")
        if medias.get("fragmentacao", 0) > 3:
            alertas.append(f"⚠️ Fragmentação alta: {medias['fragmentacao']} despertares/noite (referência: ≤ 3)")
        if medias.get("ttc_minutos", 0) > 540:
            alertas.append(f"ℹ️ Tempo na cama elevado: {medias['ttc_minutos']} min ({medias['ttc_minutos']/60:.1f}h) — pode indicar estratégia de compensação")

        diff = medias.get("diff_percebido_calculado", 0)
        if abs(diff) > 60:
            direcao = "subestima" if diff < 0 else "superestima"
            alertas.append(f"ℹ️ Discrepância percepção/cálculo: paciente {direcao} o sono em {abs(diff)} min — sinal de alerta cognitivo")

        return json.dumps({
            "dias_analisados": dias,
            "alertas": alertas if alertas else ["✅ Sem alertas clínicos críticos no período analisado."],
        }, ensure_ascii=False)

    return json.dumps({"erro": f"Ferramenta desconhecida: {nome}"})


# ---------------------------------------------------------------------------
# Loop do agente
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """Você é um assistente clínico especializado em medicina do sono,
auxiliando o Dr. Fernando Azevedo (pneumologista e somnologista).

Sua função é analisar registros do Diário do Sono, calcular métricas clínicas
e fornecer uma interpretação detalhada e humanizada em português brasileiro.

Sempre que receber dados de sono, siga este fluxo:
1. Calcule as métricas de cada dia individualmente com calcular_metricas_dia
2. Calcule as médias do período com calcular_medias_periodo
3. Identifique alertas clínicos com identificar_alertas_clinicos
4. Se o IGI for fornecido, interprete com interpretar_igi
5. Produza um relatório final claro, com linguagem adequada para uso médico

No relatório final, inclua:
- Resumo executivo (3–5 linhas)
- Tabela de métricas médias com referências normativas
- Alertas e achados clínicos
- Padrão predominante identificado (insônia de manutenção, latência, mista etc.)
- Tendências ao longo dos dias (se houver múltiplos registros)
- Sugestões para discussão na consulta

Use sempre unidades claras (min, %, h). Seja preciso e clínico, mas humanizado."""


def rodar_agente(dados_paciente: str) -> None:
    client = anthropic.Anthropic()
    mensagens = [{"role": "user", "content": dados_paciente}]

    print("\n" + "=" * 60)
    print("AGENTE DE ANÁLISE DO DIÁRIO DO SONO")
    print("=" * 60)

    while True:
        resposta = client.messages.create(
            model="claude-opus-4-7",
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=mensagens,
        )

        # Acumula conteúdo da resposta
        mensagens.append({"role": "assistant", "content": resposta.content})

        if resposta.stop_reason == "end_turn":
            # Exibe o relatório final
            for bloco in resposta.content:
                if hasattr(bloco, "text"):
                    print("\n" + bloco.text)
            break

        # Executa ferramentas solicitadas
        resultados = []
        for bloco in resposta.content:
            if bloco.type == "tool_use":
                print(f"\n🔧 Calculando: {bloco.name}...")
                resultado = executar_ferramenta(bloco.name, bloco.input)
                resultados.append({
                    "type": "tool_result",
                    "tool_use_id": bloco.id,
                    "content": resultado,
                })

        mensagens.append({"role": "user", "content": resultados})


# ---------------------------------------------------------------------------
# Dados de exemplo — 7 dias de um paciente hipotético
# ---------------------------------------------------------------------------

EXEMPLO_PACIENTE = """
Analise o diário do sono da paciente abaixo e gere um relatório clínico completo.

**Paciente:** Maria S., 42 anos, queixa de insônia há 8 meses.
**IGI aplicado:** pontuação 18
**Período:** 7 dias consecutivos

Registros diários:

Dia 1 (2026-05-17):
- Deitou: 23:00 | Acordou: 06:30
- Latência: 45 min | Despertares: 3 | WASO: 55 min | Inércia: 20 min
- TTS percebido: 300 min | Qualidade: ruim | Manhã: cansada

Dia 2 (2026-05-18):
- Deitou: 23:30 | Acordou: 06:00
- Latência: 60 min | Despertares: 4 | WASO: 80 min | Inércia: 25 min
- TTS percebido: 240 min | Qualidade: ruim | Manhã: sonolenta

Dia 3 (2026-05-19):
- Deitou: 22:00 | Acordou: 07:00
- Latência: 30 min | Despertares: 2 | WASO: 40 min | Inércia: 15 min
- TTS percebido: 330 min | Qualidade: regular | Manhã: cansada

Dia 4 (2026-05-20):
- Deitou: 00:00 | Acordou: 07:30
- Latência: 50 min | Despertares: 3 | WASO: 60 min | Inércia: 20 min
- TTS percebido: 280 min | Qualidade: ruim | Manhã: cansada

Dia 5 (2026-05-21):
- Deitou: 23:00 | Acordou: 06:00
- Latência: 40 min | Despertares: 2 | WASO: 35 min | Inércia: 10 min
- TTS percebido: 310 min | Qualidade: regular | Manhã: descansada

Dia 6 (2026-05-22):
- Deitou: 23:30 | Acordou: 05:30
- Latência: 70 min | Despertares: 5 | WASO: 90 min | Inércia: 30 min
- TTS percebido: 200 min | Qualidade: ruim | Manhã: sonolenta

Dia 7 (2026-05-23):
- Deitou: 22:30 | Acordou: 06:30
- Latência: 35 min | Despertares: 2 | WASO: 30 min | Inércia: 15 min
- TTS percebido: 340 min | Qualidade: regular | Manhã: descansada
"""

if __name__ == "__main__":
    rodar_agente(EXEMPLO_PACIENTE)
