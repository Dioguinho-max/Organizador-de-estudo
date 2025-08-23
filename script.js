// ==== CONFIGURAÇÃO ====
// ⚠️ Esta chave está embutida no front-end (menos seguro). Você assumiu o risco.
const EMBEDDED_API_KEY = "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";

// ==== DOM ====
const form = document.getElementById("study-form");
const cardsEl = document.getElementById("cards");
const statusEl = document.getElementById("status");

form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  cardsEl.innerHTML = "";
  statusEl.textContent = "Gerando plano com IA...";

  const subjects = document.getElementById("subjects").value.trim();
  const hours = parseInt(document.getElementById("hours").value, 10);
  const goal = document.getElementById("goal").value.trim();
  const level = document.getElementById("level").value;
  const userApi = (document.getElementById("user-api")?.value || "").trim();
  const apiKey = userApi || EMBEDDED_API_KEY;

  if(!subjects || !hours || !goal){
    statusEl.textContent = "Preencha todos os campos.";
    return;
  }

  try{
    const content = await generateRichPlan({subjects, hours, goal, level, apiKey});
    renderRichText(content);
    statusEl.textContent = "Plano gerado ✅";
  }catch(err){
    console.error(err);
    statusEl.textContent = "Erro ao gerar o plano. Mostrando sugestão básica.";
    renderFallback({subjects, hours, goal});
  }
});

async function generateRichPlan({subjects, hours, goal, level, apiKey}){
  const system = "Você é um tutor especialista em organização de estudos. Gere respostas claras, úteis e motivadoras.";
  const user = `Crie um PLANO DE ESTUDOS DETALHADO em português do Brasil, organizado em seções e com linguagem simples.

Dados do estudante:
- Matérias: ${subjects}
- Tempo disponível por dia: ${hours} horas
- Nível: ${level}
- Objetivo: ${goal}

Formato da resposta (TEXTO, não JSON):
📌 Resumo Geral
- 2 a 4 bullets sobre a estratégia da semana (prioridades, distribuição do tempo, foco)

📅 Plano Diário (7 dias)
- Segunda-feira: liste blocos de estudo com duração aproximada (ex.: 50min + 10min pausa), atividades (exercícios, revisão ativa, flashcards) e metas
- Terça-feira: ...
- Quarta-feira: ...
- Quinta-feira: ...
- Sexta-feira: ...
- Sábado: ...
- Domingo: (permitido descanso e revisão leve)

💡 Dicas Extras
- Técnicas específicas (spaced repetition, active recall, Pomodoro, blurting, Feynman)
- Rotina de revisão semanal
- Como adaptar o plano se sobrar/ faltar tempo

Regras:
- Converta horas em blocos práticos (ex.: ${hours}h ≈ 3–4 blocos de ~45–50min + pausas)
- Comece pelos tópicos mais importantes/difíceis
- Inclua pausas entre blocos
- Evite respostas genéricas; seja específico para as matérias enviadas
`;

  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature: 0.7,
    max_tokens: 1100
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if(!resp.ok){
    const t = await resp.text();
    throw new Error("OpenAI error: " + t);
  }
  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "Não foi possível gerar o plano agora.";
}

function renderRichText(text){
  const card = document.createElement("div");
  card.className = "card";
  const block = document.createElement("div");
  block.className = "block";
  const pre = document.createElement("pre");
  pre.style.whiteSpace = "pre-wrap";
  pre.style.margin = "0";
  pre.textContent = text;
  block.appendChild(pre);
  card.appendChild(block);
  cardsEl.appendChild(card);
}

function renderFallback({subjects, hours, goal}){
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `<h4>Plano básico</h4>
    <div class="block"><b>Priorize</b> — 40% do tempo nas matérias mais difíceis</div>
    <div class="block"><b>Rotina</b> — ${hours}h/dia em blocos de 45–50min com 10min de pausa</div>
    <div class="block"><b>Objetivo</b> — ${escapeHtml(goal)}</div>
    <div class="block"><small>Matérias: ${escapeHtml(subjects)}</small></div>`;
  cardsEl.appendChild(el);
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, function(m){
    switch(m){
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "\"": return "&quot;";
      case "'": return "&#039;";
      default: return m;
    }
  });
}