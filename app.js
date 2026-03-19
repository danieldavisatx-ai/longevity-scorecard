// === STATE ===
let activeCategory = 'all';
let activeAvailability = 'all';
let sortField = 'composite';
let chartStage, chartCategory, chartScatter;

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initFilters();
  initSort();
  render();
  initCharts();
});

// === THEME ===
function initThemeToggle() {
  const t = document.querySelector('[data-theme-toggle]');
  const r = document.documentElement;
  let d = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  r.setAttribute('data-theme', d);
  if (t) {
    updateToggleIcon(t, d);
    t.addEventListener('click', () => {
      d = d === 'dark' ? 'light' : 'dark';
      r.setAttribute('data-theme', d);
      updateToggleIcon(t, d);
      updateChartsTheme();
    });
  }
}

function updateToggleIcon(btn, theme) {
  btn.setAttribute('aria-label', 'Switch to ' + (theme === 'dark' ? 'light' : 'dark') + ' mode');
  btn.innerHTML = theme === 'dark'
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
}

// === FILTERS ===
function initFilters() {
  document.querySelectorAll('.filter-pills').forEach(group => {
    const filterType = group.dataset.filter;
    group.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        if (filterType === 'category') activeCategory = pill.dataset.value;
        if (filterType === 'availability') activeAvailability = pill.dataset.value;
        render();
      });
    });
  });
}

function initSort() {
  document.getElementById('sort-select').addEventListener('change', e => {
    sortField = e.target.value;
    render();
  });
}

// === FILTER + SORT ===
function getFiltered() {
  let data = [...INTERVENTIONS];
  if (activeCategory !== 'all') data = data.filter(d => d.category === activeCategory);
  if (activeAvailability !== 'all') data = data.filter(d => d.availability === activeAvailability);
  
  const fieldMap = {
    composite: 'composite',
    mechanism: 'mechanism',
    clinical: 'clinical',
    biomarker: 'biomarker',
    safety: 'safety',
    cost: 'cost'
  };
  const field = fieldMap[sortField] || 'composite';
  data.sort((a, b) => b[field] - a[field]);
  return data;
}

// === RENDER ===
function render() {
  const data = getFiltered();
  renderKPIs(data);
  renderCards(data);
  renderTable(data);
  updateCharts();
}

function renderKPIs() {
  const all = INTERVENTIONS;
  document.getElementById('kpi-total').textContent = all.length;
  document.getElementById('kpi-human').textContent = all.filter(d => d.availability === 'clinical' || d.stageLabel.includes('Approved') || d.stageLabel.includes('Phase')).length;
  document.getElementById('kpi-tryable').textContent = all.filter(d => d.availability === 'try-now').length;
  document.getElementById('kpi-theater').textContent = all.filter(d => d.composite < 4).length;
}

function scoreColor(score) {
  if (score >= 7) return 'score-high';
  if (score >= 4) return 'score-mid';
  return 'score-low';
}

function scoreBg(score) {
  if (score >= 7) return 'var(--color-success)';
  if (score >= 4) return 'var(--color-gold)';
  return 'var(--color-notification)';
}

function categoryLabel(cat) {
  const map = {
    reprogramming: 'Reprogramming',
    senolytic: 'Senolytics',
    pharmacological: 'Pharmacological',
    supplement: 'Supplement',
    lifestyle: 'Lifestyle'
  };
  return map[cat] || cat;
}

function availabilityBadge(avail) {
  const map = {
    'try-now': '<span class="badge badge-green">Can Try Now</span>',
    'clinical': '<span class="badge badge-blue">Clinical Trials</span>',
    'preclinical': '<span class="badge badge-gray">Preclinical</span>'
  };
  return map[avail] || '';
}

