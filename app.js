// =============================================
// STUDYSPRINT — app.js
// AI Exam Planner powered by Claude
// =============================================

async function generatePlan() {
  const examName    = document.getElementById('examName').value.trim();
  const examDate    = document.getElementById('examDate').value;
  const studyHours  = document.getElementById('studyHours').value.trim();
  const syllabus    = document.getElementById('syllabusInput').value.trim();
  const weakTopics  = document.getElementById('weakTopics').value.trim();

  if (!syllabus) {
    alert('Please enter your syllabus topics before generating a plan.');
    return;
  }
  if (!examDate) {
    alert('Please enter your exam date.');
    return;
  }

  // UI: loading state
  const btn       = document.getElementById('generateBtn');
  const btnText   = document.getElementById('btnText');
  const btnLoader = document.getElementById('btnLoader');
  btn.disabled    = true;
  btnText.style.display  = 'none';
  btnLoader.style.display = 'inline';

  const previewEmpty = document.getElementById('previewEmpty');
  const planOutput   = document.getElementById('planOutput');
  previewEmpty.style.display = 'none';
  planOutput.style.display   = 'none';
  planOutput.innerHTML       = '';

  // Show loading animation in preview box
  const previewBox = document.getElementById('previewBox');
  const loader = document.createElement('div');
  loader.className = 'loading-pulse';
  loader.id = 'loaderAnim';
  loader.innerHTML = `
    <div class="loading-dots"><span></span><span></span><span></span></div>
    <div class="loading-text">Claude is building your plan…</div>
  `;
  previewBox.appendChild(loader);

  // Build the today date for context
  const today = new Date().toISOString().split('T')[0];
  const daysLeft = Math.ceil((new Date(examDate) - new Date(today)) / (1000 * 60 * 60 * 24));

  const prompt = `
You are StudySprint, an expert AI study planner for students.

A student needs a comprehensive, personalized study plan. Here are their details:

- Exam/Subject: ${examName || 'Not specified'}
- Exam Date: ${examDate}
- Today's Date: ${today}
- Days Until Exam: ${daysLeft}
- Daily Study Hours Available: ${studyHours || '3'} hours
- Syllabus Topics:
${syllabus}
- Self-Reported Weak Topics: ${weakTopics || 'None specified'}

Please produce a structured study plan in the following JSON format ONLY (no markdown, no explanation outside JSON):

{
  "summary": "A 2-sentence overview of the study strategy",
  "totalDays": ${daysLeft},
  "dailyPlan": [
    {
      "day": "Day 1 · Mon 10 Jun",
      "focus": "Topic name(s)",
      "tasks": "Specific what to do today",
      "hours": "X hrs"
    }
  ],
  "revisionCycles": [
    {
      "week": "Week 1 Revision (Day 7)",
      "topics": ["Topic A", "Topic B"]
    }
  ],
  "weakTopicPredictions": [
    {
      "topic": "Topic name",
      "reason": "Short reason why it's risky",
      "priority": "High | Medium"
    }
  ],
  "motivationalSummary": "A warm, energising 3–4 sentence pep-talk personalised to this student's journey. Reference their exam name and days left."
}

Rules:
- dailyPlan should cover the first 7 days maximum (or all days if fewer than 7 remain).
- revisionCycles should have 2–4 entries.
- weakTopicPredictions should have 3–5 entries, mixing the student's self-reported ones with AI-predicted risky topics from the syllabus.
- Be specific, practical, and encouraging.
- Return ONLY valid JSON. No extra text.
`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    const raw  = data.content.map(b => b.text || '').join('');

    // Strip possible markdown fences
    const clean = raw.replace(/```json|```/g, '').trim();
    const plan  = JSON.parse(clean);

    renderPlan(plan, examName, daysLeft);

  } catch (err) {
    console.error('Error generating plan:', err);
    planOutput.style.display = 'block';
    planOutput.innerHTML = `
      <div style="padding:2rem;text-align:center;color:#c94040;">
        <div style="font-size:2rem;margin-bottom:1rem;">⚠️</div>
        <p style="font-size:0.85rem;">Something went wrong generating your plan. Please check your inputs and try again.</p>
        <p style="font-size:0.75rem;color:#999;margin-top:0.5rem;">${err.message}</p>
      </div>
    `;
  } finally {
    // Remove loader
    const l = document.getElementById('loaderAnim');
    if (l) l.remove();

    // Reset button
    btn.disabled = false;
    btnText.style.display  = 'inline';
    btnLoader.style.display = 'none';
  }
}

