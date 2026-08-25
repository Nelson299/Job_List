// Voice-to-text for the job notes field via the Web Speech API.
// Chrome/Edge only (webkit-prefixed); Firefox/Safari support is poor or
// absent, so the mic button hides itself when unsupported rather than
// erroring.

const Voice = (() => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  function isSupported() {
    return !!SpeechRecognition;
  }

  // Wires a mic button to append transcribed speech into a textarea.
  // Hides the button if the browser doesn't support speech recognition.
  function attach(buttonEl, textareaEl) {
    if (!isSupported()) {
      buttonEl.style.display = "none";
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    let listening = false;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join(" ");
      const sep = textareaEl.value && !textareaEl.value.endsWith(" ") ? " " : "";
      textareaEl.value += sep + transcript;
    };

    recognition.onend = () => {
      listening = false;
      buttonEl.classList.remove("listening");
      buttonEl.textContent = "\u{1F3A4} Voice to text";
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      listening = false;
      buttonEl.classList.remove("listening");
      buttonEl.textContent = "\u{1F3A4} Voice to text";
    };

    buttonEl.addEventListener("click", () => {
      if (listening) {
        recognition.stop();
        return;
      }
      listening = true;
      buttonEl.classList.add("listening");
      buttonEl.textContent = "⏹ Listening... (click to stop)";
      recognition.start();
    });
  }

  return { isSupported, attach };
})();