function renderCards(data) {
  const grid = document.getElementById('cards-grid');
  document.getElementById('cards-count').textContent = `${data.length} of ${INTERVENTIONS.length} shown`;
  
  grid.innerHTML = data.map(d => `
    <article class="int-card" data-id="${d.id}">
      <div class="int-card-header">
        <div>
          <h3 class="int-name">${d.name}</h3>
          <div class="int-meta">
            <span class="cat-tag cat-${d.category}">${categoryLabel(d.category)}</span>
            ${availabilityBadge(d.availability)}
          </div>
        </div>
        <div class="composite-ring" style="--score-color: ${scoreBg(d.composite)}">
          <span class="composite-value">${d.composite}</span>
          <span class="composite-label">/ 10</span>
        </div>
      </div>
      <div class="int-stage">${d.stage}</div>
      <div class="int-scores">
        <div class="score-bar-row">
          <span class="score-label">Mechanism</span>
          <div class="score-track"><div class="score-fill" style="width: ${d.mechanism * 10}%; background: ${scoreBg(d.mechanism)}"></div></div>
          <span class="score-num">${d.mechanism}</span>
        </div>
        <div class="score-bar-row">
          <span class="score-label">Clinical</span>
          <div class="score-track"><div class="score-fill" style="width: ${d.clinical * 10}%; background: ${scoreBg(d.clinical)}"></div></div>
          <span class="score-num">${d.clinical}</span>
        </div>
        <div class="score-bar-row">
          <span class="score-label">Biomarkers</span>
          <div class="score-track"><div class="score-fill" style="width: ${d.biomarker * 10}%; background: ${scoreBg(d.biomarker)}"></div></div>
          <span class="score-num">${d.biomarker}</span>
        </div>
        <div class="score-bar-row">
          <span class="score-label">Safety</span>
          <div class="score-track"><div class="score-fill" style="width: ${d.safety * 10}%; background: ${scoreBg(d.safety)}"></div></div>
          <span class="score-num">${d.safety}</span>
        </div>
        <div class="score-bar-row">
          <span class="score-label">Cost</span>
          <div class="score-track"><div class="score-fill" style="width: ${d.cost * 10}%; background: ${scoreBg(d.cost)}"></div></div>
          <span class="score-num">${d.cost}</span>
        </div>
      </div>
      <div class="int-verdict">${d.verdict}</div>
      <button class="expand-btn" onclick="toggleExpand('${d.id}')">Details ▾</button>
      <div class="int-details" id="details-${d.id}">
        <div class="detail-row"><strong>Mechanism:</strong> ${d.mechanismNote}</div>
        <div class="detail-row"><strong>Clinical:</strong> ${d.clinicalNote}</div>
        <div class="detail-row"><strong>Biomarkers:</strong> ${d.biomarkerNote}</div>
        <div class="detail-row"><strong>Safety:</strong> ${d.safetyNote}</div>
        <div class="detail-row"><strong>Cost:</strong> ${d.costNote}</div>
        <div class="detail-row"><strong>Organism:</strong> ${d.organism}</div>
      </div>
    </article>
  `).join('');
}

function toggleExpand(id) {
  const el = document.getElementById('details-' + id);
  const btn = el.previousElementSibling;
  el.classList.toggle('open');
  btn.textContent = el.classList.contains('open') ? 'Details ▴' : 'Details ▾';
}

function renderTable(data) {
  const tbody = document.getElementById('table-body');
  tbody.innerHTML = data.map(d => `
    <tr>
      <td class="td-name">${d.name}</td>
      <td><span class="cat-tag cat-${d.category}">${categoryLabel(d.category)}</span></td>
      <td>${d.stageLabel}</td>
      <td class="${scoreColor(d.mechanism)}">${d.mechanism}</td>
      <td class="${scoreColor(d.clinical)}">${d.clinical}</td>
      <td class="${scoreColor(d.biomarker)}">${d.biomarker}</td>
      <td class="${scoreColor(d.safety)}">${d.safety}</td>
      <td class="${scoreColor(d.cost)}">${d.cost}</td>
      <td class="${scoreColor(d.composite)}" style="font-weight:700">${d.composite}</td>
      <td class="td-verdict">${d.verdict.split('.')[0]}.</td>
    </tr>
  `).join('');
}

