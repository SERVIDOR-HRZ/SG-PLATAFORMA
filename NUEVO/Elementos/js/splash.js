
        (function () {
            // === DATA STREAM PARTICLES ===
            const pc = document.getElementById('splashParticles');
            if (pc) {
                for (let i = 0; i < 25; i++) {
                    const p = document.createElement('div');
                    p.className = 'splash-particle';
                    p.style.left = (15 + Math.random() * 70) + '%';
                    p.style.animationDelay = (Math.random() * 2.5) + 's';
                    p.style.animationDuration = (1.5 + Math.random() * 2) + 's';
                    p.style.height = (30 + Math.random() * 60) + 'px';
                    p.style.opacity = (0.1 + Math.random() * 0.3);
                    pc.appendChild(p);
                }
            }

            // === SPARK CANVAS ===
            const logoContainer = document.querySelector('.splash-logo-container');
            const sparkCanvas = document.createElement('canvas');
            sparkCanvas.className = 'spark-canvas';
            if (logoContainer) logoContainer.appendChild(sparkCanvas);
            const ctx = sparkCanvas.getContext('2d');
            let sparks = [];
            let sparkRunning = true;

            function resizeCanvas() {
                if (!logoContainer) return;
                const r = logoContainer.getBoundingClientRect();
                sparkCanvas.width = r.width;
                sparkCanvas.height = r.height;
            }
            resizeCanvas();
            window.addEventListener('resize', resizeCanvas);

            function addSparks(x, y, count) {
                for (let i = 0; i < count; i++) {
                    sparks.push({
                        x, y,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        life: 0.5 + Math.random() * 0.5,
                        maxLife: 0.5 + Math.random() * 0.5,
                        size: 1 + Math.random() * 2,
                        color: ['#fff', '#ff6600', '#ff2200', '#dc2626', '#0ff'][Math.floor(Math.random() * 5)]
                    });
                }
            }

            function updateSparks(dt) {
                ctx.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
                sparks = sparks.filter(s => {
                    s.life -= dt;
                    if (s.life <= 0) return false;
                    s.x += s.vx;
                    s.y += s.vy;
                    s.vy += 0.3; // gravity
                    const alpha = s.life / s.maxLife;
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = s.color;
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = s.color;
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, s.size * alpha, 0, Math.PI * 2);
                    ctx.fill();
                    return true;
                });
                ctx.globalAlpha = 1;
                ctx.shadowBlur = 0;
                if (sparkRunning) requestAnimationFrame(() => updateSparks(0.016));
            }
            updateSparks(0.016);

            // === MOTION GRAPHICS ANIMATION ENGINE ===
            const svgEl = document.getElementById('logoSVG');
            const paths = document.querySelectorAll('#logoSVG path');
            const pathCount = paths.length;

            // Measure all paths
            paths.forEach((path, i) => {
                const length = path.getTotalLength();
                path.style.setProperty('--path-length', length);
                // Random scatter direction for deconstruction
                const angle = (i / pathCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.8;
                const dist = 15 + Math.random() * 25;
                path.style.setProperty('--scatter-x', (Math.cos(angle) * dist) + 'px');
                path.style.setProperty('--scatter-y', (Math.sin(angle) * dist) + 'px');
                // Staggered alive delay
                path.style.setProperty('--alive-delay', (i * 0.12) + 's');
            });

            // Timing constants (~2.5s, construction-focused)
            const T = {
                ENTER: 50,
                TRACE_START: 100,
                TRACE_STAGGER: 50,
                TRACE_DURATION: 1600,
                MICRO_GLITCH_1: 9999,
                MICRO_GLITCH_2: 9999,
                TEXT_START: 900,
                DECONSTRUCT: 1900,
                RECONSTRUCT: 2050,
                SETTLE: 2200,
                ALIVE: 2300,
                DISMISS: 2500
            };

            // === CINEMATIC WEB AUDIO — DARK SOUND DESIGN ===
            let audioCtx = null;
            function initAudio() {
                try {
                    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                    if (audioCtx.state === 'suspended') audioCtx.resume();
                } catch (e) { }
            }

            // Sub-bass drone — deep rumble that you feel more than hear
            function playDrone(freq, dur, vol) {
                initAudio();
                if (!audioCtx || audioCtx.state === 'suspended') return;
                const t = audioCtx.currentTime;

                // Layer 1: Sub-bass fundamental
                const sub = audioCtx.createOscillator();
                sub.type = 'sine';
                sub.frequency.setValueAtTime(freq || 45, t);
                sub.frequency.linearRampToValueAtTime((freq || 45) * 0.85, t + dur);

                // Layer 2: Detuned texture (dark harmonic)
                const tex = audioCtx.createOscillator();
                tex.type = 'sine';
                tex.frequency.setValueAtTime((freq || 45) * 1.5, t);
                tex.frequency.linearRampToValueAtTime((freq || 45) * 1.2, t + dur);
                const texGain = audioCtx.createGain();
                texGain.gain.value = 0.15; // barely audible harmonic

                // Master envelope — slow attack, long tail
                const master = audioCtx.createGain();
                master.gain.setValueAtTime(0, t);
                master.gain.linearRampToValueAtTime(vol || 0.12, t + dur * 0.15);
                master.gain.setValueAtTime(vol || 0.12, t + dur * 0.5);
                master.gain.exponentialRampToValueAtTime(0.001, t + dur);

                // Low-pass to keep it sub / rumble only
                const lp = audioCtx.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.value = 180;
                lp.Q.value = 1;

                sub.connect(lp);
                tex.connect(texGain);
                texGain.connect(lp);
                lp.connect(master);
                master.connect(audioCtx.destination);

                sub.start(t); tex.start(t);
                sub.stop(t + dur); tex.stop(t + dur);
            }

            // Metallic ping — like sonar / radar in a dark corridor
            function playPing(freq, dur) {
                initAudio();
                if (!audioCtx || audioCtx.state === 'suspended') return;
                const t = audioCtx.currentTime;

                const osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq || 1200, t);

                // Resonant filter gives metallic ring
                const bp = audioCtx.createBiquadFilter();
                bp.type = 'bandpass';
                bp.frequency.value = freq || 1200;
                bp.Q.value = 30; // very resonant = metallic

                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.06, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + (dur || 0.6));

                osc.connect(bp);
                bp.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start(t);
                osc.stop(t + (dur || 0.6));
            }

            // Seismic impact — BRAAAM (Inception-style bass hit)
            function playImpact() {
                initAudio();
                if (!audioCtx || audioCtx.state === 'suspended') return;
                const t = audioCtx.currentTime;

                // Layer 1: Sub hit — 35Hz sine, instant attack
                const sub = audioCtx.createOscillator();
                sub.type = 'sine';
                sub.frequency.setValueAtTime(35, t);
                sub.frequency.exponentialRampToValueAtTime(18, t + 1.5);

                const subGain = audioCtx.createGain();
                subGain.gain.setValueAtTime(0.25, t);
                subGain.gain.setValueAtTime(0.25, t + 0.1);
                subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

                // Layer 2: Filtered noise burst for "crack" texture
                const noiseBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.3, audioCtx.sampleRate);
                const noiseData = noiseBuf.getChannelData(0);
                for (let i = 0; i < noiseData.length; i++) {
                    noiseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - (i / noiseData.length), 6);
                }
                const noise = audioCtx.createBufferSource();
                noise.buffer = noiseBuf;

                const noiseLp = audioCtx.createBiquadFilter();
                noiseLp.type = 'lowpass';
                noiseLp.frequency.setValueAtTime(600, t);
                noiseLp.frequency.exponentialRampToValueAtTime(80, t + 0.3);

                const noiseGain = audioCtx.createGain();
                noiseGain.gain.setValueAtTime(0.15, t);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

                // Layer 3: Very low distorted rumble tail
                const rumble = audioCtx.createOscillator();
                rumble.type = 'sawtooth';
                rumble.frequency.setValueAtTime(28, t);

                const rumbleLp = audioCtx.createBiquadFilter();
                rumbleLp.type = 'lowpass';
                rumbleLp.frequency.value = 60;

                const rumbleGain = audioCtx.createGain();
                rumbleGain.gain.setValueAtTime(0, t);
                rumbleGain.gain.linearRampToValueAtTime(0.08, t + 0.05);
                rumbleGain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

                sub.connect(subGain);
                subGain.connect(audioCtx.destination);

                noise.connect(noiseLp);
                noiseLp.connect(noiseGain);
                noiseGain.connect(audioCtx.destination);

                rumble.connect(rumbleLp);
                rumbleLp.connect(rumbleGain);
                rumbleGain.connect(audioCtx.destination);

                sub.start(t); noise.start(t); rumble.start(t);
                sub.stop(t + 1.5); rumble.stop(t + 2.0);
            }

            // Digital artifact — short filtered noise burst (like a data corruption)
            function playDigitalArtifact() {
                initAudio();
                if (!audioCtx || audioCtx.state === 'suspended') return;
                const t = audioCtx.currentTime;
                const dur = 0.08 + Math.random() * 0.06;

                const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
                const data = buf.getChannelData(0);
                // Granular noise pattern
                let hold = 0, holdCount = 0;
                for (let i = 0; i < data.length; i++) {
                    if (holdCount <= 0) {
                        hold = (Math.random() * 2 - 1);
                        holdCount = 2 + Math.floor(Math.random() * 8); // sample-and-hold
                    }
                    data[i] = hold * 0.3;
                    holdCount--;
                }

                const src = audioCtx.createBufferSource();
                src.buffer = buf;

                const hp = audioCtx.createBiquadFilter();
                hp.type = 'highpass';
                hp.frequency.value = 2000 + Math.random() * 4000;
                hp.Q.value = 1;

                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.04, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

                src.connect(hp);
                hp.connect(gain);
                gain.connect(audioCtx.destination);
                src.start(t);
            }

            // Resolve tone — clean, warm sine fade-in (like a system powering up)
            function playResolve() {
                initAudio();
                if (!audioCtx || audioCtx.state === 'suspended') return;
                const t = audioCtx.currentTime;

                // Pure sine, low frequency, slow swell
                const osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(110, t); // A2
                osc.frequency.linearRampToValueAtTime(220, t + 1.0); // rise to A3

                // Second harmonic — octave above, very quiet
                const osc2 = audioCtx.createOscillator();
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(220, t);
                osc2.frequency.linearRampToValueAtTime(440, t + 1.0);
                const osc2Gain = audioCtx.createGain();
                osc2Gain.gain.value = 0.03;

                const master = audioCtx.createGain();
                master.gain.setValueAtTime(0, t);
                master.gain.linearRampToValueAtTime(0.08, t + 0.4);
                master.gain.linearRampToValueAtTime(0.06, t + 0.8);
                master.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

                const lp = audioCtx.createBiquadFilter();
                lp.type = 'lowpass';
                lp.frequency.setValueAtTime(300, t);
                lp.frequency.linearRampToValueAtTime(800, t + 0.8);
                lp.frequency.exponentialRampToValueAtTime(200, t + 1.5);

                osc.connect(lp);
                osc2.connect(osc2Gain);
                osc2Gain.connect(lp);
                lp.connect(master);
                master.connect(audioCtx.destination);

                osc.start(t); osc2.start(t);
                osc.stop(t + 1.5); osc2.stop(t + 1.5);
            }

            // Keystroke tick — subtle, almost mechanical click
            function playKeystroke() {
                initAudio();
                if (!audioCtx || audioCtx.state === 'suspended') return;
                const t = audioCtx.currentTime;

                const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.015, audioCtx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < data.length; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 10);
                }
                const src = audioCtx.createBufferSource();
                src.buffer = buf;

                const hp = audioCtx.createBiquadFilter();
                hp.type = 'highpass';
                hp.frequency.value = 3000;

                const gain = audioCtx.createGain();
                gain.gain.value = 0.025;

                src.connect(hp);
                hp.connect(gain);
                gain.connect(audioCtx.destination);
                src.start(t);
            }

            // Init audio on any user interaction or immediately
            initAudio();
            document.addEventListener('click', () => { initAudio(); }, { once: true });
            document.addEventListener('touchstart', () => { initAudio(); }, { once: true });

            // === PHASE 1: Enter — deep drone awakens ===
            setTimeout(() => {
                if (svgEl) svgEl.classList.add('phase-enter');
                playDrone(40, 2.5, 0.10);
                playPing(1800, 0.4);
            }, T.ENTER);

            // === PHASE 2: Trace with micro-glitches ===
            const traceDurStr = (T.TRACE_DURATION / 1000) + 's';
            const crosshair = document.querySelector('.rog-hud-crosshair');
            const borderDash = document.querySelector('.border-dash');
            const solidPulse = document.querySelector('.solid-pulse');
            const slicer = document.querySelector('.rog-glitch-slicer');

            paths.forEach((path, i) => {
                path.style.setProperty('--trace-duration', traceDurStr);
                const groupDelay = T.TRACE_START + i * T.TRACE_STAGGER;

                setTimeout(() => {
                    path.classList.add('tracing');
                    if (i === 0) playPing(2400, 0.3);

                    const sparkInterval = setInterval(() => {
                        if (!sparkCanvas.width) return;
                        const cx = sparkCanvas.width / 2;
                        const cy = sparkCanvas.height / 2;
                        const rx = 30 + Math.random() * 60;
                        const ry = 20 + Math.random() * 50;
                        addSparks(
                            cx + (Math.random() - 0.5) * rx,
                            cy + (Math.random() - 0.5) * ry,
                            2
                        );
                    }, 80);
                    setTimeout(() => clearInterval(sparkInterval), T.TRACE_DURATION);
                }, groupDelay);
            });

            // Micro-glitches removed — clean construction focus
            // (glitch effects disabled to let logo trace shine)

            // === TYPEWRITER TEXT WITH GLITCH ===
            const titleEl = document.getElementById('splashTitle');
            const subEl = document.getElementById('splashSub');
            const fullText = 'SEAMOS GENIOS';
            const gradientStart = 7; // index of 'G' in GENIOS

            if (titleEl) {
                // Build character spans
                let html = '';
                for (let i = 0; i < fullText.length; i++) {
                    if (fullText[i] === ' ') {
                        html += '<span class="char-space"></span>';
                    } else {
                        const isGradient = i >= gradientStart;
                        html += isGradient
                            ? `<span class="char gradient-text" data-i="${i}">${fullText[i]}</span>`
                            : `<span class="char" data-i="${i}">${fullText[i]}</span>`;
                    }
                }
                // Add cursor
                html += '<span class="splash-text-cursor" id="typeCursor"></span>';
                titleEl.innerHTML = html;
                titleEl.classList.add('typewriting');

                const chars = titleEl.querySelectorAll('.char');
                const cursor = document.getElementById('typeCursor');
                let charIndex = 0;
                const charDelay = 70;
                const glitchChance = 0.25;

                setTimeout(() => {
                    if (cursor) cursor.classList.add('active');
                    playPing(3000, 0.2);

                    const typeInterval = setInterval(() => {
                        if (charIndex >= chars.length) {
                            clearInterval(typeInterval);
                            if (cursor) setTimeout(() => cursor.style.display = 'none', 500);
                            // Reveal subtitle after typewriter finishes
                            if (subEl) subEl.classList.add('revealed');
                            return;
                        }

                        const ch = chars[charIndex];
                        ch.classList.add('visible');

                        // Random glitch on some characters
                        if (Math.random() < glitchChance) {
                            ch.classList.add('glitch-char');
                            playDigitalArtifact();
                            setTimeout(() => ch.classList.remove('glitch-char'), 150);
                        } else {
                            playKeystroke();
                        }

                        charIndex++;
                    }, charDelay);
                }, T.TEXT_START);
            }

            // After all traced, HUD crosshair locks in
            const allTracedTime = T.TRACE_START + pathCount * T.TRACE_STAGGER + T.TRACE_DURATION;
            setTimeout(() => {
                paths.forEach(p => {
                    p.classList.remove('tracing');
                    p.classList.add('traced');
                });
                // HUD sync: crosshair locks
                if (crosshair) crosshair.classList.add('hud-lock');
                playPing(1600, 0.3);
            }, Math.min(allTracedTime, T.DECONSTRUCT - 50));

            // === PHASE 3: Deconstruct — seismic impact ===
            setTimeout(() => {
                const splashScreen = document.getElementById('splashScreen');

                // Camera shake!
                if (splashScreen) {
                    splashScreen.classList.add('camera-shake');
                    setTimeout(() => splashScreen.classList.remove('camera-shake'), 400);
                }

                // Audio: seismic hit
                playImpact();

                // Create ghost trail (clone SVG paths)
                if (svgEl && logoContainer) {
                    const ghostDiv = document.createElement('div');
                    ghostDiv.className = 'logo-ghost-trail';
                    const ghostSvg = svgEl.cloneNode(true);
                    ghostSvg.removeAttribute('id');
                    ghostSvg.removeAttribute('class');
                    ghostSvg.style.cssText = 'width:100%;height:auto;position:absolute;max-width:260px;';
                    // Change strokes to ghost style
                    ghostSvg.querySelectorAll('path').forEach(p => {
                        p.removeAttribute('class');
                        p.classList.add('ghost-path');
                        p.style.strokeDashoffset = '0';
                        p.style.opacity = '1';
                    });
                    ghostDiv.appendChild(ghostSvg);
                    logoContainer.appendChild(ghostDiv);
                    requestAnimationFrame(() => ghostDiv.classList.add('active'));
                    // Remove after animation
                    setTimeout(() => ghostDiv.remove(), 1500);
                }

                // SVG glitch
                if (svgEl) {
                    svgEl.classList.remove('phase-enter');
                    svgEl.classList.add('phase-glitch');
                }
                // Paths scatter
                paths.forEach(p => {
                    p.classList.remove('traced');
                    p.classList.add('deconstructing');
                });
                // HUD burst: rings go crazy
                if (borderDash) borderDash.classList.add('hud-burst');
                if (solidPulse) solidPulse.classList.add('hud-burst');
                if (crosshair) crosshair.classList.remove('hud-lock');

                // Big spark burst
                if (sparkCanvas.width) {
                    addSparks(sparkCanvas.width / 2, sparkCanvas.height / 2, 40);
                }
            }, T.DECONSTRUCT);

            // === PHASE 4: Reconstruct — resolve tone ===
            setTimeout(() => {
                if (svgEl) svgEl.classList.remove('phase-glitch');
                playResolve();

                paths.forEach((p, i) => {
                    p.classList.remove('deconstructing');
                    setTimeout(() => p.classList.add('reconstructing'), i * 20);
                });
                // HUD calms down
                if (borderDash) { borderDash.classList.remove('hud-burst'); borderDash.classList.add('hud-calm'); }
                if (solidPulse) { solidPulse.classList.remove('hud-burst'); solidPulse.classList.add('hud-calm'); }

                if (sparkCanvas.width) addSparks(sparkCanvas.width / 2, sparkCanvas.height / 2, 25);
            }, T.RECONSTRUCT);

            // === PHASE 5: Settle — final drone lock ===
            setTimeout(() => {
                if (svgEl) svgEl.classList.add('phase-settle');
                paths.forEach(p => {
                    p.classList.remove('reconstructing', 'traced');
                    p.classList.add('alive');
                });
                // Scanline goes to subtle repeat mode
                if (slicer) slicer.classList.add('scan-repeat');
                playDrone(55, 1.5, 0.06);
            }, T.SETTLE);

            // Start breathing
            setTimeout(() => {
                if (svgEl) {
                    svgEl.classList.remove('phase-settle');
                    svgEl.classList.add('phase-breathe');
                }
            }, T.ALIVE);

            // === LOADING PROGRESS ===
            const pctEl = document.getElementById('splashPct');
            const fillEl = document.querySelector('.splash-loading-fill');
            let pct = 0;
            const totalDuration = T.DISMISS - 200;
            const interval = 50;
            const steps = totalDuration / interval;
            let step = 0;

            const pctTimer = setInterval(() => {
                step++;
                const t = step / steps;
                const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
                pct = Math.min(Math.round(eased * 100), 100);

                if (pctEl) pctEl.textContent = pct + '%';
                if (fillEl) fillEl.style.width = pct + '%';

                if (pct >= 100) clearInterval(pctTimer);
            }, interval);

            // === DISMISS SPLASH ===
            setTimeout(() => {
                sparkRunning = false;
                const splash = document.getElementById('splashScreen');
                if (splash) splash.classList.add('splash-done');
                document.body.classList.remove('splash-active');
                setTimeout(() => { if (splash) splash.remove(); }, 600);
            }, T.DISMISS);
        })();
    