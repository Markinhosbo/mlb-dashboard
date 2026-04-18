const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const PORT = process.env.PORT || 3000;

// ── MLB Stats (temporada) ──────────────────────────────────
app.get('/api/mlb-stats', async (req, res) => {
  const { teamId, season } = req.query;
  if (!teamId) return res.status(400).json({ error: 'teamId obrigatório' });

  try {
    const url = `https://statsapi.mlb.com/api/v1/stats?stats=season&season=${season || 2026}&group=hitting&teamId=${teamId}&playerPool=All&limit=40`;
    const response = await fetch(url);
    const data = await response.json();
    const splits = (data?.stats?.[0]?.splits || []).filter(
      s => s.stat && s.player && (s.stat.atBats || 0) > 0
    );

    let usedSeason = season || 2026;
    let finalSplits = splits;

    if (!splits.length && (!season || season == 2026)) {
      const url2025 = `https://statsapi.mlb.com/api/v1/stats?stats=season&season=2025&group=hitting&teamId=${teamId}&playerPool=All&limit=40`;
      const r2 = await fetch(url2025);
      const d2 = await r2.json();
      finalSplits = (d2?.stats?.[0]?.splits || []).filter(
        s => s.stat && s.player && (s.stat.atBats || 0) > 0
      );
      usedSeason = 2025;
    }

    const players = finalSplits.map(s => {
      const st = s.stat;
      const games = parseInt(st.gamesPlayed) || 1;
      return {
        id: s.player.id,
        name: s.player.fullName,
        games,
        avg: parseFloat(st.avg) || 0,
        hits: parseInt(st.hits) || 0,
        hitsPerGame: ((parseInt(st.hits) || 0) / games).toFixed(2),
        homeRuns: parseInt(st.homeRuns) || 0,
        hrPerGame: ((parseInt(st.homeRuns) || 0) / games).toFixed(3),
        rbi: parseInt(st.rbi) || 0,
        rbiPerGame: ((parseInt(st.rbi) || 0) / games).toFixed(2),
        runs: parseInt(st.runs) || 0,
        runsPerGame: ((parseInt(st.runs) || 0) / games).toFixed(2),
        stolenBases: parseInt(st.stolenBases) || 0,
        strikeOuts: parseInt(st.strikeOuts) || 0,
        obp: parseFloat(st.obp) || 0,
        slg: parseFloat(st.slg) || 0,
        ops: parseFloat(st.ops) || 0,
        doubles: parseInt(st.doubles) || 0,
        triples: parseInt(st.triples) || 0,
        walks: parseInt(st.baseOnBalls) || 0,
      };
    });

    res.json({ season: usedSeason, players });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar dados da MLB' });
  }
});