// =============================================
// RENDER PLAN
// =============================================
function renderPlan(plan, examName, daysLeft) {
  const planOutput = document.getElementById('planOutput');
  planOutput.style.display = 'block';

  const urgencyColor = daysLeft <= 7 ? '#c94040' : daysLeft <= 21 ? '#d97706' : '#2d7a4f';

  let html = `
    <!-- Header Banner -->
    <div style="background:var(--ink);color:var(--cream);padding:1.2rem 1.4rem;border-radius:10px;margin-bottom:1.5rem;">
      <div style="font-size:0.7rem;letter-spacing:0.1em;text-transform:uppercase;color:var(--amber);margin-bottom:0.3rem;">Your Study Plan</div>
      <div style="font-family:'Syne',sans-serif;font-weight:800;font-size:1.1rem;margin-bottom:0.3rem;">${examName || 'Exam'}</div>
      <div style="font-size:0.8rem;opacity:0.65;">${plan.summary}</div>
      <div style="margin-top:0.75rem;display:flex;gap:1rem;flex-wrap:wrap;">
        <span style="font-size:0.75rem;background:rgba(255,255,255,0.08);padding:0.3rem 0.75rem;border-radius:50px;">
          ⏳ <strong style="color:${urgencyColor}">${daysLeft}</strong> days left
        </span>
        <span style="font-size:0.75rem;background:rgba(255,255,255,0.08);padding:0.3rem 0.75rem;border-radius:50px;">
          📚 ${plan.dailyPlan?.length || 0} days planned
        </span>
      </div>
    </div>

    <!-- Daily Plan -->
    <div class="plan-section">
      <div class="plan-section-title">📆 Daily Study Plan</div>
  `;

  (plan.dailyPlan || []).forEach((d, i) => {
    html += `
      <div class="plan-day">
        <strong>${d.day}</strong>
        <span style="float:right;font-size:0.72rem;color:var(--amber);font-family:'Syne',sans-serif;font-weight:700;">${d.hours}</span>
        <div class="topics" style="color:var(--green);margin-top:0.15rem;font-size:0.8rem;">📖 ${d.focus}</div>
        <div class="topics" style="margin-top:0.2rem;">${d.tasks}</div>
      </div>
    `;
  });

  html += `</div><hr class="plan-divider"/>`;

  // Revision Cycles
  html += `
    <div class="plan-section">
      <div class="plan-section-title">🔁 Revision Cycles</div>
      <div>
  `;
  (plan.revisionCycles || []).forEach(r => {
    html += `
      <div style="margin-bottom:0.7rem;">
        <div style="font-size:0.75rem;font-family:'Syne',sans-serif;font-weight:700;margin-bottom:0.3rem;">${r.week}</div>
        <div>${(r.topics || []).map(t => `<span class="rev-chip">${t}</span>`).join('')}</div>
      </div>
    `;
  });
  html += `</div></div><hr class="plan-divider"/>`;

  // Weak Topic Predictions
  html += `
    <div class="plan-section">
      <div class="plan-section-title">⚠️ Weak Topic Predictions</div>
      <div>
  `;
  (plan.weakTopicPredictions || []).forEach(w => {
    const badge = w.priority === 'High'
      ? `<span style="font-size:0.65rem;background:#c94040;color:#fff;padding:0.15rem 0.5rem;border-radius:50px;margin-left:0.4rem;">HIGH</span>`
      : `<span style="font-size:0.65rem;background:#d97706;color:#fff;padding:0.15rem 0.5rem;border-radius:50px;margin-left:0.4rem;">MED</span>`;
    html += `
      <div style="background:var(--red-light);border:1px solid rgba(201,64,64,0.15);border-radius:8px;padding:0.7rem 0.9rem;margin-bottom:0.5rem;">
        <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:0.85rem;">${w.topic}${badge}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:0.2rem;">${w.reason}</div>
      </div>
    `;
  });
  html += `</div></div><hr class="plan-divider"/>`;

  // Motivational Summary
  html += `
    <div class="plan-section">
      <div class="plan-section-title">💬 Your Motivational Summary</div>
      <div class="motivation-box">"${plan.motivationalSummary}"</div>
    </div>
  `;

  planOutput.innerHTML = html;
}
