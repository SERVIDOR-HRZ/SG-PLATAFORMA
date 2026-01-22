// LaTeX Guide Module
// Guía completa de LaTeX para matemáticas

// Show LaTeX guide modal
function showLatexGuide() {
    const modalHTML = `
        <div class="modal-overlay latex-guide-overlay" id="latexGuideOverlay">
            <div class="modal latex-guide-modal">
                <div class="latex-guide-header">
                    <div class="latex-guide-title">
                        <i class="bi bi-book-fill"></i>
                        <h2>Guía Completa de LaTeX para Matemáticas</h2>
                    </div>
                    <button class="close-btn" onclick="closeLatexGuide()">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                <div class="latex-guide-body">
                    ${createLatexGuideContent()}
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    setTimeout(() => {
        document.getElementById('latexGuideOverlay').classList.add('active');
        
        // Add event listeners to copy buttons
        const copyButtons = document.querySelectorAll('.btn-copy-latex');
        copyButtons.forEach(button => {
            button.addEventListener('click', function() {
                const code = this.getAttribute('data-code');
                // Decodificar entidades HTML
                const textarea = document.createElement('textarea');
                textarea.innerHTML = code;
                const decodedCode = textarea.value;
                copyLatexCode(decodedCode);
            });
        });
        
        // Render all LaTeX examples after modal is visible
        setTimeout(() => {
            const guideBody = document.querySelector('.latex-guide-body');
            const latexRenderElements = guideBody.querySelectorAll('.latex-render-content, .latex-example-text');
            
            if (window.MathJax && window.MathJax.typesetPromise) {
                // Clear any previous MathJax processing
                window.MathJax.typesetClear(latexRenderElements);
                
                // Render all LaTeX content
                window.MathJax.typesetPromise(latexRenderElements).then(() => {
                    console.log('LaTeX guide rendered successfully');
                }).catch((err) => {
                    console.error('MathJax error:', err);
                });
            }
        }, 100);
    }, 10);
}

// Close LaTeX guide
function closeLatexGuide() {
    const modal = document.getElementById('latexGuideOverlay');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Create LaTeX guide content
function createLatexGuideContent() {
    const sections = [
        {
            title: 'Operaciones Básicas',
            icon: 'calculator',
            color: '#007bff',
            items: [
                { name: 'Suma', code: '$a + b$', example: '$5 + 3 = 8$' },
                { name: 'Resta', code: '$a - b$', example: '$10 - 4 = 6$' },
                { name: 'Multiplicación', code: '$a \\times b$', example: '$3 \\times 4 = 12$' },
                { name: 'División', code: '$a \\div b$', example: '$15 \\div 3 = 5$' },
                { name: 'Fracción', code: '$\\frac{a}{b}$', example: '$\\frac{3}{4}$' },
                { name: 'Fracción compleja', code: '$\\frac{x^2 + 1}{y - 3}$', example: '$\\frac{2x + 5}{3x - 7}$' }
            ]
        },
        {
            title: 'Exponentes y Raíces',
            icon: 'graph-up',
            color: '#28a745',
            items: [
                { name: 'Exponente', code: '$x^2$', example: '$5^2 = 25$' },
                { name: 'Exponente complejo', code: '$x^{n+1}$', example: '$2^{3+1} = 16$' },
                { name: 'Raíz cuadrada', code: '$\\sqrt{x}$', example: '$\\sqrt{16} = 4$' },
                { name: 'Raíz n-ésima', code: '$\\sqrt[n]{x}$', example: '$\\sqrt[3]{27} = 3$' },
                { name: 'Raíz compleja', code: '$\\sqrt{x^2 + y^2}$', example: '$\\sqrt{3^2 + 4^2} = 5$' }
            ]
        },
        {
            title: 'Subíndices y Superíndices',
            icon: 'subscript',
            color: '#17a2b8',
            items: [
                { name: 'Subíndice', code: '$x_i$', example: '$a_1, a_2, a_3$' },
                { name: 'Subíndice complejo', code: '$x_{i+1}$', example: '$x_{n-1}$' },
                { name: 'Ambos', code: '$x_i^2$', example: '$a_1^2 + a_2^2$' },
                { name: 'Combinado', code: '$x_{i}^{n+1}$', example: '$y_{k}^{m+2}$' }
            ]
        },
        {
            title: 'Sumatorias e Integrales',
            icon: 'sigma',
            color: '#6f42c1',
            items: [
                { name: 'Sumatoria', code: '$\\sum_{i=1}^{n} x_i$', example: '$\\sum_{k=1}^{5} k = 15$' },
                { name: 'Productoria', code: '$\\prod_{i=1}^{n} x_i$', example: '$\\prod_{k=1}^{4} k = 24$' },
                { name: 'Integral', code: '$\\int_0^1 f(x) dx$', example: '$\\int_0^{\\pi} \\sin(x) dx$' },
                { name: 'Integral doble', code: '$\\iint_D f(x,y) dA$', example: '$\\iint_R xy \\, dA$' },
                { name: 'Límite', code: '$\\lim_{x \\to \\infty} f(x)$', example: '$\\lim_{n \\to \\infty} \\frac{1}{n} = 0$' }
            ]
        },
        {
            title: 'Ecuaciones y Sistemas',
            icon: 'equals',
            color: '#dc3545',
            items: [
                { name: 'Ecuación simple', code: '$x^2 + y^2 = z^2$', example: 'Teorema de Pitágoras' },
                { name: 'Ecuación cuadrática', code: '$ax^2 + bx + c = 0$', example: 'Forma estándar' },
                { name: 'Fórmula cuadrática', code: '$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$', example: 'Solución general' }
            ]
        },
        {
            title: 'Trigonometría',
            icon: 'triangle',
            color: '#fd7e14',
            items: [
                { name: 'Seno', code: '$\\sin(x)$', example: '$\\sin(30°) = \\frac{1}{2}$' },
                { name: 'Coseno', code: '$\\cos(x)$', example: '$\\cos(60°) = \\frac{1}{2}$' },
                { name: 'Tangente', code: '$\\tan(x)$', example: '$\\tan(45°) = 1$' },
                { name: 'Identidad', code: '$\\sin^2(x) + \\cos^2(x) = 1$', example: 'Identidad fundamental' }
            ]
        },
        {
            title: 'Símbolos Especiales',
            icon: 'asterisk',
            color: '#ffc107',
            items: [
                { name: 'Infinito', code: '$\\infty$', example: '$\\lim_{x \\to \\infty}$' },
                { name: 'Pi', code: '$\\pi$', example: '$\\pi \\approx 3.14159$' },
                { name: 'Theta', code: '$\\theta$', example: '$\\theta = 45°$' },
                { name: 'Alpha', code: '$\\alpha$', example: '$\\alpha + \\beta$' },
                { name: 'Beta', code: '$\\beta$', example: '$\\beta_1$' },
                { name: 'Delta', code: '$\\Delta$', example: '$\\Delta x$' },
                { name: 'Aproximado', code: '$\\approx$', example: '$\\pi \\approx 3.14$' },
                { name: 'Diferente', code: '$\\neq$', example: '$a \\neq b$' },
                { name: 'Mayor igual', code: '$\\geq$', example: '$x \\geq 0$' },
                { name: 'Menor igual', code: '$\\leq$', example: '$y \\leq 10$' },
                { name: 'Más menos', code: '$\\pm$', example: '$x = 5 \\pm 2$' }
            ]
        },
        {
            title: 'Matrices y Vectores',
            icon: 'grid-3x3',
            color: '#20c997',
            items: [
                { name: 'Vector', code: '$\\vec{v}$', example: '$\\vec{F} = m\\vec{a}$' },
                { name: 'Matriz 2x2', code: '$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$', example: '$\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$' },
                { name: 'Determinante', code: '$\\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix}$', example: '$\\begin{vmatrix} 2 & 3 \\\\ 1 & 4 \\end{vmatrix} = 5$' }
            ]
        },
        {
            title: 'Funciones Especiales',
            icon: 'function',
            color: '#e83e8c',
            items: [
                { name: 'Logaritmo', code: '$\\log(x)$', example: '$\\log(100) = 2$' },
                { name: 'Logaritmo natural', code: '$\\ln(x)$', example: '$\\ln(e) = 1$' },
                { name: 'Exponencial', code: '$e^x$', example: '$e^0 = 1$' },
                { name: 'Valor absoluto', code: '$|x|$', example: '$|-5| = 5$' },
                { name: 'Factorial', code: '$n!$', example: '$5! = 120$' }
            ]
        }
    ];

    let html = '<div class="latex-guide-intro">';
    html += '<p><strong>💡 Sintaxis:</strong> Usa <code>$formula$</code> para fórmulas en línea y <code>$$formula$$</code> para fórmulas en bloque centradas.</p>';
    html += '<p><strong>✨ Tip:</strong> Haz clic en el botón <i class="bi bi-clipboard"></i> para copiar el código directamente.</p>';
    html += '</div>';

    sections.forEach(section => {
        html += `
            <div class="latex-section">
                <div class="latex-section-header" style="border-bottom-color: ${section.color};">
                    <i class="bi bi-${section.icon}" style="color: ${section.color};"></i>
                    <h3>${section.title}</h3>
                </div>
                <div class="latex-items-grid">
        `;
        
        section.items.forEach((item, index) => {
            // Crear un ID único para cada item
            const itemId = `latex_${section.title.replace(/\s+/g, '_')}_${index}`;
            
            html += `
                <div class="latex-item">
                    <div class="latex-item-header">
                        <span class="latex-item-name" style="color: ${section.color};">${item.name}</span>
                        <button class="btn-copy-latex" data-code="${escapeHtml(item.code)}">
                            <i class="bi bi-clipboard"></i>
                        </button>
                    </div>
                    <div class="latex-item-code">
                        <code>${escapeHtml(item.code)}</code>
                    </div>
                    <div class="latex-item-result" id="${itemId}">
                        <div class="latex-render-content">${item.code}</div>
                    </div>
                    ${item.example ? `
                        <div class="latex-item-example">
                            <i class="bi bi-lightbulb-fill"></i>
                            <div class="latex-example-text">${item.example}</div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });

    return html;
}

// Copy LaTeX code to clipboard
function copyLatexCode(code) {
    navigator.clipboard.writeText(code).then(() => {
        showNotification('Código copiado al portapapeles', 'success');
    }).catch(err => {
        console.error('Error copying:', err);
    });
}

// Escape HTML helper
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export functions to window
window.showLatexGuide = showLatexGuide;
window.closeLatexGuide = closeLatexGuide;
window.copyLatexCode = copyLatexCode;
