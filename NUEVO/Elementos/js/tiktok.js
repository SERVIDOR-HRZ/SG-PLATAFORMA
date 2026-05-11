
                (function () {
                    const counters = document.querySelectorAll('.motion-count');
                    const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting) {
                                const el = entry.target;
                                const target = parseInt(el.dataset.target);
                                let current = 0;
                                const duration = 1800;
                                const step = Math.max(1, Math.floor(target / 60));
                                const interval = duration / Math.ceil(target / step);
                                const timer = setInterval(() => {
                                    current += step;
                                    if (current >= target) { current = target; clearInterval(timer); }
                                    el.textContent = current.toLocaleString('es-CO');
                                }, interval);
                                observer.unobserve(el);
                            }
                        });
                    }, { threshold: 0.3 });
                    counters.forEach(c => observer.observe(c));

                    // Plan start countdown (25 Mar 2026)
                    function updatePlanStart() {
                        const start = new Date('2026-03-25T07:00:00-05:00');
                        const now = new Date();
                        const diff = start - now;
                        const statusEl = document.getElementById('plan-start-status');
                        const statusText = document.getElementById('plan-start-status-text');
                        const dEl = document.getElementById('plan-start-days');
                        const hEl = document.getElementById('plan-start-hrs');
                        const mEl = document.getElementById('plan-start-min');
                        if (diff <= 0) {
                            // Already started
                            if (dEl) dEl.textContent = '0';
                            if (hEl) hEl.textContent = '00';
                            if (mEl) mEl.textContent = '00';
                            if (statusEl) statusEl.className = 'plan-bento-status plan-bento-status-active';
                            if (statusText) statusText.textContent = 'En curso';
                            return;
                        }
                        const d = Math.floor(diff / 86400000);
                        const h = Math.floor((diff % 86400000) / 3600000);
                        const m = Math.floor((diff % 3600000) / 60000);
                        if (dEl) dEl.textContent = d;
                        if (hEl) hEl.textContent = String(h).padStart(2, '0');
                        if (mEl) mEl.textContent = String(m).padStart(2, '0');
                        if (statusEl) statusEl.className = 'plan-bento-status plan-bento-status-pending';
                        if (statusText) statusText.textContent = 'Faltan ' + d + ' días';
                    }
                    updatePlanStart(); setInterval(updatePlanStart, 60000);

                    // Plan end countdown
                    function updatePlanEnd() {
                        const end = new Date('2026-07-23T00:00:00-05:00');
                        const now = new Date();
                        const diff = end - now;
                        if (diff <= 0) return;
                        const d = Math.floor(diff / 86400000);
                        const h = Math.floor((diff % 86400000) / 3600000);
                        const m = Math.floor((diff % 3600000) / 60000);
                        const de = document.getElementById('plan-end-days');
                        const he = document.getElementById('plan-end-hrs');
                        const me = document.getElementById('plan-end-min');
                        if (de) de.textContent = d; if (he) he.textContent = String(h).padStart(2, '0'); if (me) me.textContent = String(m).padStart(2, '0');
                    }
                    updatePlanEnd(); setInterval(updatePlanEnd, 60000);
                })();
            