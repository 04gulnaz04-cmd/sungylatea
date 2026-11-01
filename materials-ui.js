(function () {
  'use strict';
  const config = window.SUNGYLA_MATERIALS || {};
  const core = window.SungylaSurvey;
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function safePath(path) {
    if (typeof path !== 'string' || !path.trim()) return '';
    const trimmed = path.trim();
    if (/^(https?:\/\/)/i.test(trimmed)) return trimmed;
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(trimmed)) return '';
    return trimmed;
  }
  function durationText(seconds) {
    if (!Number.isFinite(seconds)) return '';
    const rounded = Math.floor(seconds);
    return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
  }

  const videoGrid = document.getElementById('author-video-grid');
  if (videoGrid) {
    videoGrid.replaceChildren();
    (Array.isArray(config.videos) ? config.videos : []).forEach((item, index) => {
      const article = element('article', 'author-video-card');
      const stage = element('div', 'video-stage author-video-stage');
      const placeholder = element('div', 'media-placeholder');
      const placeholderIcon = element('span', 'placeholder-play', '▶');
      placeholderIcon.setAttribute('aria-hidden', 'true');
      const status = element('p', 'placeholder-title', 'Бейнематериал жүктелуде…');
      status.setAttribute('role', 'status');
      const fallback = element('p', 'placeholder-detail', '');
      placeholder.append(placeholderIcon, status, fallback);
      const video = element('video');
      video.controls = true;
      video.playsInline = true;
      video.preload = 'metadata';
      video.setAttribute('aria-label', item.title || 'Авторлық бейнематериал');
      video.hidden = true;
      const poster = safePath(item.poster);
      if (poster) video.poster = poster;
      const path = safePath(item.src);
      const body = element('div', 'author-video-body');
      const kicker = element('span', 'author-video-kicker', `${String(index + 1).padStart(2, '0')} / АВТОРЛЫҚ ЖҰМЫС`);
      const heading = element('h3', '', item.title || 'Авторлық бейнематериал');
      const description = element('p', '', item.description || '');
      const bottom = element('div', 'author-video-bottom');
      const duration = element('span', '', 'Материал дайындалуда');
      const download = element('a', 'author-video-download', 'Видеоны жүктеу ↓');
      download.download = '';
      download.hidden = true;
      if (path) download.href = path;
      bottom.append(duration, download);
      body.append(kicker, heading, description, bottom);
      stage.append(video, placeholder);
      article.append(stage, body);
      videoGrid.append(article);
      function unavailable() {
        video.hidden = true;
        placeholder.hidden = false;
        status.textContent = 'Бейнематериал әзірге қолжетімсіз';
        fallback.textContent = 'Материал қосылғаннан кейін осы жерден көруге болады.';
        duration.textContent = 'Материал дайындалуда';
        download.hidden = true;
      }
      video.addEventListener('loadedmetadata', () => {
        placeholder.hidden = true;
        video.hidden = false;
        duration.textContent = durationText(video.duration) || 'Авторлық бейнематериал';
        download.hidden = false;
      });
      video.addEventListener('error', unavailable);
      if (path) video.src = path;
      else unavailable();
    });
  }

  const dialogue = document.getElementById('dialogue-transcript');
  const lines = (Array.isArray(config.dialogue) ? config.dialogue : []).filter(line => line && typeof line.text === 'string' && line.text.trim());
  if (dialogue && lines.length) {
    const content = document.getElementById('dialogue-lines');
    lines.forEach(line => {
      const entry = element('div', 'dialogue-line');
      entry.append(element('strong', '', line.speaker || 'Қатысушы'), element('p', '', line.text));
      content.append(entry);
    });
    dialogue.hidden = false;
  }

  if (!core) return;
  const survey = config.survey || {};
  const questions = Array.isArray(survey.questions) ? survey.questions : [];
  const total = survey.participantCount;
  const results = questions.map(question => core.analyzeQuestion(question, total));
  const ready = results.filter(result => result.status === 'ready');
  document.getElementById('survey-total').textContent = core.count(total) ? String(total) : '—';
  document.getElementById('survey-question-count').textContent = String(questions.length);
  document.getElementById('survey-ready-count').textContent = `${ready.length} / ${questions.length}`;
  document.getElementById('survey-audience').textContent = survey.audience || 'Оқушылар';
  const date = document.getElementById('survey-date');
  if (typeof survey.date === 'string' && survey.date.trim()) {
    date.textContent = 'Өткізілген күні: ' + survey.date;
    date.hidden = false;
  }
  const overallStatus = document.getElementById('survey-status');
  const invalidCount = results.filter(result => result.status === 'invalid').length;
  overallStatus.textContent = invalidCount
    ? 'Кейбір сұрақтардағы сандарды тексеру қажет. Төменде түсіндірмелер берілген.'
    : ready.length === questions.length && ready.length
      ? 'Барлық сұрақтың сандық нәтижелері енгізілген.'
      : ready.length
        ? 'Қазір енгізілген нәтижелер көрсетілді. Қалған сұрақтар толықтырылады.'
        : 'Сауалнаманың сандық нәтижелері әлі енгізілмеген.';

  const list = document.getElementById('survey-results');
  list.replaceChildren();
  questions.forEach((question, index) => {
    const result = results[index];
    const card = element('article', 'survey-question');
    const headingRow = element('div', 'survey-question-heading');
    const number = element('span', 'survey-question-number', String(index + 1).padStart(2, '0'));
    const heading = element('h3', '', result.title || `${index + 1}-сұрақ`);
    heading.id = `survey-question-${index + 1}`;
    headingRow.append(number, heading);
    card.setAttribute('aria-labelledby', heading.id);
    card.append(headingRow);
    if (result.status === 'ready') {
      const note = element('p', 'survey-base', `Жауап бергендер: ${result.respondents} оқушы · ${result.type === 'single' ? 'Бір жауап' : 'Бірнеше жауап'}`);
      card.append(note);
      const bars = element('ul', 'survey-bars');
      result.rows.forEach(row => {
        const item = element('li', 'survey-bar-row');
        const labels = element('div', 'survey-bar-labels');
        const value = element('strong', '', `${row.count} оқушы · ${core.percentText(row.percent)}`);
        labels.append(element('span', '', row.label), value);
        const track = element('div', 'survey-bar-track');
        track.setAttribute('aria-hidden', 'true');
        const fill = element('span', 'survey-bar-fill');
        fill.style.width = `${row.percent}%`;
        track.append(fill);
        item.append(labels, track);
        bars.append(item);
      });
      card.append(bars);
      card.append(element('p', 'survey-method', result.type === 'multiple'
        ? 'Бір оқушы бірнеше жауапты таңдай алғандықтан, пайыздар қосындысы 100%-дан асуы мүмкін.'
        : 'Пайыз әр санаттағы оқушы санының осы сұраққа жауап бергендер санына қатынасымен есептелді. Дөңгелектеуге байланысты қосынды сәл ауытқуы мүмкін.'));
    } else {
      const empty = element('div', `survey-empty ${result.status === 'invalid' ? 'survey-invalid' : ''}`);
      empty.append(element('span', 'survey-empty-symbol', result.status === 'invalid' ? '!' : '—'), element('p', '', result.message));
      card.append(empty);
    }
    if (typeof question.note === 'string' && question.note.trim()) card.append(element('p', 'survey-question-note', question.note));
    list.append(card);
  });

  const summaries = core.summarize(results);
  const summaryList = document.getElementById('survey-summary-list');
  summaries.forEach(text => summaryList.append(element('li', '', text)));
  document.getElementById('survey-auto-summary').hidden = !summaries.length;
  const conclusion = document.getElementById('survey-conclusion-text');
  const ownConclusion = typeof survey.conclusion === 'string' ? survey.conclusion.trim() : '';
  if (ownConclusion) {
    conclusion.textContent = ownConclusion;
    conclusion.classList.remove('pending-conclusion');
  } else {
    conclusion.textContent = 'Автордың қорытындысы нақты нәтижелер енгізілгеннен кейін толықтырылады.';
  }

  const exportButton = document.getElementById('survey-export');
  exportButton.hidden = !ready.length;
  exportButton.addEventListener('click', () => {
    const blob = new Blob([core.toCSV(results)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = element('a');
    link.href = url;
    link.download = 'sungyla-survey-results.csv';
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  const attachment = document.getElementById('survey-attachment');
  const attachmentPath = safePath(survey.attachment?.src);
  if (attachmentPath) {
    attachment.href = attachmentPath;
    attachment.textContent = survey.attachment.label || 'Сауалнама қорытындысын жүктеу';
    attachment.hidden = false;
  }
  const imageItems = (Array.isArray(survey.images) ? survey.images : []).filter(item => item && safePath(item.src));
  if (imageItems.length) {
    const imageSection = document.getElementById('survey-images-section');
    const imageGrid = document.getElementById('survey-images');
    imageItems.forEach(item => {
      const figure = element('figure', 'survey-image');
      const link = element('a');
      link.href = safePath(item.src);
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      const image = element('img');
      image.alt = item.title || 'Сауалнама диаграммасы';
      image.loading = 'lazy';
      image.addEventListener('error', () => {
        const message = element('p', 'survey-empty', 'Диаграмма суреті әзірге қолжетімсіз.');
        link.replaceWith(message);
      });
      image.src = safePath(item.src);
      link.append(image);
      figure.append(link, element('figcaption', '', item.title || 'Сауалнама диаграммасы'));
      imageGrid.append(figure);
    });
    imageSection.hidden = false;
  }
})();
