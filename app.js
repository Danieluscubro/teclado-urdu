(() => {
  const urduInput = document.getElementById('urduInput');
  const spanishOutput = document.getElementById('spanishOutput');
  const keyboardEl = document.getElementById('keyboard');
  const statusEl = document.getElementById('status');
  const autoTranslateEl = document.getElementById('autoTranslate');
  const translitToggle = document.getElementById('translitToggle');
  const translateBtn = document.getElementById('translateBtn');
  const clearBtn = document.getElementById('clearBtn');
  const copyBtn = document.getElementById('copyBtn');
  const directionSel = document.getElementById('directionSel');
  const micStartBtn = document.getElementById('micStartBtn');
  const micStopBtn = document.getElementById('micStopBtn');
  const micLangSel = document.getElementById('micLang');
  const micStatus = document.getElementById('micStatus');
  const micBothToggle = document.getElementById('micBoth');
  const micAutoEs2UrToggle = document.getElementById('micAutoEs2Ur');
  const speakBtn = document.getElementById('speakBtn');
  const speakStopBtn = document.getElementById('speakStopBtn');

  const rows = [
    ['ا','ب','پ','ت','ٹ','ث','ج','چ','ح','خ'],
    ['د','ڈ','ذ','ر','ڑ','ز','ژ','س','ش','ص'],
    ['ض','ط','ظ','ع','غ','ف','ق','ک','گ','ل'],
    ['م','ن','ں','و','ہ','ء','ی','ے','ئ']
  ];
  const specials = [
    { label: 'Espacio', val: ' ', cls: 'key--special' },
    { label: 'Retroceso', val: 'BACKSPACE', cls: 'key--special' },
    { label: 'Enter', val: '\n', cls: 'key--special' }
  ];

  function isUrduToSpanish() {
    return !directionSel || directionSel.value === 'ur-es';
  }

  function buildKeyboard() {
    const frag = document.createDocumentFragment();
    rows.flat().forEach(ch => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'key';
      b.textContent = ch;
      b.setAttribute('aria-label', `Insertar ${ch}`);
      b.addEventListener('click', () => insertChar(ch));
      frag.appendChild(b);
    });
    specials.forEach(sp => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `key ${sp.cls}`;
      b.textContent = sp.label;
      b.addEventListener('click', () => {
        if (sp.val === 'BACKSPACE') backspace(); else insertChar(sp.val);
      });
      frag.appendChild(b);
    });
    keyboardEl.appendChild(frag);
  }

  function insertChar(ch) {
    if (!isUrduToSpanish()) return; // En modo es→ur, el urduInput actúa como salida
    const start = urduInput.selectionStart;
    const end = urduInput.selectionEnd;
    const before = urduInput.value.slice(0, start);
    const after = urduInput.value.slice(end);
    urduInput.value = before + ch + after;
    const caret = start + ch.length;
    urduInput.focus();
    urduInput.setSelectionRange(caret, caret);
    scheduleTranslate();
  }

  function backspace() {
    if (!isUrduToSpanish()) return;
    const start = urduInput.selectionStart;
    const end = urduInput.selectionEnd;
    if (start === end && start > 0) {
      const before = urduInput.value.slice(0, start - 1);
      const after = urduInput.value.slice(end);
      urduInput.value = before + after;
      const caret = start - 1;
      urduInput.focus();
      urduInput.setSelectionRange(caret, caret);
    } else {
      const before = urduInput.value.slice(0, start);
      const after = urduInput.value.slice(end);
      urduInput.value = before + after;
      urduInput.setSelectionRange(start, start);
    }
    scheduleTranslate();
  }

  let debounceTimer = null;
  function scheduleTranslate() {
    if (!autoTranslateEl.checked) return;
    clearTimeout(debounceTimer);
    if (isUrduToSpanish()) {
      if (!urduInput.value.trim()) {
        spanishOutput.value = '';
        statusEl.textContent = 'Escribe en urdú para ver la traducción…';
        return;
      }
    } else {
      if (!spanishOutput.value.trim()) {
        urduInput.value = '';
        statusEl.textContent = 'Escribe en español para ver la traducción…';
        return;
      }
    }
    statusEl.textContent = 'Traduciendo…';
    debounceTimer = setTimeout(() => translateNow(), 450);
  }

  translateBtn.addEventListener('click', () => translateNow());
  autoTranslateEl.addEventListener('change', () => scheduleTranslate());
  clearBtn.addEventListener('click', () => {
    urduInput.value = '';
    spanishOutput.value = '';
    statusEl.textContent = isUrduToSpanish() ? 'Escribe en urdú para ver la traducción…' : 'Escribe en español para ver la traducción…';
  });
  translitToggle.addEventListener('change', () => {
    if (!isUrduToSpanish()) return; // transliteración solo aplica cuando urdú es entrada
    if (translitToggle.checked && urduInput.value) {
      const t = transliterateLatinToUrdu(urduInput.value);
      urduInput.value = t;
      const caret = t.length;
      urduInput.setSelectionRange(caret, caret);
    }
    scheduleTranslate();
  });
  copyBtn.addEventListener('click', async () => {
    const src = isUrduToSpanish() ? spanishOutput.value : urduInput.value;
    if (!src) return;
    try {
      await navigator.clipboard.writeText(src);
      statusEl.textContent = 'Texto copiado al portapapeles';
      setTimeout(() => { statusEl.textContent = ''; }, 1200);
    } catch {
      statusEl.textContent = 'No se pudo copiar';
    }
  });

  async function translateNow() {
    if (isUrduToSpanish()) {
      const text = urduInput.value.trim();
      if (!text) return;
      statusEl.textContent = 'Traduciendo…';
      try {
        const translated = await translateUrduToSpanish(text);
        spanishOutput.value = translated || '';
        statusEl.textContent = translated ? 'Traducción lista' : 'Sin resultado';
      } catch (err) {
        console.error(err);
        statusEl.textContent = 'Error al traducir (conexión o límite).';
      }
    } else {
      const text = spanishOutput.value.trim();
      if (!text) return;
      statusEl.textContent = 'Traduciendo…';
      try {
        const translated = await translateSpanishToUrdu(text);
        urduInput.value = translated || '';
        statusEl.textContent = translated ? 'Traducción lista' : 'Sin resultado';
      } catch (err) {
        console.error(err);
        statusEl.textContent = 'Error al traducir es→ur (conexión o límite).';
      }
    }
  }

  // Transliteración simple latino → urdú (para entrada urdú)
  function transliterateLatinToUrdu(input) {
    const s = input;
    const out = [];
    for (let i = 0; i < s.length; ) {
      const rem = s.slice(i);
      const lower2 = rem.slice(0,2).toLowerCase();
      const lower3 = rem.slice(0,3).toLowerCase();
      const map2 = {
        'ch':'چ','sh':'ش','zh':'ژ','kh':'خ','gh':'غ','ph':'ف','th':'تھ','dh':'دھ','rr':'ڑ','aa':'آ','ii':'ی','ee':'ی','oo':'و'
      };
      const map1 = {
        'a':'ا','b':'ب','c':'ک','d':'د','e':'ے','f':'ف','g':'گ','h':'ہ','i':'ی','j':'ج','k':'ک','l':'ل','m':'م','n':'ن','ñ':'ں','o':'و','p':'پ','q':'ق','r':'ر','s':'س','t':'ت','u':'و','v':'و','w':'و','x':'کس','y':'ی','z':'ز'
      };
      if (lower3 === 'sch') { out.push('ش'); i += 3; continue; }
      if (map2[lower2]) { out.push(map2[lower2]); i += 2; continue; }
      const ch = s[i];
      const lower1 = ch.toLowerCase();
      if (map1[lower1]) { out.push(map1[lower1]); i += 1; continue; }
      out.push(ch);
      i += 1;
    }
    return out.join('');
  }

  async function translateUrduToSpanish(text) {
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ur|es`);
      if (res.ok) {
        const data = await res.json();
        const t = data?.responseData?.translatedText;
        if (t && typeof t === 'string') return t;
      }
    } catch {}
    try {
      const res2 = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: 'ur', target: 'es', format: 'text' })
      });
      if (res2.ok) {
        const data2 = await res2.json();
        const t2 = data2?.translatedText;
        if (t2 && typeof t2 === 'string') return t2;
      }
    } catch {}
    throw new Error('No fue posible traducir');
  }

  async function translateSpanishToUrdu(text) {
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=es|ur`);
      if (res.ok) {
        const data = await res.json();
        const t = data?.responseData?.translatedText;
        if (t && typeof t === 'string') return t;
      }
    } catch {}
    try {
      const res2 = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: 'es', target: 'ur', format: 'text' })
      });
      if (res2.ok) {
        const data2 = await res2.json();
        const t2 = data2?.translatedText;
        if (t2 && typeof t2 === 'string') return t2;
      }
    } catch {}
    throw new Error('No fue posible traducir es→ur');
  }

  // Inicialización
  buildKeyboard();
  statusEl.textContent = 'Escribe en urdú para ver la traducción…';
  urduInput.addEventListener('input', () => {
    if (!isUrduToSpanish()) return;
    if (translitToggle.checked) {
      const t = transliterateLatinToUrdu(urduInput.value);
      if (t !== urduInput.value) {
        urduInput.value = t;
        const caret = t.length;
        urduInput.setSelectionRange(caret, caret);
      }
    }
    scheduleTranslate();
  });

  spanishOutput.addEventListener('input', () => {
    if (isUrduToSpanish()) return;
    scheduleTranslate();
  });

  function applyDirectionUI() {
    const labelUrdu = document.querySelector('label[for="urduInput"]');
    const labelEs = document.querySelector('label[for="spanishOutput"]');
    const translitLabel = translitToggle?.closest('.toggle');
    const urToEs = isUrduToSpanish();

    if (urToEs) {
      urduInput.readOnly = false;
      spanishOutput.readOnly = true;
      if (labelUrdu) labelUrdu.textContent = 'Texto en urdú';
      if (labelEs) labelEs.textContent = 'Traducción al español';
      statusEl.textContent = 'Escribe en urdú para ver la traducción…';
      urduInput.placeholder = 'ٹیکسٹ یہاں لکھیں (Escribe aquí en urdú)';
      spanishOutput.placeholder = 'La traducción aparecerá aquí';
    } else {
      urduInput.readOnly = true;
      spanishOutput.readOnly = false;
      if (labelUrdu) labelUrdu.textContent = 'Traducción al urdú';
      if (labelEs) labelEs.textContent = 'Texto en español';
      statusEl.textContent = 'Escribe en español para ver la traducción…';
      urduInput.placeholder = 'La traducción aparecerá aquí';
      spanishOutput.placeholder = 'Escribe aquí en español';
    }

    // Mostrar/ocultar teclado virtual y control de transliteración según dirección
    keyboardEl.classList.toggle('hidden', !urToEs);
    if (translitLabel) translitLabel.classList.toggle('hidden', !urToEs);
    if (translitToggle) translitToggle.disabled = !urToEs;

    // Sincronizar idioma del micrófono con la dirección elegida
    if (micLangSel) {
      micLangSel.value = urToEs ? 'ur-PK' : 'es-ES';
    }
  }

  applyDirectionUI();
  directionSel.addEventListener('change', () => {
    applyDirectionUI();
    scheduleTranslate();
  });

  // Síntesis de voz (TTS)
  const synth = window.speechSynthesis;
  let ttsSupported = !!synth;
  let ttsSpeaking = false;
  let ttsVoices = [];

  function loadVoices() {
    if (!synth) return;
    ttsVoices = synth.getVoices();
  }
  if (synth) {
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  } else {
    statusEl.textContent = 'La reproducción de voz no está soportada.';
    if (speakBtn) speakBtn.disabled = true;
    if (speakStopBtn) speakStopBtn.disabled = true;
  }

  function pickVoice(preferredLang) {
    if (!ttsVoices || ttsVoices.length === 0) return null;
    const lang = preferredLang.toLowerCase();
    const primary = ttsVoices.find(v => v.lang && v.lang.toLowerCase().startsWith(lang));
    if (primary) return primary;
    const fallbacks = lang.startsWith('ur') ? ['ar', 'fa', 'hi', 'bn'] : ['es', 'pt'];
    for (const fb of fallbacks) {
      const v = ttsVoices.find(vv => vv.lang && vv.lang.toLowerCase().startsWith(fb));
      if (v) return v;
    }
    return ttsVoices[0];
  }

  function speakText(text, preferredLang) {
    if (!ttsSupported || !text) {
      statusEl.textContent = !text ? 'No hay texto para reproducir.' : 'La voz no está soportada en este navegador.';
      return;
    }
    try {
      if (synth.speaking) synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(preferredLang);
      if (voice) {
        utter.voice = voice;
        utter.lang = voice.lang;
      } else {
        utter.lang = preferredLang;
      }
      utter.rate = preferredLang.startsWith('es') ? 1.0 : 0.95;
      utter.onstart = () => {
        ttsSpeaking = true;
        if (speakBtn) speakBtn.disabled = true;
        if (speakStopBtn) speakStopBtn.disabled = false;
        statusEl.textContent = 'Reproduciendo…';
      };
      utter.onend = () => {
        ttsSpeaking = false;
        if (speakBtn) speakBtn.disabled = false;
        if (speakStopBtn) speakStopBtn.disabled = true;
        statusEl.textContent = 'Reproducción finalizada';
        setTimeout(() => { if (statusEl.textContent.startsWith('Reproducción')) statusEl.textContent = ''; }, 1200);
      };
      utter.onerror = () => {
        ttsSpeaking = false;
        if (speakBtn) speakBtn.disabled = false;
        if (speakStopBtn) speakStopBtn.disabled = true;
        statusEl.textContent = 'Error de voz (TTS).';
      };
      synth.speak(utter);
    } catch (e) {
      console.error(e);
      statusEl.textContent = 'No se pudo reproducir voz.';
    }
  }

  function startSpeak() {
    const outText = isUrduToSpanish() ? spanishOutput.value.trim() : urduInput.value.trim();
    const prefLang = isUrduToSpanish() ? 'es' : 'ur';
    speakText(outText, prefLang);
  }

  function stopSpeak() {
    try {
      if (!ttsSupported) return;
      synth.cancel();
      ttsSpeaking = false;
      if (speakBtn) speakBtn.disabled = false;
      if (speakStopBtn) speakStopBtn.disabled = true;
      statusEl.textContent = 'Reproducción detenida';
    } catch (e) {
      console.error(e);
    }
  }

  if (speakBtn) speakBtn.addEventListener('click', startSpeak);
  if (speakStopBtn) speakStopBtn.addEventListener('click', stopSpeak);

  // Reconocimiento de voz (micrófono)
  let recognition = null;
  let recogAvailable = false;
  let isRecognizing = false;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SR) {
    recognition = new SR();
    recogAvailable = true;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.lang = micLangSel?.value || 'ur-PK';
  } else {
    micStatus.textContent = 'El reconocimiento de voz no está soportado en este navegador.';
    if (micStartBtn) micStartBtn.disabled = true;
  }

  function startMic() {
    if (!recogAvailable || !recognition || isRecognizing) return;
    try {
      recognition.lang = micLangSel.value;
      recognition.start();
    } catch (e) {
      console.error(e);
      micStatus.textContent = 'No se pudo iniciar el micrófono.';
    }
  }

  function stopMic() {
    if (!recogAvailable || !recognition || !isRecognizing) return;
    try {
      recognition.stop();
    } catch (e) {
      console.error(e);
      micStatus.textContent = 'No se pudo detener el micrófono.';
    }
  }

  if (recogAvailable) {
    micStartBtn.addEventListener('click', startMic);
    micStopBtn.addEventListener('click', stopMic);
    micLangSel.addEventListener('change', () => {
      if (isRecognizing) {
        stopMic();
        setTimeout(startMic, 150);
      }
    });

    recognition.onstart = () => {
      isRecognizing = true;
      micStatus.textContent = 'Escuchando…';
      micStartBtn.disabled = true;
      micStopBtn.disabled = false;
    };

    recognition.onend = () => {
      isRecognizing = false;
      micStatus.textContent = 'Micrófono detenido';
      micStartBtn.disabled = false;
      micStopBtn.disabled = true;
    };

    recognition.onerror = (ev) => {
      console.error('Speech error:', ev);
      micStatus.textContent = ev?.error === 'not-allowed' ? 'Permiso denegado para micrófono.' : 'Error en reconocimiento de voz.';
      micStartBtn.disabled = false;
      micStopBtn.disabled = true;
    };

    recognition.onresult = async (ev) => {
      let interim = '';
      let finalText = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const res = ev.results[i];
        if (res.isFinal) finalText += res[0].transcript + ' ';
        else interim += res[0].transcript + ' ';
      }
      if (interim) {
        micStatus.textContent = `Intermedio: ${interim}`;
      } else {
        micStatus.textContent = 'Procesando…';
      }
      if (finalText) {
        const lang = micLangSel.value;
        const clean = finalText.trim();
        if (lang.startsWith('ur')) {
          const start = urduInput.value.length;
          urduInput.value = (urduInput.value ? urduInput.value + ' ' : '') + clean;
          const caret = urduInput.value.length;
          urduInput.setSelectionRange(caret, caret);
          if (micBothToggle?.checked) {
            const full = urduInput.value.trim();
            try {
              const translated = await translateUrduToSpanish(full);
              spanishOutput.value = translated || spanishOutput.value;
              statusEl.textContent = translated ? 'Traducción lista' : 'Sin resultado';
            } catch (e) {
              console.error(e);
              statusEl.textContent = 'Error al traducir (micrófono)';
            }
          } else {
            if (isUrduToSpanish()) scheduleTranslate();
          }
        } else {
          spanishOutput.value = (spanishOutput.value ? spanishOutput.value + ' ' : '') + clean;
          if (micBothToggle?.checked) {
            if (micAutoEs2UrToggle?.checked) {
              try {
                const urdu = await translateSpanishToUrdu(clean);
                const ins = urdu || clean;
                urduInput.value = (urduInput.value ? urduInput.value + ' ' : '') + ins;
                const caret2 = urduInput.value.length;
                urduInput.setSelectionRange(caret2, caret2);
              } catch (e) {
                console.error(e);
                urduInput.value = (urduInput.value ? urduInput.value + ' ' : '') + clean;
                const caret2 = urduInput.value.length;
                urduInput.setSelectionRange(caret2, caret2);
              }
            } else {
              urduInput.value = (urduInput.value ? urduInput.value + ' ' : '') + clean;
              const caret2 = urduInput.value.length;
              urduInput.setSelectionRange(caret2, caret2);
            }
          } else {
            if (!isUrduToSpanish()) scheduleTranslate();
          }
        }
        micStatus.textContent = 'Transcripción añadida';
      }
    };
  }
})();