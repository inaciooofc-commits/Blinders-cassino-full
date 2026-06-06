import Chart from 'chart.js/auto';
import { shell, bindShellActions } from '../core/UI.js';
import { harmonySnapshot } from '../api/admin.js';
import { State } from '../core/State.js';
import { Performance } from '../core/Performance.js';

let charts = [];

export function GraphicsPage() {
  return shell(`
    <section class="kpi-grid">
      <div class="kpi"><span>Transações hoje</span><b id="kpiTx">0</b></div>
      <div class="kpi"><span>Cofre EMSHBY</span><b id="kpiBank">0</b></div>
      <div class="kpi"><span>FPS estimado</span><b id="kpiFps">60</b></div>
      <div class="kpi"><span>Carga visual</span><b id="kpiLoad">0%</b></div>
    </section>
    <section class="chart-grid">
      <article class="chart-card"><h2>📈 Transações</h2><canvas id="txChart"></canvas></article>
      <article class="chart-card"><h2>⚙️ Carga</h2><canvas id="loadChart"></canvas></article>
      <article class="chart-card"><h2>🏦 Banco IRIS</h2><canvas id="bankChart"></canvas></article>
      <article class="chart-card"><h2>🎮 Jogos</h2><canvas id="gamesChart"></canvas></article>
    </section>
  `, {
    title: 'Gráficos vivos',
    subtitle: 'Sistema atualizando visualmente a cada segundo.',
    bg: 'admin'
  });
}

export function bindGraphicsPage() {
  bindShellActions();
  charts.forEach(chart => chart.destroy());
  charts = [];

  const txData = Array.from({ length: 30 }, () => Math.random() * 20 + 5);
  const loadData = Array.from({ length: 30 }, () => Math.random() * 70 + 10);
  const bankData = Array.from({ length: 30 }, () => Math.random() * 80 + 20);

  charts.push(makeLine('txChart', txData, 'Transações'));
  charts.push(makeLine('loadChart', loadData, 'Carga'));
  charts.push(makeLine('bankChart', bankData, 'Banco'));
  charts.push(new Chart(document.getElementById('gamesChart'), {
    type: 'doughnut',
    data: {
      labels: ['Crash', 'Roleta', 'Slots', 'Blackjack', 'Dados'],
      datasets: [{ data: [30, 18, 22, 14, 16] }]
    },
    options: chartOptions()
  }));

  async function tick() {
    const load = Math.round(25 + Math.random() * 60);
    const fps = Math.round(48 + Math.random() * 12);
    document.getElementById('kpiLoad').textContent = `${load}%`;
    document.getElementById('kpiFps').textContent = `${fps} FPS`;

    txData.push((txData.at(-1) || 10) + (Math.random() - .45) * 8);
    txData.shift();
    loadData.push(load);
    loadData.shift();
    bankData.push(Math.max(5, (bankData.at(-1) || 50) + (Math.random() - .5) * 10));
    bankData.shift();

    charts.slice(0, 3).forEach(chart => chart.update(Performance.lowMode ? 'none' : 'active'));

    if (State.token) {
      try {
        const snap = await harmonySnapshot();
        document.getElementById('kpiTx').textContent = snap.summary?.transactionsToday ?? 0;
        document.getElementById('kpiBank').textContent = snap.bank?.balanceLabel ?? '0';
      } catch {}
    }
  }

  tick();
  Performance.interval(tick, 1000);
}

function makeLine(id, data, label) {
  return new Chart(document.getElementById(id), {
    type: 'line',
    data: {
      labels: data.map((_, i) => i + 1),
      datasets: [{ label, data, tension: .42, fill: true }]
    },
    options: chartOptions()
  });
}

function chartOptions() {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#fbf3df' } } },
    scales: {
      x: { ticks: { color: '#c9c2b5' }, grid: { color: 'rgba(255,255,255,.07)' } },
      y: { ticks: { color: '#c9c2b5' }, grid: { color: 'rgba(255,255,255,.07)' } }
    }
  };
}