// ── Game Log (últimos 15 jogos) ────────────────────────────
app.get('/api/game-log/:playerId', async (req, res) => {
  const { playerId } = req.params;
  const season = req.query.season || 2026;

  try {
    let url = `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=gameLog&season=${season}&group=hitting`;
    let response = await fetch(url);
    let data = await response.json();
    let games = data?.stats?.[0]?.splits || [];

    // Se não tiver dados em 2026, tenta 2025
    if (!games.length && season == 2026) {
      url = `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=gameLog&season=2025&group=hitting`;
      response = await fetch(url);
      data = await response.json();
      games = data?.stats?.[0]?.splits || [];
    }

    // Pega os últimos 15 jogos
    const last15 = games.slice(-15).map(g => ({
      date: g.date,
      hits: parseInt(g.stat?.hits) || 0,
      atBats: parseInt(g.stat?.atBats) || 0,
      homeRuns: parseInt(g.stat?.homeRuns) || 0,
      rbi: parseInt(g.stat?.rbi) || 0,
      runs: parseInt(g.stat?.runs) || 0,
      doubles: parseInt(g.stat?.doubles) || 0,
      triples: parseInt(g.stat?.triples) || 0,
      stolenBases: parseInt(g.stat?.stolenBases) || 0,
      totalBases: parseInt(g.stat?.totalBases) || 0,
    }));

    // Calcula hit rates
    const hitRate = (line) => {
      if (!last15.length) return null;
      const count = last15.filter(g => g.hits > line).length;
      return Math.round((count / last15.length) * 100);
    };

    const hrRate = (line) => {
      if (!last15.length) return null;
      const count = last15.filter(g => g.homeRuns > line).length;
      return Math.round((count / last15.length) * 100);
    };

    const rbiRate = (line) => {
      if (!last15.length) return null;
      const count = last15.filter(g => g.rbi > line).length;
      return Math.round((count / last15.length) * 100);
    };

    const tbRate = (line) => {
      if (!last15.length) return null;
      const count = last15.filter(g => g.totalBases > line).length;
      return Math.round((count / last15.length) * 100);
    };

    // Médias dos últimos 15 jogos
    const avg = (field) => last15.length
      ? (last15.reduce((s, g) => s + g[field], 0) / last15.length).toFixed(2)
      : '0.00';

    res.json({
      games: last15,
      totalGames: last15.length,
      hitRates: {
        hits_over_0_5: hitRate(0),
        hits_over_1_5: hitRate(1),
        hits_over_2_5: hitRate(2),
        hr_over_0_5: hrRate(0),
        rbi_over_0_5: rbiRate(0),
        rbi_over_1_5: rbiRate(1),
        tb_over_1_5: tbRate(1),
        tb_over_2_5: tbRate(2),
        runs_over_0_5: (() => { const c = last15.filter(g => g.runs > 0).length; return last15.length ? Math.round((c/last15.length)*100) : null; })(),
        sb_over_0_5: (() => { const c = last15.filter(g => g.stolenBases > 0).length; return last15.length ? Math.round((c/last15.length)*100) : null; })(),
      },
      recentAvg: {
        hitsPerGame: avg('hits'),
        hrPerGame: avg('homeRuns'),
        rbiPerGame: avg('rbi'),
        tbPerGame: avg('totalBases'),
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar game log' });
  }
});

// ── Gerar Apostas via Groq ─────────────────────────────────
app.post('/api/gerar-apostas', async (req, res) => {
  const { players, teamName, gameLogs } = req.body;
  if (!players || !teamName) return res.status(400).json({ error: 'Dados inválidos' });

  if (!GROQ_API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY não configurada' });

  const top20 = [...players]
    .sort((a, b) => (b.ops || 0) - (a.ops || 0))
    .slice(0, 8);

  // Monta dados enriquecidos com game log
  const enriched = top20.map(p => {
    const log = gameLogs?.[p.id];
    return {
      ...p,
      recentForm: log ? {
        lastGames: log.totalGames,
        avgHitsRecent: log.recentAvg.hitsPerGame,
        avgHRRecent: log.recentAvg.hrPerGame,
        avgRBIRecent: log.recentAvg.rbiPerGame,
        hitRates: log.hitRates,
      } : null
    };
  });

  const prompt = `Você é um analista profissional de apostas esportivas especializado em MLB.
Analise as estatísticas dos jogadores do time ${teamName} e gere até 5 sugestões de apostas VARIADAS.

JOGADORES (top 8 por OPS) com forma recente dos últimos 15 jogos:
${JSON.stringify(enriched, null, 2)}

REGRAS:
- Use hitsPerGame, hrPerGame, rbiPerGame da temporada E os dados de recentForm (últimos 15 jogos)
- Priorize jogadores onde a média recente (recentForm) confirma ou supera a média da temporada
- Use hitRates para validar: se a taxa histórica for >= 60% nos últimos 15 jogos, é um bom sinal
- IMPORTANTE: Varie os tipos de aposta! Não gere só hits. Use também: Home Runs, RBIs, Runs, Total Bases, Bases Roubadas
- Linhas aceitas: Hits 0.5/1.5/2.5 | Home Runs 0.5 | RBI 0.5/1.5 | Runs 0.5 | Total Bases 1.5/2.5 | Bases Roubadas 0.5
- IMPORTANTE: Gere APENAS apostas com probabilidade ACIMA de 70%
- type: lock (>80%), mid (70-80%) — NÃO inclua apostas abaixo de 70%
- Só jogadores com games >= 8
- Máximo 5 sugestões de tipos DIFERENTES — evite repetir o mesmo tipo de aposta
- Se não houver apostas acima de 70%, retorne lista vazia
- No campo hitRate inclua o % histórico real dos últimos jogos para aquela linha específica

Responda SOMENTE JSON válido sem markdown:
{"suggestions":[{"type":"lock|mid","player":"Nome","betType":"Tipo em pt-BR","line":"ex: 1.5 Hits","direction":"over|under","probability":78,"hitRate":73,"justification":"máx 2 frases"}]}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const raw = data?.choices?.[0]?.message?.content || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao gerar apostas: ' + err.message });
  }
});

app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
