const resetButton = document.getElementById('resetButton');
const currentWord = document.getElementById('currentWord');
const readingArea = document.getElementById('readingArea');
const storyImage = document.getElementById('storyImage');
const settingsModal = document.getElementById('settingsModal');
const navSettings = document.getElementById('navSettings');
const closeSettings = document.getElementById('closeSettings');
const storyGrid = document.getElementById('storyGrid');

const STORAGE_KEY = 'readingHelperStory';

function openModal() {
  settingsModal.hidden = false;
  closeSettings.focus();
}

function closeModal() {
  settingsModal.hidden = true;
  readingArea.focus();
}

navSettings.addEventListener('click', openModal);
closeSettings.addEventListener('click', closeModal);
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !settingsModal.hidden) closeModal();
});

// Story grid
let activeStoryId = localStorage.getItem(STORAGE_KEY) || null;

function renderStoryGrid() {
  storyGrid.innerHTML = '';
  window.STORIES.forEach((story) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'storyCard' + (story.id === activeStoryId ? ' selected' : '');

    const img = document.createElement('img');
    img.src = story.image;
    img.alt = story.title;
    img.className = 'storyCardImage';

    const title = document.createElement('span');
    title.className = 'storyCardTitle';
    title.textContent = story.title;

    card.appendChild(img);
    card.appendChild(title);

    card.addEventListener('click', () => {
      activeStoryId = story.id;
      localStorage.setItem(STORAGE_KEY, activeStoryId);
      loadStory(story);
      renderStoryGrid();
      closeModal();
    });

    storyGrid.appendChild(card);
  });
}

function loadStory(story) {
  structure = parseLines(story.text);
  activeSentenceIndex = 0;
  activeWordIndex = 0;
  if (story.image) {
    storyImage.src = story.image;
    storyImage.alt = story.title;
    storyImage.hidden = false;
  } else {
    storyImage.src = '';
    storyImage.hidden = true;
  }
  clampIndices();
  render();
}

let structure = [];
let activeSentenceIndex = 0;
let activeWordIndex = 0;

function splitWords(line) {
  return line.match(/\S+/g) || [];
}

function parseLines(rawText) {
  return rawText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      fullText: line,
      words: splitWords(line),
    }));
}

function clampIndices() {
  if (!structure.length) {
    activeSentenceIndex = 0;
    activeWordIndex = 0;
    return;
  }

  activeSentenceIndex = Math.max(0, Math.min(activeSentenceIndex, structure.length - 1));
  const words = structure[activeSentenceIndex].words;
  activeWordIndex = Math.max(0, Math.min(activeWordIndex, words.length - 1));
}

function render() {
  readingArea.innerHTML = '';

  if (!structure.length) {
    currentWord.textContent = 'No text';
    return;
  }

  const sentence = structure[activeSentenceIndex];

  if (activeSentenceIndex > 0) {
    const before = document.createElement('div');
    before.className = 'ellipsis';
    before.textContent = '…';
    readingArea.appendChild(before);
  }

  const sentenceEl = document.createElement('p');
  sentenceEl.className = 'sentence';

  sentence.words.forEach((word, wordIndex) => {
    const wordEl = document.createElement('span');
    wordEl.className = 'word';
    wordEl.textContent = word;

    if (wordIndex === activeWordIndex) {
      wordEl.classList.add('active');
      currentWord.textContent = word.replace(/[^\p{L}\p{M}'\u2019-]/gu, '');
    }

    sentenceEl.appendChild(wordEl);

    if (wordIndex < sentence.words.length - 1) {
      sentenceEl.appendChild(document.createTextNode(' '));
    }
  });

  readingArea.appendChild(sentenceEl);

  if (activeSentenceIndex < structure.length - 1) {
    const after = document.createElement('div');
    after.className = 'ellipsis';
    after.textContent = '…';
    readingArea.appendChild(after);
  }
}

function loadText(rawText) {
  structure = parseLines(rawText);

  activeSentenceIndex = 0;
  activeWordIndex = 0;

  clampIndices();
  render();
  readingArea.focus();
}

function moveWord(direction) {
  if (!structure.length) return;

  const currentSentence = structure[activeSentenceIndex];
  const nextWordIndex = activeWordIndex + direction;

  if (nextWordIndex >= 0 && nextWordIndex < currentSentence.words.length) {
    activeWordIndex = nextWordIndex;
  } else if (direction > 0 && activeSentenceIndex < structure.length - 1) {
    activeSentenceIndex += 1;
    activeWordIndex = 0;
  } else if (direction < 0 && activeSentenceIndex > 0) {
    activeSentenceIndex -= 1;
    activeWordIndex = structure[activeSentenceIndex].words.length - 1;
  }

  clampIndices();
  render();
}

function moveSentence(direction) {
  if (!structure.length) return;

  activeSentenceIndex = Math.max(0, Math.min(activeSentenceIndex + direction, structure.length - 1));
  activeWordIndex = 0;
  clampIndices();
  render();
}

window.addEventListener('keydown', (event) => {
  const targetTag = event.target.tagName;
  const isTyping = targetTag === 'TEXTAREA' || targetTag === 'INPUT';

  if (isTyping && !(event.metaKey || event.ctrlKey)) {
    return;
  }

  if (event.key === 'ArrowRight') {
    event.preventDefault();
    moveWord(1);
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    moveWord(-1);
  } else if (event.key === 'ArrowDown') {
    event.preventDefault();
    moveSentence(1);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    moveSentence(-1);
  }
});

resetButton.addEventListener('click', () => {
  activeSentenceIndex = 0;
  activeWordIndex = 0;
  clampIndices();
  render();
  readingArea.focus();
});

// Init: render story grid and restore last selected story
renderStoryGrid();
const savedStory = window.STORIES.find((s) => s.id === activeStoryId);
if (savedStory) {
  loadStory(savedStory);
} else if (window.STORIES.length > 0) {
  loadStory(window.STORIES[0]);
}
