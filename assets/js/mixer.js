document.addEventListener('DOMContentLoaded', () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (!audioContext) {
        alert("Web Audio API no es compatible en este navegador. Por favor, usa Chrome o Firefox.");
        return;
    }

    // --- NODOS GLOBALES ---
    const masterGain = audioContext.createGain();
    const headphoneGain = audioContext.createGain();
    const masterAnalyser = audioContext.createAnalyser();
    masterAnalyser.fftSize = 256;
    masterGain.connect(masterAnalyser);
    masterAnalyser.connect(audioContext.destination);
    // Headphone out no se conecta a destination

    const decks = {
        a: createDeck('a'),
        b: createDeck('b')
    };

    // --- CREACIÓN DE DECK ---
    function createDeck(id) {
        const deck = {
            id: id,
            audioBuffer: null,
            source: null,
            bpm: 0,
            hotCues: new Array(8).fill(null),
            loopStart: null,
            loopEnd: null,
            isLooping: false,
            key: '',
            gainNode: audioContext.createGain(),
            crossfadeGain: audioContext.createGain(),
            analyserNode: audioContext.createAnalyser(),
            eq: {
                low: createBiquadFilter('lowshelf', 250),
                mid: createBiquadFilter('peaking', 1000, 0.5),
                high: createBiquadFilter('highshelf', 4000),
            },
            isPlaying: false,
            playbackRate: 1,
            startTime: 0,
            startOffset: 0,
            isScratching: false,
            lastPlatterAngle: 0,
            // Elementos UI
            platter: document.getElementById(`platter-${id}`),
            playBtn: document.getElementById(`play-${id}`),
            cueBtn: document.getElementById(`cue-${id}`),
            syncBtn: document.getElementById(`sync-${id}`),
            trackInfo: document.getElementById(`track-info-${id}`),
            waveformCanvas: document.getElementById(`waveform-${id}`),
            vuMeterCanvas: document.getElementById(`vu-meter-${id}`),
            hotCueContainer: document.getElementById(`hot-cues-${id}`),
            pitchSlider: document.getElementById(`pitch-${id}`),
            headphoneCueBtn: document.getElementById(`headphone-cue-${id}`),
        };
        deck.analyserNode.fftSize = 256;

        // Cadena de audio: source -> gain -> EQ -> analyser -> crossfade
        deck.gainNode.connect(deck.eq.low);
        deck.eq.low.connect(deck.eq.mid);
        deck.eq.mid.connect(deck.eq.high);
        deck.eq.high.connect(deck.analyserNode);
        deck.analyserNode.connect(deck.crossfadeGain);
        deck.crossfadeGain.connect(masterGain);
        deck.crossfadeGain.connect(headphoneGain);

        setupEventListeners(deck);
        return deck;
    }

    function createBiquadFilter(type, freq, q = 1) {
        const filter = audioContext.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = freq;
        filter.gain.value = 0;
        filter.Q.value = q;
        return filter;
    }

    // --- EVENT LISTENERS ---
    function setupEventListeners(deck) {
        deck.playBtn.addEventListener('click', () => togglePlay(deck));
        deck.cueBtn.addEventListener('click', () => cue(deck));
        deck.syncBtn.addEventListener('click', () => sync(deck));
        deck.headphoneCueBtn.addEventListener('click', () => toggleHeadphoneCue(deck));

        // Loop controls
        document.getElementById(`loop-in-${deck.id}`).addEventListener('click', () => setLoop(deck, 'in'));
        document.getElementById(`loop-out-${deck.id}`).addEventListener('click', () => setLoop(deck, 'out'));
        document.getElementById(`loop-toggle-${deck.id}`).addEventListener('click', () => toggleLoop(deck));
        document.getElementById(`loop-half-${deck.id}`).addEventListener('click', () => modifyLoop(deck, 0.5));
        document.getElementById(`loop-double-${deck.id}`).addEventListener('click', () => modifyLoop(deck, 2));


        // Controles de volumen y EQ
        document.getElementById(`volume-${deck.id}`).addEventListener('input', e => deck.gainNode.gain.setTargetAtTime(e.target.value, audioContext.currentTime, 0.01));
        document.getElementById(`hi-${deck.id}`).addEventListener('input', e => deck.eq.high.gain.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01));
        document.getElementById(`mid-${deck.id}`).addEventListener('input', e => deck.eq.mid.gain.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01));
        document.getElementById(`low-${deck.id}`).addEventListener('input', e => deck.eq.low.gain.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01));

        // Pitch
        deck.pitchSlider.addEventListener('input', e => {
            deck.playbackRate = 1 + parseFloat(e.target.value);
            updatePlaybackRate(deck);
        });

        // Platter Scratching
        deck.platter.addEventListener('mousedown', () => deck.isScratching = true);
        window.addEventListener('mouseup', () => deck.isScratching = false);
        deck.platter.addEventListener('mousemove', e => handleScratch(e, deck));

        // Generar y configurar Hot Cue Pads
        for (let i = 0; i < 8; i++) {
            const pad = document.createElement('button');
            pad.className = 'hot-cue-pad';
            pad.textContent = `CUE ${i + 1}`;
            pad.dataset.index = i;
            pad.addEventListener('click', (e) => handleHotCue(e, deck));
            deck.hotCueContainer.appendChild(pad);
        }
    }

    // --- CARGA Y ANÁLISIS DE PISTAS ---
    async function loadTrack(file, deck) {
        if (deck.source) deck.source.stop();
        deck.trackInfo.textContent = `ANALYSING: ${file.name}`;
        deck.playBtn.classList.remove('active');

        const arrayBuffer = await file.arrayBuffer();
        deck.audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // Análisis de BPM
        analyzeBPM(deck.audioBuffer).then(bpm => {
            deck.bpm = bpm;
            updateTrackInfo(deck);
        });

        deck.trackInfo.textContent = file.name.replace(/\.[^/.]+$/, "");
        deck.startOffset = 0;
        deck.pitchSlider.value = 0;
        deck.playbackRate = 1;
        deck.hotCues.fill(null);
        updateHotCueUI(deck);
        drawWaveform(deck);
    }

    // Variable global para la tecla Shift
    let shiftPressed = false;
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') shiftPressed = true;
    });
    window.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') shiftPressed = false;
    });

    function updateTrackInfo(deck) {
        const name = deck.trackInfo.textContent.split(' | ')[0];
        deck.trackInfo.textContent = `${name} | ${deck.bpm.toFixed(2)} BPM`;
    }

    // --- CONTROLES DE REPRODUCCIÓN ---
    function togglePlay(deck) {
        if (deck.isPlaying) pause(deck);
        else play(deck);
    }

    function play(deck) {
        if (!deck.audioBuffer || deck.isPlaying) return;
        audioContext.resume();

        deck.source = audioContext.createBufferSource();
        deck.source.buffer = deck.audioBuffer;
        deck.source.connect(deck.gainNode);
        updatePlaybackRate(deck);

        // Loop logic
        if (deck.isLooping && deck.loopStart !== null && deck.loopEnd !== null) {
            deck.source.loop = true;
            deck.source.loopStart = deck.loopStart;
            deck.source.loopEnd = deck.loopEnd;
        }

        deck.startTime = audioContext.currentTime - deck.startOffset;
        deck.source.start(0, deck.startOffset % deck.audioBuffer.duration);
        deck.isPlaying = true;
        deck.playBtn.classList.add('active');
        deck.platter.classList.add('playing');

        deck.source.onended = () => {
            if (deck.isPlaying && !deck.isScratching) {
                pause(deck);
                deck.startOffset = 0;
            }
        };
        requestAnimationFrame(() => updateVisuals(deck));
    }

    function pause(deck) {
        if (!deck.isPlaying || !deck.source) return;
        deck.startOffset = audioContext.currentTime - deck.startTime;
        deck.source.stop();
        deck.source = null;
        deck.isPlaying = false;
        deck.playBtn.classList.remove('active');
        deck.platter.classList.remove('playing');
    }

    function cue(deck) {
        if (deck.isPlaying) pause(deck);
        deck.startOffset = 0;
        drawWaveform(deck);
    }

    function updatePlaybackRate(deck) {
        if (deck.source) {
            deck.source.playbackRate.setTargetAtTime(deck.playbackRate, audioContext.currentTime, 0.01);
        }
    }

    function sync(deck) {
        const otherDeckId = deck.id === 'a' ? 'b' : 'a';
        const otherDeck = decks[otherDeckId];
        if (!otherDeck.bpm || !deck.bpm) return;

        const rate = otherDeck.bpm / deck.bpm;
        deck.playbackRate = rate;
        deck.pitchSlider.value = rate - 1;
        updatePlaybackRate(deck);
        deck.syncBtn.classList.add('active');
        setTimeout(() => deck.syncBtn.classList.remove('active'), 1000);
    }

    function handleScratch(event, deck) {
        if (!deck.isScratching || !deck.isPlaying || !deck.source) return;

        const platterRect = deck.platter.getBoundingClientRect();
        const centerX = platterRect.left + platterRect.width / 2;
        const centerY = platterRect.top + platterRect.height / 2;
        const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX);

        if (deck.lastPlatterAngle !== 0) {
            const delta = angle - deck.lastPlatterAngle;
            const scratchAmount = delta / (Math.PI * 2) * 2; // Sensibilidad
            deck.startOffset += scratchAmount;
            
            // Reiniciar el source para aplicar el nuevo offset
            deck.source.stop();
            play(deck);
        }
        deck.lastPlatterAngle = angle;
        
        // Reset angle when mouse leaves platter
        deck.platter.onmouseleave = () => {
            deck.isScratching = false;
            deck.lastPlatterAngle = 0;
        };
    }

    // --- LÓGICA DE HOT CUES Y LOOPS ---
    function handleHotCue(event, deck) {
        if (!deck.audioBuffer) return;
        const index = parseInt(event.target.dataset.index);
        const currentTime = (audioContext.currentTime - deck.startTime) * deck.playbackRate;

        if (shiftPressed) {
            // Borrar Hot Cue
            deck.hotCues[index] = null;
            event.target.classList.remove('set');
        } else {
            if (deck.hotCues[index] !== null) {
                // Saltar al Hot Cue
                deck.startOffset = deck.hotCues[index];
                if (deck.isPlaying) {
                    deck.source.stop();
                    play(deck);
                } else {
                    drawWaveform(deck, deck.startOffset / deck.audioBuffer.duration);
                }
            } else {
                // Establecer Hot Cue
                deck.hotCues[index] = deck.isPlaying ? currentTime : deck.startOffset;
                event.target.classList.add('set');
            }
        }
    }

    function updateHotCueUI(deck) {
        const pads = deck.hotCueContainer.querySelectorAll('.hot-cue-pad');
        pads.forEach((pad, i) => {
            if (deck.hotCues[i] !== null) {
                pad.classList.add('set');
            } else {
                pad.classList.remove('set');
            }
        });
    }

    function setLoop(deck, type) {
        if (!deck.isPlaying) return;
        const currentTime = (audioContext.currentTime - deck.startTime) * deck.playbackRate;
        if (type === 'in') {
            deck.loopStart = currentTime;
        } else if (type === 'out') {
            deck.loopEnd = currentTime;
            if (deck.loopStart !== null && deck.loopEnd > deck.loopStart) {
                toggleLoop(deck, true); // Activar loop automáticamente
            }
        }
    }

    function toggleLoop(deck, forceActive = null) {
        if (deck.loopStart === null || deck.loopEnd === null) return;

        deck.isLooping = forceActive !== null ? forceActive : !deck.isLooping;
        document.getElementById(`loop-toggle-${deck.id}`).classList.toggle('active', deck.isLooping);

        if (deck.isPlaying) {
            deck.source.stop();
            play(deck); // Reinicia la reproducción con la nueva configuración de loop
        }
    }

    function modifyLoop(deck, factor) {
        if (!deck.isLooping || deck.loopStart === null || deck.loopEnd === null) return;
        const loopDuration = deck.loopEnd - deck.loopStart;
        deck.loopEnd = deck.loopStart + loopDuration * factor;
        if (deck.isPlaying) {
            deck.source.stop();
            play(deck);
        }
    }

    // --- VISUALIZACIÓN ---
    function drawWaveform(deck, playheadPosition = 0) {
        if (!deck.audioBuffer) return;
        const canvas = deck.waveformCanvas;
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const data = deck.audioBuffer.getChannelData(0);
        const step = Math.ceil(data.length / width);
        const amp = height / 2;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = deck.id === 'a' ? '#00A9FF' : '#FF4500';

        // Dibuja la onda
        for (let i = 0; i < width; i++) {
            let min = 1.0;
            let max = -1.0;
            for (let j = 0; j < step; j++) {
                const datum = data[(i * step) + j];
                if (datum < min) min = datum;
                if (datum > max) max = datum;
            }
            const rectHeight = Math.max(1, (max - min) * amp);
            ctx.fillRect(i, (1 - max) * amp, 1, rectHeight);
        }

        // Dibuja el cabezal de reproducción
        if (playheadPosition > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(playheadPosition * width, 0, 2, height);
        }
    }

    function updateVisuals(deck) {
        if (deck.audioBuffer) {
            // Actualizar playhead
            const elapsedTime = deck.isPlaying ? audioContext.currentTime - deck.startTime : deck.startOffset;
            const progress = elapsedTime / deck.audioBuffer.duration;
            drawWaveform(deck, progress);

            // Actualizar VU meter
            drawVuMeter(deck.analyserNode, deck.vuMeterCanvas);
        }
        if (deck.isPlaying) {
            requestAnimationFrame(() => updateVisuals(deck));
        }
    }

    function drawVuMeter(analyser, canvas) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        let sumSquares = 0.0;
        for (const amplitude of dataArray) {
            const value = (amplitude - 128) / 128;
            sumSquares += value * value;
        }
        const rms = Math.sqrt(sumSquares / bufferLength);

        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        ctx.clearRect(0, 0, width, height);

        const meterHeight = rms * height;
        const gradient = ctx.createLinearGradient(0, height, 0, 0);
        gradient.addColorStop(0, '#0f0');
        gradient.addColorStop(0.8, '#ff0');
        gradient.addColorStop(1, '#f00');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - meterHeight, width, meterHeight);
    }

    function drawSpectrum() {
        const canvas = document.getElementById('spectrum-canvas');
        const ctx = canvas.getContext('2d');
        const { width, height } = canvas;
        const bufferLength = masterAnalyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        masterAnalyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 2.5;
        let x = 0;
        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i] / 2;
            ctx.fillStyle = `rgb(50, ${barHeight + 100}, 200)`;
            ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
        requestAnimationFrame(drawSpectrum);
    }

    // --- LÓGICA DE BPM ---
    async function analyzeBPM(audioBuffer) {
        // Implementación simplificada de detección de picos
        const data = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        const peaks = [];
        const threshold = 0.8;

        for (let i = 0; i < data.length; i++) {
            if (data[i] > threshold) {
                peaks.push(i);
                i += Math.floor(sampleRate * 0.3); // Evitar picos muy cercanos
            }
        }

        if (peaks.length < 2) return 120; // Default

        const intervals = [];
        for (let i = 1; i < peaks.length; i++) {
            intervals.push(peaks[i] - peaks[i - 1]);
        }

        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const bpm = (60 * sampleRate) / avgInterval;
        return bpm > 180 ? bpm / 2 : bpm; // Ajustar rango
    }

    // --- LÓGICA DE BIBLIOTECA ---
    const openLibraryBtn = document.getElementById('open-library-btn');
    const trackList = document.getElementById('track-list');
    const searchInput = document.getElementById('search-library');
    let musicLibrary = [];

    if ('showDirectoryPicker' in window) {
        openLibraryBtn.addEventListener('click', async () => {
            const dirHandle = await window.showDirectoryPicker();
            trackList.innerHTML = '<li>Cargando biblioteca...</li>';
            musicLibrary = [];
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file' && (entry.name.endsWith('.mp3') || entry.name.endsWith('.wav'))) {
                    musicLibrary.push(entry);
                }
            }
            renderLibrary();
        });
    } else {
        openLibraryBtn.textContent = "Carregar Arxiu";
        openLibraryBtn.addEventListener('click', () => {
            // Fallback para navegadores sin File System Access API
            document.getElementById('file-a').click();
        });
        document.getElementById('file-a').addEventListener('change', async e => {
            const file = e.target.files[0];
            if(file) await loadTrack(await file.getFile(), decks.a);
        });
    }

    function renderLibrary(filter = '') {
        trackList.innerHTML = '';
        const filteredLibrary = musicLibrary.filter(f => f.name.toLowerCase().includes(filter.toLowerCase()));

        if (filteredLibrary.length === 0) {
            trackList.innerHTML = '<li>No s\'han trobat pistes.</li>';
            return;
        }

        filteredLibrary.forEach(fileHandle => {
            const li = document.createElement('li');
            li.textContent = fileHandle.name.replace(/\.[^/.]+$/, "");
            
            const loadButtons = document.createElement('div');
            loadButtons.className = 'load-buttons';
            
            const loadA = document.createElement('button');
            loadA.textContent = 'A';
            loadA.onclick = async () => loadTrack(await fileHandle.getFile(), decks.a);
            
            const loadB = document.createElement('button');
            loadB.textContent = 'B';
            loadB.onclick = async () => loadTrack(await fileHandle.getFile(), decks.b);

            loadButtons.append(loadA, loadB);
            li.appendChild(loadButtons);
            trackList.appendChild(li);
        });
    }

    searchInput.addEventListener('input', () => renderLibrary(searchInput.value));

    // --- CONTROLES MASTER Y CROSSFADER ---
    function toggleHeadphoneCue(deck) {
        deck.headphoneCueBtn.classList.toggle('active');
        // Lógica de enrutamiento de audio para CUE (simplificada)
        if (deck.headphoneCueBtn.classList.contains('active')) {
            deck.gainNode.connect(headphoneGain);
        } else {
            try { deck.gainNode.disconnect(headphoneGain); } catch(e) {}
        }
    }

    document.getElementById('crossfader').addEventListener('input', e => {
        const value = parseFloat(e.target.value);
        const gainA = Math.cos(value * 0.5 * Math.PI);
        const gainB = Math.cos((1.0 - value) * 0.5 * Math.PI);
        decks.a.crossfadeGain.gain.setTargetAtTime(gainA, audioContext.currentTime, 0.01);
        decks.b.crossfadeGain.gain.setTargetAtTime(gainB, audioContext.currentTime, 0.01);
    });

    document.getElementById('master-volume').addEventListener('input', e => {
        masterGain.gain.setTargetAtTime(parseFloat(e.target.value), audioContext.currentTime, 0.01);
    });

    // --- INICIALIZACIÓN ---
    drawSpectrum();
    // Disparar eventos iniciales para establecer valores
    document.getElementById('crossfader').dispatchEvent(new Event('input'));
    document.getElementById('master-volume').dispatchEvent(new Event('input'));
});