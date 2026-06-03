const textInput = document.getElementById('textInput');
const loadTextButton = document.getElementById('loadTextButton');
const resetButton = document.getElementById('resetButton');
const currentWord = document.getElementById('currentWord');
const readingArea = document.getElementById('readingArea');

let structure = [];
let activeSentenceIndex = 0;
let activeWordIndex = 0;

function splitSentences(paragraph) {
  const matches = paragraph.match(/[^.!?]+[.!?]*|[^.!?]+$/g);
  return (matches || [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function splitWords(sentence) {
  return sentence.match(/\S+/g) || [];
}

function parseText(rawText) {
  return rawText
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => ({
      sentences: splitSentences(paragraph).map((sentence) => ({
        fullText: sentence,
        words: splitWords(sentence),
      })),
    }))
    .filter((paragraph) => paragraph.sentences.length > 0);
}

function flattenSentences(parsed) {
  return parsed.flatMap((paragraph, paragraphIndex) =>
    paragraph.sentences.map((sentence, sentenceIndex) => ({
      paragraphIndex,
      sentenceIndex,
      ...sentence,
    }))
  );
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

  const paragraphs = new Map();

  structure.forEach((sentence, flatIndex) => {
    if (!paragraphs.has(sentence.paragraphIndex)) {
      const paragraphEl = document.createElement('p');
      paragraphEl.className = 'paragraph';
      paragraphs.set(sentence.paragraphIndex, paragraphEl);
      readingArea.appendChild(paragraphEl);
    }

    const sentenceEl = document.createElement('span');
    sentenceEl.className = 'sentence';

    sentence.words.forEach((word, wordIndex) => {
      const wordEl = document.createElement('span');
      wordEl.className = 'word';
      wordEl.textContent = word;

      if (flatIndex === activeSentenceIndex && wordIndex === activeWordIndex) {
        wordEl.classList.add('active');
        currentWord.textContent = word;
        requestAnimationFrame(() => {
          wordEl.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        });
      }

      sentenceEl.appendChild(wordEl);

      if (wordIndex < sentence.words.length - 1) {
        sentenceEl.appendChild(document.createTextNode(' '));
      }
    });

    paragraphs.get(sentence.paragraphIndex).appendChild(sentenceEl);
  });
}

function loadText(resetPosition = true) {
  structure = flattenSentences(parseText(textInput.value));

  if (resetPosition) {
    activeSentenceIndex = 0;
    activeWordIndex = 0;
  }

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

loadTextButton.addEventListener('click', () => loadText(true));
resetButton.addEventListener('click', () => {
  activeSentenceIndex = 0;
  activeWordIndex = 0;
  clampIndices();
  render();
  readingArea.focus();
});

loadText();
