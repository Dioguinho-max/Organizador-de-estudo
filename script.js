document.getElementById("study-form").addEventListener("submit", function(e) {
  e.preventDefault();

  const subjects = document.getElementById("subjects").value;
  const time = document.getElementById("time").value;
  const goal = document.getElementById("goal").value;

  const resultBox = document.getElementById("plan-result");

  // Simulação de IA (depois integrar com API real)
  const plano = `📘 Plano de Estudos Personalizado
  - Matérias: ${subjects}
  - Tempo diário: ${time}h
  - Objetivo: ${goal}
  ✅ Sugestão: Divida o tempo igualmente entre as matérias, começando pela mais difícil. Revise no final da semana.`;

  resultBox.innerText = plano;
});
