// ==== CONFIGURAÇÃO ====
// Chave embutida (menos seguro). Você pode substituir por outra.
const EMBEDDED_API_KEY = "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";

// ==== DOM ====
const form = document.getElementById("study-form");
const cardsEl = document.getElementById("cards");
const statusEl = document.getElementById("status");

form.addEventListener("submit", async (e)=>{
  e.preventDefault();
  cardsEl.innerHTML = "";
  statusEl.textContent = "Gerando plano com IA...";
  const subjects = document.getElementById("subjects").value;
  const hours = parseInt(document.getElementById("hours").value, 10);
  const goal = document.getElementById("goal").value;
  const level = document.getElementById("level").value;
  const userApi = document.getElementById("user-api").value.trim();
  const apiKey = userApi || EMBEDDED_API_KEY;

  try{
    const plan = await generatePlanWithOpenAI({subjects, hours, goal, level, apiKey});
    renderPlan(plan);
    statusEl.textContent = "Plano gerado ✅";
  }catch(err){
    console.error(err);
    statusEl.textContent = "Erro ao gerar plano. Mostrando uma sugestão básica.";
    renderFallback({subjects, hours, goal});
  }
});

async function generatePlanWithOpenAI({subjects, hours, goal, level, apiKey}){
  const prompt = `Atue como um tutor de estudos. Gere um PLANO SEMANAL detalhado em JSON, seguindo ESTRITAMENTE este schema:
{
  "weekSummary": "resumo breve em português",
  "days": [
    {
      "day": "Segunda-feira",
      "blocks": [
        {"subject":"Matéria", "minutes":0, "activity":"atividade objetiva", "notes":"dica curta"}
      ]
    }
  ],
  "tips": ["dica curta 1", "dica curta 2"]
}
Contexto do estudante:
- Matérias: ${subjects}
- Tempo disponível por dia: ${hours} horas
- Nível: ${level}
- Objetivo: ${goal}

Regras:
- Converta horas em minutos (ex.: 3h = 180 minutos) e distribua entre 3–5 blocos por dia.
- Inclua pausas curtas entre blocos quando fizer sentido.
- Priorize matérias-chave primeiro.
- Use português do Brasil.
- NÃO inclua texto fora do JSON.`;

  const body = {
    model: "gpt-4o-mini",
    messages: [{role:"user", content: prompt}],
    temperature: 0.6,
    max_tokens: 900
  };

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(body)
  });

  if(!resp.ok){
    const t = await resp.text();
    throw new Error("OpenAI error: "+t);
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  // Alguns modelos retornam o JSON dentro de blocos de code fence; vamos limpar:
  const cleaned = content.replace(/^```(json)?/i, "").replace(/```$/,"").trim();

  let json;
  try{
    json = JSON.parse(cleaned);
  }catch(e){
    // tentativa extra: achar trecho JSON
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if(start>=0 && end>start){
      json = JSON.parse(cleaned.slice(start, end+1));
    }else{
      throw new Error("Resposta não JSON");
    }
  }
  return json;
}

function renderPlan(plan){
  // Resumo
  if(plan.weekSummary){
    const sum = document.createElement("div");
    sum.className = "card";
    sum.innerHTML = `<h4>Resumo da semana</h4><p>${escapeHtml(plan.weekSummary)}</p>`;
    cardsEl.appendChild(sum);
  }
  // Dias
  (plan.days||[]).forEach(d=>{
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `<h4>${escapeHtml(d.day||"Dia")}</h4>`;
    (d.blocks||[]).forEach(b=>{
      const blk = document.createElement("div");
      blk.className = "block";
      blk.innerHTML = `<b>${escapeHtml(b.subject||"-")}</b> — ${Number(b.minutes)||0} min<br/>
      <small>${escapeHtml(b.activity||"")}${b.notes? " • "+escapeHtml(b.notes):""}</small>`;
      el.appendChild(blk);
    });
    cardsEl.appendChild(el);
  });
  // Dicas
  if(plan.tips && plan.tips.length){
    const tips = document.createElement("div");
    tips.className = "card";
    tips.innerHTML = "<h4>Dicas</h4>"+plan.tips.map(t=>`<div class="block"><small>${escapeHtml(t)}</small></div>`).join("");
    cardsEl.appendChild(tips);
  }
}

function renderFallback({subjects, hours, goal}){
  const el = document.createElement("div");
  el.className = "card";
  el.innerHTML = `<h4>Plano básico</h4>
    <div class="block"><b>Priorize</b> — 40% do tempo nas matérias mais difíceis</div>
    <div class="block"><b>Rotina</b> — ${hours}h/dia divididas em blocos de 45–50min</div>
    <div class="block"><b>Objetivo</b> — ${escapeHtml(goal)}</div>
    <div class="block"><small>Matérias: ${escapeHtml(subjects)}</small></div>`;
  cardsEl.appendChild(el);
}

function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, (m)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;","'":"&#039;" }[m]));
}
