let container= null
let button = null
let buttonIcon = null
let body = null
let word = ''

function handleSelection() {
  // Small delay ensures Chrome registers the final selection layout
  setTimeout(() => {
    const selection = window.getSelection()
    const selectedString = selection.toString().trim().toLowerCase();
    
    
    if (selectedString.length > 0) {
      word = selectedString
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      container.style.left = `${window.scrollX + rect.right + 8}px`;
      container.style.top = `${window.scrollY + rect.top}px`;
      button.classList.remove('hidden')
      container.classList.remove('hidden')

    } else {
      button.classList.add('hidden')
      container.classList.add('hidden')
    }
  }, 10);
}

async function  initExtension() {
  let response = await fetch(chrome.runtime.getURL('./content.html'))
  let htmlContent = await response.text()

  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')

  body = doc.getElementsByTagName('body')[0]
  
  container = doc.getElementById('dict-extn-container')

  button = doc.getElementById('dict-extn-button')

  buttonIcon = doc.getElementById('dict-extn-icon')
  buttonIcon.src = chrome.runtime.getURL('icons/icon32.png');
  resultElement = doc.getElementById('dict-extn-result')

  button.addEventListener('click', ()=>{
    resultElement.classList.remove('hidden')
    displayMeaning()
  })
  document.body.appendChild(container) 
}

// Triggers when user finishes dragging with the mouse
document.addEventListener("mouseup", handleSelection);

// Triggers when user finishes selecting using Shift + Arrow keys
document.addEventListener("keyup", (event) => {
  if (event.shiftKey || event.key === "ArrowLeft" || event.key === "ArrowRight" || event.key === "ArrowUp" || event.key === "ArrowDown") {
    handleSelection();
  }
});


document.body.addEventListener('click', ()=>{
  if (resultElement) {
    resultElement.classList.add('hidden')
  }
})

async function fetchDefinition(word) {
  try {
    const data = await getMeaning(word);
    const firstMeaning = data && data.entries && data.entries[0];
    const firstDefinition = firstMeaning && firstMeaning.senses && firstMeaning.senses[0] && firstMeaning.senses[0]

    return {
      word: data && data.word,
      partOfSpeech: firstMeaning && firstMeaning.partOfSpeech,
      definition: firstDefinition && firstDefinition.definition,
      example: firstDefinition && firstDefinition.examples && firstDefinition.examples[0]
    };
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getMeaning(word) {
  const response = await fetch(
    `https://freedictionaryapi.com/api/v1/entries/en/${encodeURIComponent(word)}`
  );

  if (!response.ok) {
    throw new Error("Word not found");
  }

  const data = await response.json();

  return data;
}

async function displayMeaning() {
  if (!word) {
    return
  }
  const data = await fetchDefinition(word)
  
  // Set text fields
  container.querySelector('#dict-extn-word').textContent = data.word;
  container.querySelector('#dict-extn-pos').textContent = data.partOfSpeech || '';
  container.querySelector('#dict-extn-definition').textContent = data.definition || 'No definition found.';
  
  // Handle optional examples field cleanly
  const exampleEl = container.querySelector('#dict-extn-example');
  if (data.example) {
    exampleEl.textContent = `"${data.example}"`;
    exampleEl.style.display = 'block';
  } else {
    exampleEl.style.display = 'none';
  }

  // Show the content section window
  resultElement.classList.remove('hidden')
}

initExtension()