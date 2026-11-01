/* Survey calculations are independent of the page and contain no sample results. */
(function (root) {
  'use strict';
  const missing = value => value === null || value === undefined || value === '';
  const count = value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
  const validTotal = value => missing(value) || count(value);
  const formatter = new Intl.NumberFormat('kk-KZ', { maximumFractionDigits: 1 });
  const percentText = value => formatter.format(value) + '%';

  function analyzeQuestion(question, total) {
    const base = { title: String(question?.title || ''), rows: [], respondents: question?.respondents, type: question?.type };
    const result = (status, message) => ({ ...base, status, message });
    if (!validTotal(total)) return result('invalid', 'Қатысушылардың жалпы саны бүтін, теріс емес сан болуы керек.');
    if (!question || !Array.isArray(question.answers) || !question.answers.length) return result('invalid', 'Жауап нұсқалары енгізілмеген.');
    if (!['single', 'multiple'].includes(question.type)) return result('invalid', 'Сұрақтың жауап түрін тексеріңіз.');
    if (missing(question.respondents) || question.answers.some(answer => missing(answer?.count))) return result('pending', 'Бұл сұрақтың нәтижелері әлі толық енгізілмеген.');
    if (!count(question.respondents) || question.answers.some(answer => !count(answer.count))) return result('invalid', 'Жауаптар саны бүтін, теріс емес сан болуы керек.');
    if (question.answers.some(answer => typeof answer.label !== 'string' || !answer.label.trim())) return result('invalid', 'Әр жауап санатының атауын енгізіңіз.');
    const labels = question.answers.map(answer => answer.label.trim());
    if (new Set(labels).size !== labels.length) return result('invalid', 'Қайталанатын жауап санаттарын біріктіріңіз немесе атауын нақтылаңыз.');
    const n = question.respondents;
    if (!missing(total) && n > total) return result('invalid', 'Сұраққа жауап бергендер саны жалпы қатысушылар санынан артық.');
    if (question.answers.some(answer => answer.count > n)) return result('invalid', 'Бір жауаптың саны осы сұраққа жауап бергендер санынан артық.');
    const sum = question.answers.reduce((value, answer) => value + answer.count, 0);
    if (!Number.isSafeInteger(sum)) return result('invalid', 'Жауаптар саны тым үлкен.');
    if (question.type === 'single' && sum !== n) return result('invalid', 'Бір жауапты сұрақта жауаптар қосындысы жауап бергендер санына тең болуы керек.');
    if (question.type === 'multiple' && sum < n) return result('invalid', 'Жауаптардың қосындысы жауап берген оқушылар санынан аз. Бос жауаптарды жауап бергендер санына қоспаңыз.');
    if (n === 0) return result('empty', 'Бұл сұрақ бойынша жауап тіркелмеген.');
    return {
      ...base, status: 'ready', message: '',
      rows: question.answers.map(answer => ({ label: answer.label.trim(), count: answer.count, percent: answer.count / n * 100 })),
    };
  }

  function summarize(results) {
    return results.flatMap((result, index) => {
      if (result.status !== 'ready') return [];
      const maximum = Math.max(...result.rows.map(row => row.count));
      const leaders = result.rows.filter(row => row.count === maximum);
      const answers = leaders.map(row => `«${row.label}»`).join(', ');
      const amount = leaders.length === 1 ? `${maximum} оқушы` : `әрқайсысын ${maximum} оқушы`;
      return [`${index + 1}-сұрақ: ең жиі көрсетілген жауап${leaders.length > 1 ? 'тар' : ''} — ${answers}; ${amount} (${percentText(leaders[0].percent)}). Есептеу негізі — ${result.respondents} жауап берген оқушы.`];
    });
  }

  // Prefix spreadsheet formulas before exporting participant-supplied labels.
  function csvCell(value) {
    let text = String(value ?? '');
    if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }
  function toCSV(results) {
    const lines = [['Сұрақ', 'Жауап түрі', 'Жауап бергендер саны', 'Жауап санаты', 'Оқушы саны', 'Пайыз']];
    results.filter(result => result.status === 'ready').forEach(result => {
      result.rows.forEach(row => lines.push([result.title, result.type === 'single' ? 'Бір жауап' : 'Бірнеше жауап', result.respondents, row.label, row.count, row.percent.toFixed(1)]));
    });
    return '\ufeff' + lines.map(line => line.map(csvCell).join(';')).join('\r\n');
  }
  root.SungylaSurvey = Object.freeze({ analyzeQuestion, summarize, toCSV, percentText, count, validTotal });
})(typeof window === 'undefined' ? globalThis : window);