// === CHARTS ===
function getChartColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    text: isDark ? '#cdccca' : '#28251d',
    textMuted: isDark ? '#797876' : '#7a7974',
    grid: isDark ? '#2d2c2a' : '#e6e4df',
    surface: isDark ? '#1c1b19' : '#f9f8f5',
    accent: ['#4f98a3', '#6daa45', '#e8af34', '#dd6974', '#a86fdf', '#fdab43', '#5591c7'],
    accentLight: ['#01696f', '#437a22', '#d19900', '#a13544', '#7a39bb', '#da7101', '#006494']
  };
}

function initCharts() {
  const c = getChartColors();
  Chart.defaults.color = c.textMuted;
  Chart.defaults.font.family = "'General Sans', sans-serif";
  Chart.defaults.font.size = 12;

  // Stage distribution
  const stageCounts = {};
  INTERVENTIONS.forEach(d => {
    const s = d.stageLabel;
    stageCounts[s] = (stageCounts[s] || 0) + 1;
  });
  const stageLabels = Object.keys(stageCounts);
  const stageData = Object.values(stageCounts);

  chartStage = new Chart(document.getElementById('chart-stage'), {
    type: 'doughnut',
    data: {
      labels: stageLabels,
      datasets: [{
        data: stageData,
        backgroundColor: c.accent.slice(0, stageLabels.length).concat(c.accentLight),
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      cutout: '60%',
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 10, padding: 8, font: { size: 11 } } }
      }
    }
  });

  // Category breakdown
  const catCounts = {};
  INTERVENTIONS.forEach(d => {
    const cat = categoryLabel(d.category);
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  });

  chartCategory = new Chart(document.getElementById('chart-category'), {
    type: 'bar',
    data: {
      labels: Object.keys(catCounts),
      datasets: [{
        data: Object.values(catCounts),
        backgroundColor: c.accent.slice(0, Object.keys(catCounts).length),
        borderRadius: 4,
        barThickness: 28
      }]
    },
    options: {
      responsive: true,
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: c.grid }, ticks: { stepSize: 1 } },
        y: { grid: { display: false } }
      }
    }
  });

  // Scatter: composite vs cost
  const scatterData = INTERVENTIONS.map(d => ({
    x: d.cost,
    y: d.composite,
    label: d.name.length > 20 ? d.name.substring(0, 18) + '…' : d.name
  }));

  const catColorMap = {
    reprogramming: c.accent[0],
    senolytic: c.accent[1],
    pharmacological: c.accent[2],
    supplement: c.accent[3],
    lifestyle: c.accent[4]
  };

  chartScatter = new Chart(document.getElementById('chart-scatter'), {
    type: 'scatter',
    data: {
      datasets: [{
        data: scatterData,
        pointBackgroundColor: INTERVENTIONS.map(d => catColorMap[d.category] || c.accent[5]),
        pointRadius: 6,
        pointHoverRadius: 9
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const d = INTERVENTIONS[ctx.dataIndex];
              return `${d.name}: Composite ${d.composite}, Cost ${d.cost}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Cost Accessibility →', font: { size: 11 } },
          grid: { color: c.grid },
          min: -0.5, max: 10.5
        },
        y: {
          title: { display: true, text: 'Composite Score →', font: { size: 11 } },
          grid: { color: c.grid },
          min: 0, max: 10
        }
      }
    }
  });
}

function updateChartsTheme() {
  const c = getChartColors();
  Chart.defaults.color = c.textMuted;
  [chartStage, chartCategory, chartScatter].forEach(chart => {
    if (!chart) return;
    if (chart.options.scales) {
      Object.values(chart.options.scales).forEach(scale => {
        if (scale.grid) scale.grid.color = c.grid;
        if (scale.title) scale.title.color = c.textMuted;
      });
    }
    chart.update();
  });
}

function updateCharts() {
  // Charts show all data (not filtered) for context
}
