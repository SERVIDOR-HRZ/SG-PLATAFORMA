// Detalle de Resultados - Funcionalidad para mostrar detalles de pruebas

let modalDetalleActivo = false;
let datosDetalleActual = null;
let graficoMaterias = null;

// Orden fijo de materias para mantener consistencia
const ordenMateriasArray = ['LC', 'MT', 'SC', 'CN', 'IN', 'lectura', 'matematicas', 'sociales', 'ciencias', 'ingles'];

// Función para ordenar materias según el orden establecido
function ordenarMaterias(materias) {
    return materias.sort((a, b) => {
        const indexA = ordenMateriasArray.indexOf(a);
        const indexB = ordenMateriasArray.indexOf(b);
        
        // Si ambas están en el array de orden, ordenar por índice
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB;
        }
        // Si solo una está en el array, esa va primero
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        // Si ninguna está, mantener orden alfabético
        return a.localeCompare(b);
    });
}

// Colores por materia (códigos de materia como vienen de Firebase)
const coloresMaterias = {
    'LC': '#FF4D4D',
    'MT': '#33CCFF',
    'SC': '#FF8C00',
    'CN': '#33FF77',
    'IN': '#B366FF',
    // Nombres completos también
    'Lectura Crítica': '#FF4D4D',
    'Matemáticas': '#33CCFF',
    'Ciencias Sociales': '#FF8C00',
    'Ciencias Naturales': '#33FF77',
    'Inglés': '#B366FF',
    // Nombres en minúsculas (como vienen de Firebase)
    'lectura': '#FF4D4D',
    'matematicas': '#33CCFF',
    'sociales': '#FF8C00',
    'ciencias': '#33FF77',
    'ingles': '#B366FF'
};

const nombresMaterias = {
    'LC': 'Lectura Crítica',
    'MT': 'Matemáticas',
    'SC': 'Ciencias Sociales',
    'CN': 'Ciencias Naturales',
    'IN': 'Inglés',
    // Mantener nombres completos también
    'Lectura Crítica': 'Lectura Crítica',
    'Matemáticas': 'Matemáticas',
    'Ciencias Sociales': 'Ciencias Sociales',
    'Ciencias Naturales': 'Ciencias Naturales',
    'Inglés': 'Inglés',
    // Nombres en minúsculas (como vienen de Firebase)
    'lectura': 'Lectura Crítica',
    'matematicas': 'Matemáticas',
    'sociales': 'Ciencias Sociales',
    'ciencias': 'Ciencias Naturales',
    'ingles': 'Inglés'
};

// Iconos por materia
const iconosMaterias = {
    'LC': 'bi-book-fill',
    'MT': 'bi-calculator-fill',
    'SC': 'bi-globe-americas',
    'CN': 'bi-tree-fill',
    'IN': 'bi-translate',
    // Nombres completos
    'Lectura Crítica': 'bi-book-fill',
    'Matemáticas': 'bi-calculator-fill',
    'Ciencias Sociales': 'bi-globe-americas',
    'Ciencias Naturales': 'bi-tree-fill',
    'Inglés': 'bi-translate',
    // Nombres en minúsculas
    'lectura': 'bi-book-fill',
    'matematicas': 'bi-calculator-fill',
    'sociales': 'bi-globe-americas',
    'ciencias': 'bi-tree-fill',
    'naturales': 'bi-tree-fill',
    'ingles': 'bi-translate'
};

// Función auxiliar para buscar afirmación por ID en la estructura SABER11
function buscarAfirmacionPorIdDetalle(materiaKey, afirmacionId) {
    // Mapear claves de materias a claves de SABER11_ESTRUCTURA
    const mapeoMaterias = {
        'matematicas': 'matematicas',
        'lectura': 'lecturaCritica',
        'sociales': 'socialesCiudadanas',
        'ciencias': 'cienciasNaturales',
        'ingles': 'ingles'
    };

    const saber11Key = mapeoMaterias[materiaKey] || materiaKey;

    if (!window.SABER11_ESTRUCTURA || !window.SABER11_ESTRUCTURA[saber11Key]) {
        return null;
    }

    const competencias = window.SABER11_ESTRUCTURA[saber11Key].competencias;

    for (const competencia of competencias) {
        if (competencia.afirmaciones) {
            const afirmacion = competencia.afirmaciones.find(a => a.id === afirmacionId);
            if (afirmacion) {
                return afirmacion;
            }
        }
    }

    return null;
}

// Función auxiliar para buscar competencia por ID en la estructura SABER11
function buscarCompetenciaPorIdDetalle(materiaKey, competenciaId) {
    // Mapear claves de materias a claves de SABER11_ESTRUCTURA
    const mapeoMaterias = {
        'matematicas': 'matematicas',
        'lectura': 'lecturaCritica',
        'sociales': 'socialesCiudadanas',
        'ciencias': 'cienciasNaturales',
        'ingles': 'ingles'
    };

    const saber11Key = mapeoMaterias[materiaKey] || materiaKey;

    if (!window.SABER11_ESTRUCTURA || !window.SABER11_ESTRUCTURA[saber11Key]) {
        return null;
    }

    const competencias = window.SABER11_ESTRUCTURA[saber11Key].competencias;
    return competencias.find(c => c.id === competenciaId);
}

// Inicializar event listeners para botones "Ver Resultados"
document.addEventListener('click', async function (e) {
    const button = e.target.closest('.btn-view-details');
    if (button) {
        const id = button.getAttribute('data-id');
        const pruebaId = button.getAttribute('data-prueba-id');
        const type = button.getAttribute('data-type');

        await mostrarDetalleResultados(id, pruebaId, type);
    }
});

// Función principal para mostrar el detalle de resultados
async function mostrarDetalleResultados(respuestaId, pruebaId, tipo) {
    try {
        // Determinar qué vista usar según el tipo
        const listaView = tipo === 'minisimulacro' ?
            document.getElementById('minisimu-lista-view') :
            document.getElementById('pruebas-lista-view');
        const detalleView = tipo === 'minisimulacro' ?
            document.getElementById('minisimu-detalle-view') :
            document.getElementById('pruebas-detalle-view');
        const detalleContent = tipo === 'minisimulacro' ?
            document.getElementById('minisimu-detalle-content') :
            document.getElementById('pruebas-detalle-content');

        // Ocultar lista y mostrar detalle
        listaView.style.display = 'none';
        detalleView.style.display = 'block';

        // Mostrar loading
        detalleContent.innerHTML = `
            <div class="modal-loading">
                <i class="bi bi-hourglass-split"></i>
                <p>Cargando resultados...</p>
            </div>
        `;

        // Scroll al inicio
        window.scrollTo({ top: 0, behavior: 'smooth' });

        // Obtener datos de Firebase
        const db = window.firebaseDB;

        // Obtener datos de la prueba
        const pruebaDoc = await db.collection('pruebas').doc(pruebaId).get();
        if (!pruebaDoc.exists) {
            throw new Error('No se encontró la prueba');
        }

        const pruebaData = pruebaDoc.data();
        console.log('=== DATOS DE PRUEBA ===', pruebaData);

        // Obtener TODAS las respuestas del estudiante (ambos bloques si existen)
        const estudianteId = JSON.parse(sessionStorage.getItem('currentUser') || '{}').numeroDocumento ||
            JSON.parse(sessionStorage.getItem('currentUser') || '{}').numeroIdentidad;

        const respuestasEstudianteSnapshot = await db.collection('respuestas')
            .where('pruebaId', '==', pruebaId)
            .where('estudianteId', '==', estudianteId)
            .get();

        if (respuestasEstudianteSnapshot.empty) {
            throw new Error('No se encontraron respuestas del estudiante');
        }

        // Consolidar respuestas de todos los bloques del estudiante
        const respuestasConsolidadas = {};
        const bloquesCompletados = [];

        console.log('=== CONSOLIDANDO RESPUESTAS DE TODOS LOS BLOQUES ===');
        respuestasEstudianteSnapshot.forEach(doc => {
            const respuesta = doc.data();
            const bloqueNum = respuesta.bloque || 1;
            bloquesCompletados.push(bloqueNum);

            console.log(`Procesando bloque ${bloqueNum}:`);

            if (respuesta.respuestasEvaluadas) {
                Object.keys(respuesta.respuestasEvaluadas).forEach(materia => {
                    if (!respuestasConsolidadas[materia]) {
                        respuestasConsolidadas[materia] = {};
                    }

                    const respuestasMateria = respuesta.respuestasEvaluadas[materia];
                    const totalPreguntas = Object.keys(respuestasMateria).length;
                    const correctas = Object.values(respuestasMateria).filter(r => r.esCorrecta).length;

                    console.log(`  ${materia}: ${correctas}/${totalPreguntas} correctas`);

                    // Agregar todas las respuestas del bloque actual para esta materia
                    Object.keys(respuesta.respuestasEvaluadas[materia]).forEach(preguntaId => {
                        const respuestaPregunta = respuesta.respuestasEvaluadas[materia][preguntaId];
                        // Crear un ID único combinando pregunta y bloque para evitar conflictos
                        const preguntaUnicaId = `${preguntaId}_bloque${bloqueNum}`;
                        respuestasConsolidadas[materia][preguntaUnicaId] = respuestaPregunta;
                    });
                });
            }
        });

        console.log(`=== BLOQUES COMPLETADOS: ${bloquesCompletados.join(', ')} ===`);

        // Obtener TODAS las respuestas de TODOS los estudiantes de TODOS los bloques para calcular porcentajes reales
        const todasRespuestasSnapshot = await db.collection('respuestas')
            .where('pruebaId', '==', pruebaId)
            .get();

        const todasLasRespuestas = [];
        todasRespuestasSnapshot.forEach(doc => {
            todasLasRespuestas.push(doc.data());
        });

        console.log(`=== TOTAL DE RESPUESTAS DE TODOS LOS ESTUDIANTES: ${todasLasRespuestas.length} ===`);

        // Procesar datos usando las respuestas consolidadas
        const datosDetalle = procesarDatosDetalleConsolidado(respuestasConsolidadas, pruebaData, todasLasRespuestas, bloquesCompletados);
        datosDetalleActual = datosDetalle;

        console.log('=== DATOS PROCESADOS ===', datosDetalle);

        // Renderizar contenido
        renderizarContenidoDetalleInline(datosDetalle, detalleContent, tipo);

    } catch (error) {
        console.error('Error mostrando detalle:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar el detalle de resultados: ' + error.message
        });
        // Volver a la lista en caso de error
        volverALista(tipo);
    }
}

// Procesar datos del detalle usando la estructura real de Firebase
function procesarDatosDetalle(respuestaData, pruebaData, todasLasRespuestas) {
    const respuestasEvaluadas = respuestaData.respuestasEvaluadas || {};
    const estadisticas = respuestaData.estadisticas || {};
    const bloques = pruebaData.bloques || {};
    const bloqueActual = respuestaData.bloque || 1;
    const bloqueKey = `bloque${bloqueActual}`;

    console.log('=== PROCESANDO DATOS ===');
    console.log('Respuestas evaluadas:', respuestasEvaluadas);
    console.log('Estadísticas:', estadisticas);
    console.log('Total respuestas de todos:', todasLasRespuestas.length);
    console.log('Bloques de la prueba:', bloques);
    console.log('Bloque actual:', bloqueKey);

    // Calcular estadísticas de selección de opciones por pregunta
    const estadisticasPorPregunta = calcularEstadisticasOpciones(todasLasRespuestas);

    // Calcular estadísticas generales
    let totalPreguntas = 0;
    let correctas = 0;
    let incorrectas = 0;

    // Agrupar por materia usando respuestasEvaluadas
    const materias = {};

    Object.keys(respuestasEvaluadas).forEach(materia => {
        const respuestasMateria = respuestasEvaluadas[materia];

        // Mapear nombre de materia a clave de bloque
        const materiaKey = mapearNombreMateriaAKey(materia);

        // Obtener preguntas del bloque de la prueba
        const preguntasBloque = bloques[bloqueKey] && bloques[bloqueKey][materiaKey]
            ? bloques[bloqueKey][materiaKey].questions || []
            : [];

        console.log(`📚 Materia: ${materia}, Key: ${materiaKey}, Preguntas en bloque: ${preguntasBloque.length}`);

        if (!materias[materia]) {
            materias[materia] = {
                nombre: materia,
                total: 0,
                correctas: 0,
                incorrectas: 0,
                preguntas: []
            };
        }

        // Procesar cada pregunta de la materia
        let numeroPreguntaReal = 0;
        Object.keys(respuestasMateria).forEach((preguntaId, index) => {
            const respuestaPregunta = respuestasMateria[preguntaId];
            const esCorrecta = respuestaPregunta.esCorrecta || false;

            // DEBUG: Ver estructura de respuestaPregunta
            if (index === 0) {
                console.log('=== ESTRUCTURA DE respuestaPregunta ===', respuestaPregunta);
                console.log('Campos disponibles:', Object.keys(respuestaPregunta));
            }

            totalPreguntas++;
            materias[materia].total++;

            if (esCorrecta) {
                correctas++;
                materias[materia].correctas++;
            } else {
                incorrectas++;
                materias[materia].incorrectas++;
            }

            // IMPORTANTE: Buscar estadísticas usando materia + preguntaId
            const claveEstadisticas = `${materia}|||${preguntaId}`;
            const estadisticasPregunta = estadisticasPorPregunta[claveEstadisticas] || {
                totalRespuestas: 0,
                porOpcion: { 'A': { cantidad: 0, porcentaje: 0 }, 'B': { cantidad: 0, porcentaje: 0 }, 'C': { cantidad: 0, porcentaje: 0 }, 'D': { cantidad: 0, porcentaje: 0 } }
            };

            // Buscar información de saber11 en el bloque de la prueba
            let infoSaber11 = {
                componente: respuestaPregunta.componente || 'No especificado',
                competencia: respuestaPregunta.competencia || 'No especificada',
                afirmacion: respuestaPregunta.afirmacion || '',
                tema: respuestaPregunta.tema || 'No especificado'
            };

            console.log(`🔍 Pregunta ${index + 1}: Información Saber11 desde respuesta:`);
            console.log(`   - Componente: ${infoSaber11.componente}`);
            console.log(`   - Competencia: ${infoSaber11.competencia}`);
            console.log(`   - Afirmación: ${infoSaber11.afirmacion}`);
            console.log(`   - Tema: ${infoSaber11.tema}`);
            console.log(`   - Objeto respuestaPregunta completo:`, respuestaPregunta);
            console.log(`   - Preguntas disponibles en bloque: ${preguntasBloque.length}`);

            // IMPORTANTE: Usar SIEMPRE la información que viene de respuestasEvaluadas
            // porque ya fue procesada y guardada correctamente cuando el estudiante tomó la prueba
            // Solo buscar en el bloque si NO existe en las respuestas (para compatibilidad con pruebas antiguas)
            const necesitaBuscarEnBloque = (
                infoSaber11.componente === 'No especificado' &&
                infoSaber11.competencia === 'No especificada' &&
                !infoSaber11.afirmacion &&
                infoSaber11.tema === 'No especificado'
            );

            // Si no está en la respuesta, buscar en el bloque de la prueba (solo para pruebas antiguas)
            if (necesitaBuscarEnBloque && preguntasBloque.length > 0) {
                console.log(`   ⚠️ No hay info en respuesta, buscando en bloque...`);

                // Contar preguntas reales hasta encontrar la correcta
                for (let i = 0; i < preguntasBloque.length; i++) {
                    const p = preguntasBloque[i];
                    if (p.type === 'multiple') {
                        numeroPreguntaReal++;
                        if (numeroPreguntaReal === (index + 1)) {
                            console.log(`   ✅ Pregunta encontrada en bloque (índice ${i}):`, p);
                            if (p.saber11) {
                                const saber11 = p.saber11;
                                console.log(`   📋 Saber11 encontrado:`, saber11);

                                // Extraer componentes
                                if (saber11.componentes && saber11.componentes.length > 0) {
                                    infoSaber11.componente = saber11.componentes.join(', ');
                                    console.log(`   ✓ Componentes: ${infoSaber11.componente}`);
                                }

                                // Extraer competencias (ahora son IDs, buscar nombres)
                                if (saber11.competencias && saber11.competencias.length > 0) {
                                    const competenciasArray = [];
                                    saber11.competencias.forEach(compId => {
                                        const comp = buscarCompetenciaPorIdDetalle(materiaKey, compId);
                                        if (comp) {
                                            competenciasArray.push(comp.nombre);
                                        }
                                    });
                                    if (competenciasArray.length > 0) {
                                        infoSaber11.competencia = competenciasArray.join(', ');
                                    }
                                    console.log(`   ✓ Competencias: ${infoSaber11.competencia}`);
                                }

                                // Extraer afirmaciones (estructura: { competenciaId: [afirmacionId1, afirmacionId2] })
                                if (saber11.afirmaciones && typeof saber11.afirmaciones === 'object') {
                                    const afirmacionesArray = [];
                                    Object.keys(saber11.afirmaciones).forEach(competenciaId => {
                                        const afirmacionIds = saber11.afirmaciones[competenciaId];
                                        if (Array.isArray(afirmacionIds)) {
                                            afirmacionIds.forEach(afirmacionId => {
                                                // Buscar la descripción de la afirmación en la estructura SABER11
                                                const afirmacion = buscarAfirmacionPorIdDetalle(materiaKey, afirmacionId);
                                                if (afirmacion) {
                                                    afirmacionesArray.push(afirmacion.descripcion || afirmacion.id);
                                                }
                                            });
                                        }
                                    });
                                    if (afirmacionesArray.length > 0) {
                                        infoSaber11.afirmacion = afirmacionesArray.join(', ');
                                        console.log(`   ✓ Afirmaciones: ${infoSaber11.afirmacion}`);
                                    }
                                }

                                // Extraer temas (formato "categoria|nombre", extraer solo nombre)
                                if (saber11.temas && saber11.temas.length > 0) {
                                    const temasArray = saber11.temas.map(t => {
                                        // Si es un string con formato "categoria|nombre", extraer solo el nombre
                                        if (typeof t === 'string' && t.includes('|')) {
                                            return t.split('|')[1];
                                        }
                                        // Si es un objeto, usar t.nombre
                                        return t.nombre || t;
                                    });
                                    infoSaber11.tema = temasArray.join(', ');
                                    console.log(`   ✓ Temas: ${infoSaber11.tema}`);
                                }
                            } else {
                                console.log(`   ❌ No hay objeto saber11 en esta pregunta`);
                            }
                            break;
                        }
                    }
                }
            }

            // Agregar pregunta con toda su información
            materias[materia].preguntas.push({
                id: preguntaId,
                numeroPregunta: index + 1,
                pregunta: respuestaPregunta.textoPregunta || 'Pregunta sin texto',
                respuestaEstudiante: respuestaPregunta.respuestaUsuario,
                respuestaCorrecta: respuestaPregunta.respuestaCorrecta,
                esCorrecta: esCorrecta,
                tipoRespuesta: respuestaPregunta.tipoRespuesta || 'multiple',
                // Opciones si existen
                opcionA: respuestaPregunta.opcionA || '',
                opcionB: respuestaPregunta.opcionB || '',
                opcionC: respuestaPregunta.opcionC || '',
                opcionD: respuestaPregunta.opcionD || '',
                // Estadísticas reales de selección
                estadisticas: estadisticasPregunta,
                // Información adicional (competencia, componente, tema)
                competencia: infoSaber11.competencia,
                componente: infoSaber11.componente,
                tema: infoSaber11.tema,
                afirmacion: infoSaber11.afirmacion
            });
        });

        // Calcular porcentaje por materia
        materias[materia].porcentaje = materias[materia].total > 0
            ? Math.round((materias[materia].correctas / materias[materia].total) * 100)
            : 0;

        console.log(`Materia ${materia}:`, materias[materia]);
    });

    const porcentajeGeneral = totalPreguntas > 0 ? Math.round((correctas / totalPreguntas) * 100) : 0;

    // Calcular puntaje global (usando la misma lógica que reportes)
    const puntajeGlobal = calcularPuntajeGlobalDetalle(materias);

    return {
        nombrePrueba: pruebaData.nombre,
        bloque: respuestaData.bloque || 1,
        totalPreguntas,
        correctas,
        incorrectas,
        porcentajeGeneral,
        materias,
        puntajeGlobal: puntajeGlobal
    };
}

// Procesar datos consolidados de TODOS los bloques (nueva función)
function procesarDatosDetalleConsolidado(respuestasConsolidadas, pruebaData, todasLasRespuestas, bloquesCompletados) {
    const bloques = pruebaData.bloques || {};

    console.log('=== PROCESANDO DATOS CONSOLIDADOS ===');
    console.log('Respuestas consolidadas:', respuestasConsolidadas);
    console.log('Total respuestas de todos:', todasLasRespuestas.length);
    console.log('Bloques completados:', bloquesCompletados);

    // Calcular estadísticas de selección de opciones por pregunta
    const estadisticasPorPregunta = calcularEstadisticasOpciones(todasLasRespuestas);

    // Calcular estadísticas generales
    let totalPreguntas = 0;
    let correctas = 0;
    let incorrectas = 0;

    // Agrupar por materia usando respuestasConsolidadas
    const materias = {};

    Object.keys(respuestasConsolidadas).forEach(materia => {
        const respuestasMateria = respuestasConsolidadas[materia];

        // Mapear nombre de materia a clave de bloque
        const materiaKey = mapearNombreMateriaAKey(materia);

        console.log(`📚 Materia: ${materia}, Key: ${materiaKey}`);

        if (!materias[materia]) {
            materias[materia] = {
                nombre: materia,
                total: 0,
                correctas: 0,
                incorrectas: 0,
                preguntas: []
            };
        }

        // Procesar cada pregunta de la materia (de todos los bloques)
        let numeroPreguntaGlobal = 0;
        Object.keys(respuestasMateria).forEach((preguntaIdUnico) => {
            const respuestaPregunta = respuestasMateria[preguntaIdUnico];
            const esCorrecta = respuestaPregunta.esCorrecta || false;

            // Extraer el ID original de la pregunta (sin el sufijo _bloqueX)
            const preguntaIdOriginal = preguntaIdUnico.split('_bloque')[0];
            const bloqueNum = preguntaIdUnico.includes('_bloque') ?
                parseInt(preguntaIdUnico.split('_bloque')[1]) : 1;

            totalPreguntas++;
            materias[materia].total++;
            numeroPreguntaGlobal++;

            if (esCorrecta) {
                correctas++;
                materias[materia].correctas++;
            } else {
                incorrectas++;
                materias[materia].incorrectas++;
            }

            // IMPORTANTE: Buscar estadísticas usando materia + preguntaId
            const claveEstadisticas = `${materia}|||${preguntaIdOriginal}`;
            const estadisticasPregunta = estadisticasPorPregunta[claveEstadisticas] || {
                totalRespuestas: 0,
                porOpcion: { 'A': { cantidad: 0, porcentaje: 0 }, 'B': { cantidad: 0, porcentaje: 0 }, 'C': { cantidad: 0, porcentaje: 0 }, 'D': { cantidad: 0, porcentaje: 0 } }
            };

            // Buscar información de saber11 en el bloque de la prueba
            let infoSaber11 = {
                componente: respuestaPregunta.componente || 'No especificado',
                competencia: respuestaPregunta.competencia || 'No especificada',
                afirmacion: respuestaPregunta.afirmacion || '',
                tema: respuestaPregunta.tema || 'No especificado'
            };

            // IMPORTANTE: Usar SIEMPRE la información que viene de respuestasEvaluadas
            // porque ya fue procesada y guardada correctamente cuando el estudiante tomó la prueba
            // Solo buscar en el bloque si NO existe en las respuestas (para compatibilidad con pruebas antiguas)
            const necesitaBuscarEnBloqueConsolidado = (
                infoSaber11.componente === 'No especificado' &&
                infoSaber11.competencia === 'No especificada' &&
                !infoSaber11.afirmacion &&
                infoSaber11.tema === 'No especificado'
            );

            // Si no está en la respuesta, buscar en el bloque de la prueba (solo para pruebas antiguas)
            if (necesitaBuscarEnBloqueConsolidado) {
                const bloqueKey = `bloque${bloqueNum}`;
                const preguntasBloque = bloques[bloqueKey] && bloques[bloqueKey][materiaKey]
                    ? bloques[bloqueKey][materiaKey].questions || []
                    : [];

                if (preguntasBloque.length > 0) {
                    // Buscar la pregunta en el bloque
                    let numeroPreguntaReal = 0;
                    for (let i = 0; i < preguntasBloque.length; i++) {
                        const p = preguntasBloque[i];
                        if (p.type === 'multiple') {
                            numeroPreguntaReal++;
                            // Comparar con el índice original de la pregunta
                            const indexOriginal = parseInt(preguntaIdOriginal);
                            if (numeroPreguntaReal === (indexOriginal + 1)) {
                                if (p.saber11) {
                                    const saber11 = p.saber11;

                                    // Extraer componentes
                                    if (saber11.componentes && saber11.componentes.length > 0) {
                                        infoSaber11.componente = saber11.componentes.join(', ');
                                    }

                                    // Extraer competencias (ahora son IDs, buscar nombres)
                                    if (saber11.competencias && saber11.competencias.length > 0) {
                                        const competenciasArray = [];
                                        saber11.competencias.forEach(compId => {
                                            const comp = buscarCompetenciaPorIdDetalle(materiaKey, compId);
                                            if (comp) {
                                                competenciasArray.push(comp.nombre);
                                            }
                                        });
                                        if (competenciasArray.length > 0) {
                                            infoSaber11.competencia = competenciasArray.join(', ');
                                        }
                                    }

                                    // Extraer afirmaciones
                                    if (saber11.afirmaciones && typeof saber11.afirmaciones === 'object') {
                                        const afirmacionesArray = [];
                                        Object.keys(saber11.afirmaciones).forEach(competenciaId => {
                                            const afirmacionIds = saber11.afirmaciones[competenciaId];
                                            if (Array.isArray(afirmacionIds)) {
                                                afirmacionIds.forEach(afirmacionId => {
                                                    const afirmacion = buscarAfirmacionPorIdDetalle(materiaKey, afirmacionId);
                                                    if (afirmacion) {
                                                        afirmacionesArray.push(afirmacion.descripcion || afirmacion.id);
                                                    }
                                                });
                                            }
                                        });
                                        if (afirmacionesArray.length > 0) {
                                            infoSaber11.afirmacion = afirmacionesArray.join(', ');
                                        }
                                    }

                                    // Extraer temas (formato "categoria|nombre", extraer solo nombre)
                                    if (saber11.temas && saber11.temas.length > 0) {
                                        const temasArray = saber11.temas.map(t => {
                                            // Si es un string con formato "categoria|nombre", extraer solo el nombre
                                            if (typeof t === 'string' && t.includes('|')) {
                                                return t.split('|')[1];
                                            }
                                            // Si es un objeto, usar t.nombre
                                            return t.nombre || t;
                                        });
                                        infoSaber11.tema = temasArray.join(', ');
                                    }
                                }
                                break;
                            }
                        }
                    }
                }
            }

            // Agregar pregunta con toda su información
            materias[materia].preguntas.push({
                id: preguntaIdUnico,
                numeroPregunta: numeroPreguntaGlobal,
                pregunta: respuestaPregunta.textoPregunta || 'Pregunta sin texto',
                respuestaEstudiante: respuestaPregunta.respuestaUsuario,
                respuestaCorrecta: respuestaPregunta.respuestaCorrecta,
                esCorrecta: esCorrecta,
                tipoRespuesta: respuestaPregunta.tipoRespuesta || 'multiple',
                bloque: bloqueNum,
                // Opciones si existen
                opcionA: respuestaPregunta.opcionA || '',
                opcionB: respuestaPregunta.opcionB || '',
                opcionC: respuestaPregunta.opcionC || '',
                opcionD: respuestaPregunta.opcionD || '',
                // Estadísticas reales de selección
                estadisticas: estadisticasPregunta,
                // Información adicional (competencia, componente, tema)
                competencia: infoSaber11.competencia,
                componente: infoSaber11.componente,
                tema: infoSaber11.tema,
                afirmacion: infoSaber11.afirmacion
            });
        });

        // Calcular porcentaje por materia
        materias[materia].porcentaje = materias[materia].total > 0
            ? Math.round((materias[materia].correctas / materias[materia].total) * 100)
            : 0;

        console.log(`Materia ${materia}:`, materias[materia]);
    });

    const porcentajeGeneral = totalPreguntas > 0 ? Math.round((correctas / totalPreguntas) * 100) : 0;

    // Calcular puntaje global (usando la misma lógica que reportes)
    const puntajeGlobal = calcularPuntajeGlobalDetalle(materias);

    return {
        nombrePrueba: pruebaData.nombre,
        bloques: bloquesCompletados,
        totalPreguntas,
        correctas,
        incorrectas,
        porcentajeGeneral,
        materias,
        puntajeGlobal: puntajeGlobal
    };
}

// Mapear nombre de materia a clave de bloque
function mapearNombreMateriaAKey(nombreMateria) {
    const mapeo = {
        'Lectura Crítica': 'lectura',
        'Matemáticas': 'matematicas',
        'Ciencias Sociales': 'sociales',
        'Ciencias Naturales': 'ciencias',
        'Inglés': 'ingles',
        'LC': 'lectura',
        'MT': 'matematicas',
        'SC': 'sociales',
        'CN': 'ciencias',
        'IN': 'ingles'
    };

    return mapeo[nombreMateria] || nombreMateria.toLowerCase();
}

// Calcular estadísticas de selección de opciones basadas en TODAS las respuestas
// Calcular estadísticas de selección de opciones basadas en TODAS las respuestas
function calcularEstadisticasOpciones(todasLasRespuestas) {
    const estadisticas = {};

    // Procesar cada respuesta de cada estudiante
    todasLasRespuestas.forEach(respuesta => {
        const respuestasEvaluadas = respuesta.respuestasEvaluadas || {};
        const bloqueRespuesta = respuesta.bloque || 1;
        const estudianteId = respuesta.estudianteId;

        // Recorrer cada materia
        Object.keys(respuestasEvaluadas).forEach(materia => {
            const respuestasMateria = respuestasEvaluadas[materia];

            // Recorrer cada pregunta
            Object.keys(respuestasMateria).forEach(preguntaId => {
                const respuestaPregunta = respuestasMateria[preguntaId];

                // Crear clave única que incluya materia, pregunta Y bloque
                const claveUnica = `${materia}|||${preguntaId}|||bloque${bloqueRespuesta}`;

                // Inicializar estadísticas de esta pregunta si no existen
                if (!estadisticas[claveUnica]) {
                    estadisticas[claveUnica] = {
                        totalRespuestas: 0,
                        estudiantesUnicos: new Set(),
                        porOpcion: {
                            'A': 0,
                            'B': 0,
                            'C': 0,
                            'D': 0,
                            '0': 0,
                            '1': 0,
                            '2': 0,
                            '3': 0
                        },
                        preguntaIdOriginal: preguntaId,
                        materia: materia,
                        bloque: bloqueRespuesta
                    };
                }

                // Contar la respuesta del estudiante
                const respuestaUsuario = respuestaPregunta.respuestaUsuario;

                if (respuestaUsuario !== null && respuestaUsuario !== undefined && respuestaUsuario !== '') {
                    // Crear clave única de estudiante + pregunta + bloque para evitar duplicados
                    const claveEstudiante = `${estudianteId}|||${claveUnica}`;
                    
                    // Solo contar si este estudiante no ha sido contado para esta pregunta específica
                    if (!estadisticas[claveUnica].estudiantesUnicos.has(claveEstudiante)) {
                        estadisticas[claveUnica].estudiantesUnicos.add(claveEstudiante);
                        estadisticas[claveUnica].totalRespuestas++;

                        // Convertir número a letra si es necesario
                        let opcionSeleccionada = respuestaUsuario;
                        if (typeof respuestaUsuario === 'number') {
                            const letras = ['A', 'B', 'C', 'D'];
                            opcionSeleccionada = letras[respuestaUsuario] || respuestaUsuario;
                        }

                        // Incrementar contador de esta opción
                        if (estadisticas[claveUnica].porOpcion[opcionSeleccionada] !== undefined) {
                            estadisticas[claveUnica].porOpcion[opcionSeleccionada]++;
                        }
                    }
                }
            });
        });
    });

    // Calcular porcentajes y crear índice simplificado
    const estadisticasSimplificadas = {};
    
    Object.keys(estadisticas).forEach(claveUnica => {
        const stats = estadisticas[claveUnica];
        const total = stats.totalRespuestas;
        const preguntaIdOriginal = stats.preguntaIdOriginal;
        const materia = stats.materia;

        if (total > 0) {
            const porOpcionCalculado = {};
            Object.keys(stats.porOpcion).forEach(opcion => {
                const cantidad = stats.porOpcion[opcion];
                const porcentaje = Math.round((cantidad / total) * 100);
                porOpcionCalculado[opcion] = {
                    cantidad: cantidad,
                    porcentaje: porcentaje
                };
            });

            // IMPORTANTE: Incluir materia en la clave para evitar sobrescrituras
            // Diferentes materias pueden tener preguntas con el mismo ID
            const claveConMateria = `${materia}|||${preguntaIdOriginal}`;
            estadisticasSimplificadas[claveConMateria] = {
                totalRespuestas: total,
                porOpcion: porOpcionCalculado,
                materia: materia,
                preguntaId: preguntaIdOriginal
            };
        }
    });

    console.log('=== ESTADÍSTICAS CALCULADAS ===', estadisticasSimplificadas);

    return estadisticasSimplificadas;
}

// Calcular puntaje global usando la misma lógica que reportes.js
// Tablas de porcentajes por errores según el README
const tablasPorcentajes = {
    'LC': [100, 80, 78, 75, 72, 69, 66, 63, 60, 57, 54, 51, 49, 46, 43, 40, 37, 34, 31, 29, 26, 23, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    'MT': [100, 82, 80, 77, 76, 73, 69, 67, 66, 65, 63, 62, 60, 59, 57, 56, 55, 53, 52, 51, 49, 48, 47, 45, 44, 43, 41, 40, 39, 37, 36, 35, 33, 32, 31, 31, 31, 31, 31, 31, 31, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    'SC': [100, 82, 80, 77, 76, 73, 69, 67, 66, 65, 63, 62, 60, 59, 57, 56, 55, 53, 52, 51, 49, 48, 47, 45, 44, 43, 41, 40, 39, 37, 36, 35, 33, 32, 31, 31, 31, 31, 31, 31, 31, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    'CN': [100, 81, 80, 77, 76, 73, 69, 67, 66, 65, 63, 62, 60, 59, 57, 56, 55, 53, 52, 51, 49, 48, 47, 45, 44, 43, 41, 40, 39, 37, 36, 35, 33, 32, 31, 31, 31, 31, 31, 31, 31, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20],
    'IN': [100, 83, 80, 77, 76, 73, 69, 64, 66, 65, 63, 62, 60, 59, 57, 56, 55, 53, 52, 51, 49, 48, 47, 45, 44, 43, 41, 40, 39, 37, 36, 35, 33, 32, 31, 31, 31, 31, 31, 31, 31, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20]
};

// Función para calcular puntaje por materia usando las tablas
function calcularPuntajeMateria(correctas, total, codigoMateria) {
    const errores = total - correctas;
    const tabla = tablasPorcentajes[codigoMateria];

    if (!tabla) {
        console.warn(`No se encontró tabla para la materia: ${codigoMateria}`);
        return Math.round((correctas / total) * 100);
    }

    // Para casos con muy pocas preguntas, usar porcentaje directo
    if (total <= 2) {
        return Math.round((correctas / total) * 100);
    }

    // Para casos con más preguntas, usar las tablas de porcentajes por errores
    const puntajeTabla = tabla[Math.min(errores, tabla.length - 1)];
    return puntajeTabla;
}

function calcularPuntajeGlobalDetalle(materias) {
    // Mapear materias a códigos
    const mapeoMaterias = {
        'Lectura Crítica': 'LC',
        'Matemáticas': 'MT',
        'Ciencias Sociales': 'SC',
        'Ciencias Naturales': 'CN',
        'Inglés': 'IN',
        'LC': 'LC',
        'MT': 'MT',
        'SC': 'SC',
        'CN': 'CN',
        'IN': 'IN',
        'lectura': 'LC',
        'matematicas': 'MT',
        'sociales': 'SC',
        'ciencias': 'CN',
        'ingles': 'IN'
    };

    const puntajes = [];
    const ordenMaterias = ['LC', 'MT', 'SC', 'CN', 'IN'];

    ordenMaterias.forEach(codigo => {
        // Buscar la materia por código o nombre
        let puntaje = 0;
        Object.keys(materias).forEach(nombreMateria => {
            const codigoMateria = mapeoMaterias[nombreMateria];
            if (codigoMateria === codigo) {
                const data = materias[nombreMateria];
                // Calcular puntaje usando las tablas
                puntaje = calcularPuntajeMateria(data.correctas, data.total, codigo);
            }
        });
        puntajes.push(puntaje);
    });

    // Multiplicar cada puntaje por su ponderación
    const ponderaciones = [3, 3, 3, 3, 1]; // LC, MT, SC, CN, IN
    const puntajesPonderados = puntajes.map((puntaje, index) => puntaje * ponderaciones[index]);

    // Sumar todos los puntajes ponderados
    const sumaPonderada = puntajesPonderados.reduce((a, b) => a + b, 0);

    // Dividir por la suma de ponderaciones (13) y multiplicar por 5
    const puntajeGlobal = Math.round((sumaPonderada / 13) * 5);

    return puntajeGlobal;
}

// Crear estructura del modal
function crearModalDetalle() {
    const modalHTML = `
        <div class="modal-detalle-overlay" id="modalDetalleResultados">
            <div class="modal-detalle-container">
                <div class="modal-detalle-header">
                    <h2 class="modal-detalle-title">
                        <i class="bi bi-clipboard-data"></i>
                        Detalle de Resultados
                    </h2>
                    <button class="modal-close-btn" onclick="cerrarModalDetalle()">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div class="modal-tabs">
                    <button class="modal-tab active" data-tab="resumen">
                        <i class="bi bi-bar-chart-fill"></i>
                        Resumen
                    </button>
                    <button class="modal-tab" data-tab="materias">
                        <i class="bi bi-book-fill"></i>
                        Por Materia
                    </button>
                </div>
                
                <div class="modal-detalle-body">
                    <!-- Contenido dinámico -->
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Event listeners para tabs
    const tabs = document.querySelectorAll('.modal-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');
            cambiarTabDetalle(targetTab);
        });
    });

    // Cerrar con ESC
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modalDetalleActivo) {
            cerrarModalDetalle();
        }
    });

    // Cerrar al hacer clic fuera
    document.getElementById('modalDetalleResultados').addEventListener('click', function (e) {
        if (e.target === this) {
            cerrarModalDetalle();
        }
    });
}

// Renderizar contenido del detalle
function renderizarContenidoDetalle(datos) {
    // Renderizar tab de resumen por defecto
    renderizarTabResumen(datos);
}

// Cambiar tab activo
function cambiarTabDetalle(tab) {
    // Actualizar tabs
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.modal-tab[data-tab="${tab}"]`).classList.add('active');

    // Renderizar contenido según tab
    switch (tab) {
        case 'resumen':
            renderizarTabResumen(datosDetalleActual);
            break;
        case 'materias':
            renderizarTabMaterias(datosDetalleActual);
            break;
        case 'preguntas':
            renderizarTabPreguntas(datosDetalleActual);
            break;
    }
}

// Renderizar tab de resumen
function renderizarTabResumen(datos) {
    const modalBody = document.querySelector('.modal-detalle-body');

    const html = `
        <div class="modal-tab-content active">
            <div class="resumen-general">
                <div class="resumen-card resumen-card-destacado"><div class="resumen-card-header"><div class="resumen-icon global"><i class="bi bi-trophy-fill"></i></div><div><div class="resumen-card-title">Puntaje Global</div></div></div><div class="resumen-card-value-grande">${datos.puntajeGlobal}</div><div class="resumen-card-subtitle">de 500 puntos</div></div>

                <div class="resumen-card">
                    <div class="resumen-card-header">
                        <div class="resumen-icon correctas">
                            <i class="bi bi-check-circle-fill"></i>
                        </div>
                        <div>
                            <div class="resumen-card-title">Correctas</div>
                        </div>
                    </div>
                    <div class="resumen-card-value">${datos.correctas}</div>
                    <div class="resumen-card-subtitle">de ${datos.totalPreguntas} preguntas</div>
                </div>

                <div class="resumen-card">
                    <div class="resumen-card-header">
                        <div class="resumen-icon incorrectas">
                            <i class="bi bi-x-circle-fill"></i>
                        </div>
                        <div>
                            <div class="resumen-card-title">Incorrectas</div>
                        </div>
                    </div>
                    <div class="resumen-card-value">${datos.incorrectas}</div>
                    <div class="resumen-card-subtitle">de ${datos.totalPreguntas} preguntas</div>
                </div>

                <div class="resumen-card">
                    <div class="resumen-card-header">
                        <div class="resumen-icon porcentaje">
                            <i class="bi bi-percent"></i>
                        </div>
                        <div>
                            <div class="resumen-card-title">Porcentaje</div>
                        </div>
                    </div>
                    <div class="resumen-card-value">${datos.porcentajeGeneral}%</div>
                    <div class="resumen-card-subtitle">Rendimiento general</div>
                </div>
            </div>

            <div class="grafico-materias">
                <h3><i class="bi bi-pie-chart-fill"></i> Rendimiento por Materia</h3>
                <div class="grafico-canvas">
                    
                </div>
            </div>

            <div class="materias-lista">
                ${ordenarMaterias(Object.keys(datos.materias)).map(materia => {
        const data = datos.materias[materia];
        const color = coloresMaterias[materia] || '#999';
        const nombreMateria = nombresMaterias[materia] || materia;
        const icono = iconosMaterias[materia] || 'bi-book';
        return `
                        <div class="materia-card" onclick="verDetalleMateria('${materia}')">
                            <div class="materia-card-header">
                                <div class="materia-nombre">
                                    <div class="materia-icono" style="background: ${color};">
                                        <i class="bi ${icono}"></i>
                                    </div>
                                    <span>${nombreMateria}</span>
                                </div>
                                <div class="materia-header-right"><div class="materia-puntaje-badge" style="background: linear-gradient(135deg, ${color}, ${color}dd);">${data.porcentaje}%</div><button class="btn-ver-detalle-header"><i class="bi bi-eye-fill"></i><span>Ver Preguntas</span><i class="bi bi-chevron-right"></i></button></div></div><div class="materia-stats">
                                <div class="materia-stat">
                                    <div class="materia-stat-label">Total</div>
                                    <div class="materia-stat-value">${data.total}</div>
                                </div>
                                <div class="materia-stat">
                                    <div class="materia-stat-label">Correctas</div>
                                    <div class="materia-stat-value correctas">${data.correctas}</div>
                                </div>
                                <div class="materia-stat">
                                    <div class="materia-stat-label">Incorrectas</div>
                                    <div class="materia-stat-value incorrectas">${data.incorrectas}</div>
                                </div>
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;

    modalBody.innerHTML = html;

    // Inicializar gráfico
    setTimeout(() => inicializarGraficoMaterias(datos), 100);
}

// Inicializar gráfico de materias
function inicializarGraficoMaterias(datos) {
    const container = document.querySelector('.grafico-canvas');
    if (!container) return;

    // Destruir gráfico anterior si existe
    if (graficoMaterias) {
        graficoMaterias.destroy();
        graficoMaterias = null;
    }

    // Limpiar contenedor y crear grid de gráficos circulares
    container.innerHTML = '';
    container.style.display = 'grid';
    container.style.gap = '2rem';
    container.style.padding = '1rem';
    container.style.height = 'auto';
    container.style.justifyItems = 'center';

    const materias = ordenarMaterias(Object.keys(datos.materias));
    
    // Ajustar grid según cantidad de materias
    if (materias.length === 1) {
        container.style.gridTemplateColumns = '1fr';
        container.style.maxWidth = '250px';
        container.style.margin = '0 auto';
    } else {
        container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(150px, 1fr))';
        container.style.maxWidth = 'none';
        container.style.margin = '0';
    }

    materias.forEach(materia => {
        const data = datos.materias[materia];
        const color = coloresMaterias[materia] || '#999';
        const nombreMateria = nombresMaterias[materia] || materia;
        const porcentaje = data.porcentaje;

        // Crear contenedor para cada gráfico circular
        const chartWrapper = document.createElement('div');
        chartWrapper.style.textAlign = 'center';
        chartWrapper.style.position = 'relative';
        chartWrapper.style.maxWidth = '200px';

        // Crear canvas
        const canvas = document.createElement('canvas');
        canvas.width = 150;
        canvas.height = 150;
        
        // Crear título
        const title = document.createElement('div');
        title.style.color = 'white';
        title.style.fontWeight = '600';
        title.style.marginTop = '1rem';
        title.style.fontSize = '0.95rem';
        title.textContent = nombreMateria;

        chartWrapper.appendChild(canvas);
        chartWrapper.appendChild(title);
        container.appendChild(chartWrapper);

        // Crear gráfico circular (doughnut)
        new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: ['Aciertos', 'Errores'],
                datasets: [{
                    data: [porcentaje, 100 - porcentaje],
                    backgroundColor: [color, 'rgba(255, 255, 255, 0.1)'],
                    borderColor: ['rgba(0, 0, 0, 0.5)', 'rgba(255, 255, 255, 0.1)'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                cutout: '70%',
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        padding: 12,
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: color,
                        borderWidth: 2,
                        callbacks: {
                            label: function (context) {
                                if (context.dataIndex === 0) {
                                    return `Aciertos: ${porcentaje}%`;
                                } else {
                                    return `Errores: ${100 - porcentaje}%`;
                                }
                            }
                        }
                    }
                }
            },
            plugins: [{
                id: 'centerText',
                beforeDraw: function(chart) {
                    const ctx = chart.ctx;
                    const width = chart.width;
                    const height = chart.height;
                    
                    ctx.restore();
                    const fontSize = (height / 80).toFixed(2);
                    ctx.font = `bold ${fontSize}em sans-serif`;
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = color;
                    
                    const text = `${porcentaje}%`;
                    const textX = Math.round((width - ctx.measureText(text).width) / 2);
                    const textY = height / 2;
                    
                    ctx.fillText(text, textX, textY);
                    ctx.save();
                }
            }]
        });
    });
}

// Renderizar tab de materias
function renderizarTabMaterias(datos) {
    const modalBody = document.querySelector('.modal-detalle-body');

    const html = `
        <div class="modal-tab-content active">
            <div class="materias-lista">
                ${ordenarMaterias(Object.keys(datos.materias)).map(materia => {
        const data = datos.materias[materia];
        const color = coloresMaterias[materia] || '#999';
        const nombreMateria = nombresMaterias[materia] || materia;
        const icono = iconosMaterias[materia] || 'bi-book';
        return `
                        <div class="materia-card" onclick="verDetalleMateria('${materia}')">
                            <div class="materia-card-header">
                                <div class="materia-nombre">
                                    <div class="materia-icono" style="background: ${color};">
                                        <i class="bi ${icono}"></i>
                                    </div>
                                    <span>${nombreMateria}</span>
                                </div>
                                <div class="materia-header-right"><div class="materia-puntaje-badge" style="background: linear-gradient(135deg, ${color}, ${color}dd);">${data.porcentaje}%</div><button class="btn-ver-detalle-header"><i class="bi bi-eye-fill"></i><span>Ver Preguntas</span><i class="bi bi-chevron-right"></i></button></div></div><div class="materia-stats">
                                <div class="materia-stat">
                                    <div class="materia-stat-label">Total</div>
                                    <div class="materia-stat-value">${data.total}</div>
                                </div>
                                <div class="materia-stat">
                                    <div class="materia-stat-label">Correctas</div>
                                    <div class="materia-stat-value correctas">${data.correctas}</div>
                                </div>
                                <div class="materia-stat">
                                    <div class="materia-stat-label">Incorrectas</div>
                                    <div class="materia-stat-value incorrectas">${data.incorrectas}</div>
                                </div>
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;

    modalBody.innerHTML = html;
}

// Ver detalle de una materia específica
function verDetalleMateria(materia) {
    if (!datosDetalleActual || !datosDetalleActual.materias[materia]) return;

    const data = datosDetalleActual.materias[materia];
    const modalBody = document.querySelector('.modal-detalle-body');
    const color = coloresMaterias[materia] || '#999';
    const nombreMateria = nombresMaterias[materia] || materia;
    const icono = iconosMaterias[materia] || 'bi-book';

    const html = `
        <div class="modal-tab-content active">
            <div style="margin-bottom: 2rem;">
                <button onclick="cambiarTabDetalle('materias')" style="
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 10px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                ">
                    <i class="bi bi-arrow-left"></i>
                    Volver a Materias
                </button>
            </div>

            <div class="resumen-general" style="margin-bottom: 2rem;">
                <div class="resumen-card">
                    <div class="resumen-card-header">
                        <div class="resumen-icon" style="background: ${color};">
                            <i class="bi ${icono}"></i>
                        </div>
                        <div>
                            <div class="resumen-card-title">${nombreMateria}</div>
                        </div>
                    </div>
                    <div class="resumen-card-value">${data.porcentaje}%</div>
                    <div class="resumen-card-subtitle">Rendimiento</div>
                </div>

                <div class="resumen-card">
                    <div class="resumen-card-header">
                        <div class="resumen-icon correctas">
                            <i class="bi bi-check-circle-fill"></i>
                        </div>
                        <div>
                            <div class="resumen-card-title">Correctas</div>
                        </div>
                    </div>
                    <div class="resumen-card-value">${data.correctas}</div>
                    <div class="resumen-card-subtitle">de ${data.total} preguntas</div>
                </div>

                <div class="resumen-card">
                    <div class="resumen-card-header">
                        <div class="resumen-icon incorrectas">
                            <i class="bi bi-x-circle-fill"></i>
                        </div>
                        <div>
                            <div class="resumen-card-title">Incorrectas</div>
                        </div>
                    </div>
                    <div class="resumen-card-value">${data.incorrectas}</div>
                    <div class="resumen-card-subtitle">de ${data.total} preguntas</div>
                </div>
            </div>

            <div class="preguntas-container">
                ${data.preguntas.map((pregunta, index) => renderizarPreguntaCard(pregunta, index + 1, materia)).join('')}
            </div>
        </div>
    `;

    modalBody.innerHTML = html;
}

// Renderizar tab de todas las preguntas
function renderizarTabPreguntas(datos) {
    const modalBody = document.querySelector('.modal-detalle-body');

    // Obtener todas las preguntas de todas las materias
    const todasLasPreguntas = [];
    ordenarMaterias(Object.keys(datos.materias)).forEach(materia => {
        datos.materias[materia].preguntas.forEach(pregunta => {
            todasLasPreguntas.push({ ...pregunta, materia });
        });
    });

    // Ordenar por número de pregunta
    todasLasPreguntas.sort((a, b) => (a.numeroPregunta || 0) - (b.numeroPregunta || 0));

    const html = `
        <div class="modal-tab-content active">
            <div class="preguntas-container">
                ${todasLasPreguntas.map((pregunta, index) => renderizarPreguntaCard(pregunta, index + 1, pregunta.materia)).join('')}
            </div>
        </div>
    `;

    modalBody.innerHTML = html;
}

// Renderizar card de pregunta con la estructura real y porcentajes reales
function renderizarPreguntaCard(pregunta, numero, materia) {
    const opciones = ['A', 'B', 'C', 'D'];
    const respuestaCorrecta = pregunta.respuestaCorrecta;
    
    // INTENTAR MÚLTIPLES CAMPOS POSIBLES PARA LA RESPUESTA DEL ESTUDIANTE
    const respuestaEstudiante = pregunta.respuestaUsuario || 
                                pregunta.respuestaEstudiante || 
                                pregunta.respuesta || 
                                pregunta.seleccion ||
                                pregunta.opcionSeleccionada;
    
    const esCorrecta = pregunta.esCorrecta;
    const estadisticas = pregunta.estadisticas || { totalRespuestas: 0, porOpcion: {} };
    
    // Extraer ID original de la pregunta (sin sufijo _bloqueX)
    const preguntaIdOriginal = pregunta.id ? pregunta.id.split('_bloque')[0] : numero;

    console.log('=== RENDERIZANDO PREGUNTA ===');
    console.log('Pregunta completa:', pregunta);
    console.log('respuestaEstudiante encontrada:', respuestaEstudiante);

    console.log('Renderizando pregunta:', {
        numero,
        respuestaCorrecta,
        respuestaEstudiante,
        esCorrecta,
        estadisticas
    });

    // Si es pregunta abierta
    if (pregunta.tipoRespuesta === 'open' || pregunta.tipoRespuesta === 'short') {
        return `
            <div class="pregunta-card">
                <div class="pregunta-header">
                    <div class="pregunta-numero">
                        Pregunta ${numero}
                    </div>
                    <div class="pregunta-estado ${esCorrecta ? 'correcta' : 'incorrecta'}">
                        <i class="bi bi-${esCorrecta ? 'check-circle-fill' : 'x-circle-fill'}"></i>
                        ${esCorrecta ? 'Respondida' : 'Sin responder'}
                    </div>
                </div>

                ${pregunta.competencia !== 'No especificada' || pregunta.componente !== 'No especificado' || pregunta.tema !== 'No especificado' ? `
                    <div class="pregunta-metadata">
                        ${pregunta.competencia !== 'No especificada' ? `<span class="metadata-tag"><i class="bi bi-award"></i> ${pregunta.competencia}</span>` : ''}
                        ${pregunta.componente !== 'No especificado' ? `<span class="metadata-tag"><i class="bi bi-puzzle"></i> ${pregunta.componente}</span>` : ''}
                        ${pregunta.tema !== 'No especificado' ? `<span class="metadata-tag"><i class="bi bi-bookmark"></i> ${pregunta.tema}</span>` : ''}
                    </div>
                ` : ''}

                <div class="pregunta-texto">
                    ${pregunta.pregunta || pregunta.textoPregunta || 'Pregunta sin texto'}
                </div>

                <div class="pregunta-opciones">
                    <div class="opcion-item">
                        <div class="opcion-texto" style="width: 100%; padding: 1rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                            <strong>Tu respuesta:</strong><br>
                            ${respuestaEstudiante || 'Sin respuesta'}
                        </div>
                    </div>
                    ${respuestaCorrecta && respuestaCorrecta !== 'Respuesta abierta - Requiere revisión manual' ? `
                        <div class="opcion-item correcta">
                            <div class="opcion-texto" style="width: 100%; padding: 1rem;">
                                <strong>Respuesta esperada:</strong><br>
                                ${respuestaCorrecta}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // Para preguntas de selección múltiple
    // Convertir respuesta correcta a letra si es número
    let respuestaCorrectaLetra = respuestaCorrecta;
    if (typeof respuestaCorrecta === 'number') {
        respuestaCorrectaLetra = opciones[respuestaCorrecta];
    }

    let respuestaEstudianteLetra = respuestaEstudiante;
    if (typeof respuestaEstudiante === 'number') {
        respuestaEstudianteLetra = opciones[respuestaEstudiante];
    }

    console.log('=== RENDERIZANDO OPCIONES ===');
    console.log('Respuesta correcta (letra):', respuestaCorrectaLetra);
    console.log('Respuesta estudiante (letra):', respuestaEstudianteLetra);
    console.log('Es correcta:', esCorrecta);

    return `
        <div class="pregunta-card" data-pregunta-id="${preguntaIdOriginal}" data-materia="${materia || ''}">
            <div class="pregunta-header">
                <div class="pregunta-numero">
                    Pregunta ${numero}
                </div>
                <div class="pregunta-estado ${esCorrecta ? 'correcta' : 'incorrecta'}">
                    <i class="bi bi-${esCorrecta ? 'check-circle-fill' : 'x-circle-fill'}"></i>
                    ${esCorrecta ? 'Correcta' : 'Incorrecta'}
                </div>
            </div>

            ${pregunta.competencia !== 'No especificada' || pregunta.componente !== 'No especificado' || pregunta.tema !== 'No especificado' ? `
                <div class="pregunta-metadata">
                    ${pregunta.competencia !== 'No especificada' ? `<span class="metadata-tag"><i class="bi bi-award"></i> <strong>Competencia:</strong> ${pregunta.competencia}</span>` : ''}
                    ${pregunta.componente !== 'No especificado' ? `<span class="metadata-tag"><i class="bi bi-puzzle"></i> <strong>Componente:</strong> ${pregunta.componente}</span>` : ''}
                    ${pregunta.tema !== 'No especificado' ? `<span class="metadata-tag"><i class="bi bi-bookmark"></i> <strong>Tema:</strong> ${pregunta.tema}</span>` : ''}
                </div>
            ` : ''}

            ${pregunta.afirmacion ? `
                <div class="pregunta-afirmacion">
                    <strong>Afirmación:</strong> ${pregunta.afirmacion}
                </div>
            ` : ''}

            <div class="pregunta-texto">
                ${pregunta.pregunta || pregunta.textoPregunta || 'Pregunta sin texto'}
            </div>

            <div class="pregunta-opciones">
                ${opciones.map(opcion => {
        const esRespuestaCorrecta = opcion === respuestaCorrectaLetra;
        const esRespuestaEstudiante = opcion === respuestaEstudianteLetra;

        let clases = ['opcion-item'];
        if (esRespuestaCorrecta) {
            clases.push('correcta');
        } else {
            // Si NO es la respuesta correcta, marcarla como incorrecta
            clases.push('incorrecta');
        }
        if (esRespuestaEstudiante) clases.push('seleccionada');

        const textoOpcion = pregunta[`opcion${opcion}`] || `Opción ${opcion}`;

        // Obtener porcentaje real de esta opción
        let porcentajeReal = 0;
        let cantidadReal = 0;
        if (estadisticas.porOpcion && estadisticas.porOpcion[opcion]) {
            porcentajeReal = estadisticas.porOpcion[opcion].porcentaje || 0;
            cantidadReal = estadisticas.porOpcion[opcion].cantidad || 0;
        }

        return `
                        <div class="${clases.join(' ')}" style="${esRespuestaEstudiante ? 'background: rgba(255, 165, 0, 0.4) !important; border: 4px solid #ffa500 !important;' : ''}">
                            <div class="opcion-letra">${opcion}</div>
                            <div class="opcion-texto">
                                ${textoOpcion}
                                ${esRespuestaEstudiante ? '<div class="badge-seleccionada"><i class="bi bi-hand-index-thumb-fill"></i> ✓ SELECCIONADA</div>' : ''}
                            </div>
                            <div class="opcion-indicador ${esRespuestaCorrecta ? 'correcta' : 'incorrecta'}">
                                ${esRespuestaCorrecta ? '<i class="bi bi-check-lg"></i> Correcta' : ''}
                                ${esRespuestaEstudiante && !esCorrecta ? '<i class="bi bi-x-lg"></i>' : ''}
                                ${esRespuestaEstudiante && esCorrecta ? '<i class="bi bi-check-lg"></i>' : ''}
                                <span class="opcion-porcentaje" data-opcion="${opcion}" data-pregunta-id="${preguntaIdOriginal}" data-materia="${materia || ''}" title="${cantidadReal} estudiante(s) seleccionaron esta opción - Clic para ver lista">${porcentajeReal}%</span>
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>

            ${estadisticas.totalRespuestas > 0 ? `
                <div class="pregunta-stats-footer">
                    <i class="bi bi-people-fill"></i>
                    <span>Basado en ${estadisticas.totalRespuestas} respuesta(s) de estudiantes</span>
                </div>
            ` : ''}
        </div>
    `;
}

// Cerrar modal
function cerrarModalDetalle() {
    const modal = document.getElementById('modalDetalleResultados');
    if (modal) {
        modal.classList.remove('active');
        modalDetalleActivo = false;
        datosDetalleActual = null;

        // Destruir gráfico si existe
        if (graficoMaterias) {
            graficoMaterias.destroy();
            graficoMaterias = null;
        }
    }
}

// Función para volver a la lista
function volverALista(tipo) {
    const listaView = tipo === 'minisimulacro' ?
        document.getElementById('minisimu-lista-view') :
        document.getElementById('pruebas-lista-view');
    const detalleView = tipo === 'minisimulacro' ?
        document.getElementById('minisimu-detalle-view') :
        document.getElementById('pruebas-detalle-view');

    // Mostrar lista y ocultar detalle
    listaView.style.display = 'block';
    detalleView.style.display = 'none';

    // Limpiar datos
    datosDetalleActual = null;

    // Destruir gráfico si existe
    if (graficoMaterias) {
        graficoMaterias.destroy();
        graficoMaterias = null;
    }

    // Scroll al inicio
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Event listeners para botones de volver
document.addEventListener('DOMContentLoaded', function () {
    const btnVolverPruebas = document.getElementById('btnVolverPruebas');
    if (btnVolverPruebas) {
        btnVolverPruebas.addEventListener('click', () => volverALista('prueba'));
    }

    const btnVolverMinisimu = document.getElementById('btnVolverMinisimu');
    if (btnVolverMinisimu) {
        btnVolverMinisimu.addEventListener('click', () => volverALista('minisimulacro'));
    }
});

// Renderizar contenido inline (en la misma página)
function renderizarContenidoDetalleInline(datos, container, tipo) {
    // Crear estructura de tabs
    const html = `
        <div class="detalle-inline-container">
            <div class="detalle-header">
                <h2 class="detalle-title">
                    <i class="bi bi-clipboard-data"></i>
                    ${datos.nombrePrueba} - ${datos.bloques.length > 1 ?
            `Bloques ${datos.bloques.join(' y ')}` :
            `Bloque ${datos.bloques[0]}`}
                </h2>
            </div>
            
            <div class="modal-tabs">
                <button class="modal-tab active" data-tab="resumen">
                    <i class="bi bi-bar-chart-fill"></i>
                    Resumen
                </button>
                <button class="modal-tab" data-tab="materias">
                    <i class="bi bi-book-fill"></i>
                    Por Materia
                </button>
            </div>
            
            <div class="detalle-body" id="detalleBodyInline">
                <!-- Contenido dinámico -->
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Event listeners para tabs
    const tabs = container.querySelectorAll('.modal-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            const targetTab = this.getAttribute('data-tab');
            cambiarTabDetalleInline(targetTab, tipo);
        });
    });

    // Renderizar tab de resumen por defecto
    renderizarTabResumenInline(datos, tipo);
}

// Cambiar tab activo inline
function cambiarTabDetalleInline(tab, tipo) {
    const container = tipo === 'minisimulacro' ?
        document.getElementById('minisimu-detalle-content') :
        document.getElementById('pruebas-detalle-content');

    // Actualizar tabs
    container.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    container.querySelector(`.modal-tab[data-tab="${tab}"]`).classList.add('active');

    // Renderizar contenido según tab
    switch (tab) {
        case 'resumen':
            renderizarTabResumenInline(datosDetalleActual, tipo);
            break;
        case 'materias':
            renderizarTabMateriasInline(datosDetalleActual, tipo);
            break;
        case 'preguntas':
            renderizarTabPreguntasInline(datosDetalleActual, tipo);
            break;
    }
}

// Renderizar tab de resumen inline
function renderizarTabResumenInline(datos, tipo) {
    const container = tipo === 'minisimulacro' ?
        document.getElementById('minisimu-detalle-content') :
        document.getElementById('pruebas-detalle-content');
    const detalleBody = container.querySelector('#detalleBodyInline');

    const html = `
        <div class="modal-tab-content active">
            <div class="resumen-general">
                <div class="resumen-card resumen-card-destacado"><div class="resumen-card-header"><div class="resumen-icon global"><i class="bi bi-trophy-fill"></i></div><div><div class="resumen-card-title">Puntaje Global</div></div></div><div class="resumen-card-value-grande">${datos.puntajeGlobal}</div><div class="resumen-card-subtitle">de 500 puntos</div></div>

                <div class="resumen-card">
                    <div class="resumen-card-header">
                        <div class="resumen-icon correctas">
                            <i class="bi bi-check-circle-fill"></i>
                        </div>
                        <div>
                            <div class="resumen-card-title">Correctas</div>
                        </div>
                    </div>
                    <div class="resumen-card-value">${datos.correctas}</div>
                    <div class="resumen-card-subtitle">de ${datos.totalPreguntas} preguntas</div>
                </div>

                <div class="resumen-card">
                    <div class="resumen-card-header">
                        <div class="resumen-icon incorrectas">
                            <i class="bi bi-x-circle-fill"></i>
                        </div>
                        <div>
                            <div class="resumen-card-title">Incorrectas</div>
                        </div>
                    </div>
                    <div class="resumen-card-value">${datos.incorrectas}</div>
                    <div class="resumen-card-subtitle">de ${datos.totalPreguntas} preguntas</div>
                </div>

                <div class="resumen-card">
                    <div class="resumen-card-header">
                        <div class="resumen-icon porcentaje">
                            <i class="bi bi-percent"></i>
                        </div>
                        <div>
                            <div class="resumen-card-title">Porcentaje</div>
                        </div>
                    </div>
                    <div class="resumen-card-value">${datos.porcentajeGeneral}%</div>
                    <div class="resumen-card-subtitle">Rendimiento general</div>
                </div>
            </div>

            <div class="grafico-materias">
                <h3><i class="bi bi-pie-chart-fill"></i> Rendimiento por Materia</h3>
                <div class="grafico-canvas">
                    
                </div>
            </div>

            <div class="materias-lista">
                ${ordenarMaterias(Object.keys(datos.materias)).map(materia => {
        const data = datos.materias[materia];
        const color = coloresMaterias[materia] || '#999';
        const nombreMateria = nombresMaterias[materia] || materia;
        const icono = iconosMaterias[materia] || 'bi-book';
        return `
                        <div class="materia-card" onclick="verDetalleMateriaInline('${materia}', '${tipo}')">
                            <div class="materia-card-header">
                                <div class="materia-nombre">
                                    <div class="materia-icono" style="background: ${color};">
                                        <i class="bi ${icono}"></i>
                                    </div>
                                    <span>${nombreMateria}</span>
                                </div>
                                <div class="materia-header-right"><div class="materia-puntaje-badge" style="background: linear-gradient(135deg, ${color}, ${color}dd);">${data.porcentaje}%</div><button class="btn-ver-detalle-header"><i class="bi bi-eye-fill"></i><span>Ver Preguntas</span><i class="bi bi-chevron-right"></i></button></div></div><div class="materia-stats">
                                <div class="materia-stat">
                                    <div class="materia-stat-label">Total</div>
                                    <div class="materia-stat-value">${data.total}</div>
                                </div>
                                <div class="materia-stat">
                                    <div class="materia-stat-label">Correctas</div>
                                    <div class="materia-stat-value correctas">${data.correctas}</div>
                                </div>
                                <div class="materia-stat">
                                    <div class="materia-stat-label">Incorrectas</div>
                                    <div class="materia-stat-value incorrectas">${data.incorrectas}</div>
                                </div>
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;

    detalleBody.innerHTML = html;

    // Inicializar gráfico
    setTimeout(() => inicializarGraficoMaterias(datos), 100);
}

// Renderizar tab de materias inline
function renderizarTabMateriasInline(datos, tipo) {
    const container = tipo === 'minisimulacro' ?
        document.getElementById('minisimu-detalle-content') :
        document.getElementById('pruebas-detalle-content');
    const detalleBody = container.querySelector('#detalleBodyInline');

    const html = `
        <div class="modal-tab-content active">
            <div class="materias-lista">
                ${ordenarMaterias(Object.keys(datos.materias)).map(materia => {
        const data = datos.materias[materia];
        const color = coloresMaterias[materia] || '#999';
        const nombreMateria = nombresMaterias[materia] || materia;
        const icono = iconosMaterias[materia] || 'bi-book';
        return `
                        <div class="materia-card" onclick="verDetalleMateriaInline('${materia}', '${tipo}')">
                            <div class="materia-card-header">
                                <div class="materia-nombre">
                                    <div class="materia-icono" style="background: ${color};">
                                        <i class="bi ${icono}"></i>
                                    </div>
                                    <span>${nombreMateria}</span>
                                </div>
                                <div class="materia-header-right"><div class="materia-puntaje-badge" style="background: linear-gradient(135deg, ${color}, ${color}dd);">${data.porcentaje}%</div><button class="btn-ver-detalle-header"><i class="bi bi-eye-fill"></i><span>Ver Preguntas</span><i class="bi bi-chevron-right"></i></button></div></div><div class="materia-stats">
                                <div class="materia-stat">
                                    <div class="materia-stat-label">Total</div>
                                    <div class="materia-stat-value">${data.total}</div>
                                </div>
                                <div class="materia-stat">
                                    <div class="materia-stat-label">Correctas</div>
                                    <div class="materia-stat-value correctas">${data.correctas}</div>
                                </div>
                                <div class="materia-stat">
                                    <div class="materia-stat-label">Incorrectas</div>
                                    <div class="materia-stat-value incorrectas">${data.incorrectas}</div>
                                </div>
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;

    detalleBody.innerHTML = html;
}

// Ver detalle de una materia específica inline
function verDetalleMateriaInline(materia, tipo) {
    if (!datosDetalleActual || !datosDetalleActual.materias[materia]) return;

    const data = datosDetalleActual.materias[materia];
    const container = tipo === 'minisimulacro' ?
        document.getElementById('minisimu-detalle-content') :
        document.getElementById('pruebas-detalle-content');
    const detalleBody = container.querySelector('#detalleBodyInline');
    const color = coloresMaterias[materia] || '#999';
    const nombreMateria = nombresMaterias[materia] || materia;
    const icono = iconosMaterias[materia] || 'bi-book';

    const html = `
        <div class="modal-tab-content active">
            <div style="margin-bottom: 2rem;">
                <button onclick="cambiarTabDetalleInline('materias', '${tipo}')" style="
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 10px;
                    color: white;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                ">
                    <i class="bi bi-arrow-left"></i>
                    Volver a Materias
                </button>
            </div>

            <div class="resumen-general" style="margin-bottom: 2rem;">
                <div class="resumen-card">
                    <div class="resumen-card-header">
                        <div class="resumen-icon" style="background: ${color};">
                            <i class="bi ${icono}"></i>
                        </div>
                        <div>
                            <div class="resumen-card-title">${nombreMateria}</div>
                        </div>
                    </div>
                    <div class="resumen-card-value">${data.porcentaje}%</div>
                    <div class="resumen-card-subtitle">Rendimiento</div>
                </div>

                <div class="resumen-card">
                    <div class="resumen-card-header">
                        <div class="resumen-icon correctas">
                            <i class="bi bi-check-circle-fill"></i>
                        </div>
                        <div>
                            <div class="resumen-card-title">Correctas</div>
                        </div>
                    </div>
                    <div class="resumen-card-value">${data.correctas}</div>
                    <div class="resumen-card-subtitle">de ${data.total} preguntas</div>
                </div>

                <div class="resumen-card">
                    <div class="resumen-card-header">
                        <div class="resumen-icon incorrectas">
                            <i class="bi bi-x-circle-fill"></i>
                        </div>
                        <div>
                            <div class="resumen-card-title">Incorrectas</div>
                        </div>
                    </div>
                    <div class="resumen-card-value">${data.incorrectas}</div>
                    <div class="resumen-card-subtitle">de ${data.total} preguntas</div>
                </div>
            </div>

            <div class="preguntas-container">
                ${data.preguntas.map((pregunta, index) => renderizarPreguntaCard(pregunta, index + 1, materia)).join('')}
            </div>
        </div>
    `;

    detalleBody.innerHTML = html;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Renderizar tab de todas las preguntas inline
function renderizarTabPreguntasInline(datos, tipo) {
    const container = tipo === 'minisimulacro' ?
        document.getElementById('minisimu-detalle-content') :
        document.getElementById('pruebas-detalle-content');
    const detalleBody = container.querySelector('#detalleBodyInline');

    // Obtener todas las preguntas de todas las materias
    const todasLasPreguntas = [];
    ordenarMaterias(Object.keys(datos.materias)).forEach(materia => {
        datos.materias[materia].preguntas.forEach(pregunta => {
            todasLasPreguntas.push({ ...pregunta, materia });
        });
    });

    // Ordenar por número de pregunta
    todasLasPreguntas.sort((a, b) => (a.numeroPregunta || 0) - (b.numeroPregunta || 0));

    const html = `
        <div class="modal-tab-content active">
            <div class="preguntas-container">
                ${todasLasPreguntas.map((pregunta, index) => renderizarPreguntaCard(pregunta, index + 1, pregunta.materia)).join('')}
            </div>
        </div>
    `;

    detalleBody.innerHTML = html;
}


// ========================================
// MODAL DE USUARIOS POR OPCIÓN
// ========================================

// Variables globales para el modal de usuarios
let modalUsuariosActivo = false;
let usuariosActuales = [];
let usuariosFiltrados = [];

// Función principal para mostrar usuarios que seleccionaron una opción
async function mostrarUsuariosPorOpcion(materia, preguntaId, opcion) {
    try {
        console.log('=== MOSTRANDO USUARIOS POR OPCIÓN ===');
        console.log('Materia:', materia);
        console.log('Pregunta ID:', preguntaId);
        console.log('Opción:', opcion);

        // Obtener la prueba actual
        const pruebaId = datosDetalleActual?.pruebaId;
        if (!pruebaId) {
            console.error('No se encontró el ID de la prueba');
            return;
        }

        // Buscar la respuesta correcta en los datos actuales
        let respuestaCorrecta = null;
        if (datosDetalleActual && datosDetalleActual.materias[materia]) {
            const preguntas = datosDetalleActual.materias[materia].preguntas;
            const pregunta = preguntas.find(p => {
                const idOriginal = p.id ? p.id.split('_bloque')[0] : null;
                return idOriginal === preguntaId;
            });
            
            if (pregunta) {
                respuestaCorrecta = pregunta.respuestaCorrecta;
                // Convertir a letra si es número
                if (typeof respuestaCorrecta === 'number') {
                    const letras = ['A', 'B', 'C', 'D'];
                    respuestaCorrecta = letras[respuestaCorrecta];
                }
            }
        }

        const esOpcionCorrecta = opcion === respuestaCorrecta;

        // Mostrar modal con loading
        crearModalUsuarios();
        const modal = document.getElementById('modalUsuarios');
        modal.classList.add('active');
        modalUsuariosActivo = true;

        // Mostrar loading
        const modalBody = modal.querySelector('.modal-usuarios-body');
        modalBody.innerHTML = `
            <div class="usuarios-loading">
                <i class="bi bi-hourglass-split"></i>
                <p>Cargando usuarios...</p>
            </div>
        `;

        // Actualizar título del modal con indicador de correcta/incorrecta
        const modalTitle = modal.querySelector('.modal-usuarios-title');
        const modalHeader = modal.querySelector('.modal-usuarios-header');
        
        // Cambiar color del header según si es correcta o incorrecta
        if (esOpcionCorrecta) {
            modalHeader.style.background = 'linear-gradient(135deg, #00c853, #00a843)';
        } else {
            modalHeader.style.background = 'linear-gradient(135deg, #ff5252, #d32f2f)';
        }
        
        modalTitle.innerHTML = `
            <div style="display: flex; align-items: center; gap: 1rem;">
                <i class="bi bi-people-fill"></i>
                <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                    <span style="font-size: 0.9rem; opacity: 0.9;">Estudiantes que seleccionaron</span>
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="font-size: 2rem; font-weight: 900; letter-spacing: 2px;">OPCIÓN ${opcion}</span>
                        <span class="badge-estado-opcion ${esOpcionCorrecta ? 'badge-correcta' : 'badge-incorrecta'}">
                            <i class="bi bi-${esOpcionCorrecta ? 'check-circle-fill' : 'x-circle-fill'}"></i>
                            ${esOpcionCorrecta ? 'CORRECTA' : 'INCORRECTA'}
                        </span>
                    </div>
                </div>
            </div>
        `;

        // Obtener todas las respuestas de la prueba
        const db = window.firebaseDB;
        const respuestasSnapshot = await db.collection('respuestas')
            .where('pruebaId', '==', pruebaId)
            .get();

        // Filtrar usuarios que seleccionaron esta opción
        const usuarios = [];
        const estudiantesIds = new Set();

        respuestasSnapshot.forEach(doc => {
            const respuesta = doc.data();
            const estudianteId = respuesta.estudianteId;
            const respuestasEvaluadas = respuesta.respuestasEvaluadas || {};

            // Buscar en la materia específica
            if (respuestasEvaluadas[materia]) {
                const respuestasMateria = respuestasEvaluadas[materia];

                // Buscar la pregunta específica (puede tener sufijo _bloqueX)
                Object.keys(respuestasMateria).forEach(key => {
                    // Extraer el ID original de la pregunta
                    const preguntaIdOriginal = key.split('_bloque')[0];

                    if (preguntaIdOriginal === preguntaId) {
                        const respuestaPregunta = respuestasMateria[key];
                        let respuestaUsuario = respuestaPregunta.respuestaUsuario;

                        // Convertir número a letra si es necesario
                        if (typeof respuestaUsuario === 'number') {
                            const letras = ['A', 'B', 'C', 'D'];
                            respuestaUsuario = letras[respuestaUsuario];
                        }

                        // Si seleccionó esta opción y no lo hemos agregado ya
                        if (respuestaUsuario === opcion && !estudiantesIds.has(estudianteId)) {
                            estudiantesIds.add(estudianteId);
                            usuarios.push({
                                id: estudianteId,
                                nombre: null, // Se llenará después
                                opcionSeleccionada: opcion,
                                esCorrecta: esOpcionCorrecta
                            });
                        }
                    }
                });
            }
        });

        console.log(`Encontrados ${usuarios.length} usuarios que seleccionaron la opción ${opcion}`);

        // Ahora obtener los nombres de los usuarios desde la colección 'usuarios'
        for (let usuario of usuarios) {
            try {
                // Buscar por numeroDocumento o numeroIdentidad en lugar de por ID del documento
                const usuarioQuery = await db.collection('usuarios')
                    .where('numeroDocumento', '==', usuario.id)
                    .limit(1)
                    .get();
                
                if (!usuarioQuery.empty) {
                    const usuarioDoc = usuarioQuery.docs[0];
                    const datosUsuario = usuarioDoc.data();
                    
                    // DEBUG: Ver todos los campos disponibles
                    console.log('=== DATOS DEL USUARIO ===');
                    console.log('ID:', usuario.id);
                    console.log('Campos disponibles:', Object.keys(datosUsuario));
                    console.log('Datos completos:', datosUsuario);
                    
                    // Intentar obtener el nombre de diferentes campos
                    usuario.nombre = datosUsuario.nombre || 
                                    datosUsuario.nombreCompleto || 
                                    datosUsuario.nombres ||
                                    datosUsuario.displayName ||
                                    datosUsuario.fullName ||
                                    `${datosUsuario.primerNombre || ''} ${datosUsuario.segundoNombre || ''} ${datosUsuario.primerApellido || ''} ${datosUsuario.segundoApellido || ''}`.trim() ||
                                    `${datosUsuario.primerNombre || ''} ${datosUsuario.primerApellido || ''}`.trim() ||
                                    datosUsuario.usuario ||
                                    datosUsuario.email ||
                                    'Estudiante';
                    
                    console.log('Nombre asignado:', usuario.nombre);
                } else {
                    console.warn(`Usuario con numeroDocumento ${usuario.id} no existe en la colección usuarios`);
                    usuario.nombre = `ID: ${usuario.id}`;
                }
            } catch (error) {
                console.error(`Error obteniendo nombre del usuario ${usuario.id}:`, error);
                usuario.nombre = `ID: ${usuario.id}`;
            }
        }

        // Guardar usuarios actuales
        usuariosActuales = usuarios;
        usuariosFiltrados = usuarios;

        // Renderizar lista de usuarios
        renderizarListaUsuarios(usuarios, opcion, esOpcionCorrecta);

    } catch (error) {
        console.error('Error mostrando usuarios por opción:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar la lista de usuarios'
        });
        cerrarModalUsuarios();
    }
}

// Crear estructura del modal de usuarios
function crearModalUsuarios() {
    // Si ya existe, no crear de nuevo
    if (document.getElementById('modalUsuarios')) {
        return;
    }

    const modalHTML = `
        <div class="modal-usuarios-overlay" id="modalUsuarios">
            <div class="modal-usuarios-container">
                <div class="modal-usuarios-header">
                    <h3 class="modal-usuarios-title">
                        <i class="bi bi-people-fill"></i>
                        Estudiantes
                    </h3>
                    <button class="modal-usuarios-close-btn" onclick="cerrarModalUsuarios()">
                        <i class="bi bi-x-lg"></i>
                    </button>
                </div>
                
                <div class="modal-usuarios-search">
                    <div class="usuarios-search-wrapper">
                        <i class="bi bi-search usuarios-search-icon"></i>
                        <input 
                            type="text" 
                            class="usuarios-search-input" 
                            id="usuariosSearchInput"
                            placeholder="Buscar por nombre o ID..."
                            autocomplete="off"
                        >
                    </div>
                </div>

                <div class="modal-usuarios-count" id="usuariosCount">
                    <i class="bi bi-people-fill"></i>
                    <span>Total: <strong>0</strong> estudiante(s)</span>
                </div>
                
                <div class="modal-usuarios-body" id="modalUsuariosBody">
                    <!-- Contenido dinámico -->
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Event listener para el buscador
    const searchInput = document.getElementById('usuariosSearchInput');
    searchInput.addEventListener('input', function(e) {
        filtrarUsuarios(e.target.value);
    });

    // Cerrar con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modalUsuariosActivo) {
            cerrarModalUsuarios();
        }
    });

    // Cerrar al hacer clic fuera
    document.getElementById('modalUsuarios').addEventListener('click', function(e) {
        if (e.target === this) {
            cerrarModalUsuarios();
        }
    });
}

// Renderizar lista de usuarios
function renderizarListaUsuarios(usuarios, opcion, esOpcionCorrecta) {
    const modalBody = document.getElementById('modalUsuariosBody');
    const countContainer = document.getElementById('usuariosCount');

    // Actualizar contador con indicador de correcta/incorrecta
    countContainer.innerHTML = `
        <i class="bi bi-people-fill"></i>
        <span>Total: <strong>${usuarios.length}</strong> estudiante(s) - 
        <span class="${esOpcionCorrecta ? 'texto-correcta' : 'texto-incorrecta'}">
            ${esOpcionCorrecta ? 'Respuesta CORRECTA ✓' : 'Respuesta INCORRECTA ✗'}
        </span>
        </span>
    `;

    // Si no hay usuarios
    if (usuarios.length === 0) {
        modalBody.innerHTML = `
            <div class="usuarios-no-resultados">
                <i class="bi bi-inbox"></i>
                <p>No se encontraron estudiantes</p>
            </div>
        `;
        return;
    }

    // Ordenar usuarios alfabéticamente
    usuarios.sort((a, b) => a.nombre.localeCompare(b.nombre));

    // Renderizar lista
    const html = `
        <div class="usuarios-lista">
            ${usuarios.map(usuario => `
                <div class="usuario-item ${usuario.esCorrecta ? 'usuario-correcto' : 'usuario-incorrecto'}">
                    <div class="usuario-avatar ${usuario.esCorrecta ? 'avatar-correcto' : 'avatar-incorrecto'}">
                        ${obtenerIniciales(usuario.nombre)}
                    </div>
                    <div class="usuario-info">
                        <div class="usuario-nombre">${usuario.nombre}</div>
                        <div class="usuario-id">ID: ${usuario.id}</div>
                    </div>
                    <div class="usuario-estado">
                        <i class="bi bi-${usuario.esCorrecta ? 'check-circle-fill' : 'x-circle-fill'}"></i>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    modalBody.innerHTML = html;
}

// Filtrar usuarios por búsqueda
function filtrarUsuarios(termino) {
    const terminoLower = termino.toLowerCase().trim();

    if (!terminoLower) {
        // Si no hay término de búsqueda, mostrar todos
        usuariosFiltrados = usuariosActuales;
    } else {
        // Filtrar por nombre o ID
        usuariosFiltrados = usuariosActuales.filter(usuario => {
            const nombreMatch = usuario.nombre.toLowerCase().includes(terminoLower);
            const idMatch = usuario.id.toString().toLowerCase().includes(terminoLower);
            return nombreMatch || idMatch;
        });
    }

    // Renderizar lista filtrada
    const esOpcionCorrecta = usuariosActuales.length > 0 ? usuariosActuales[0].esCorrecta : false;
    renderizarListaUsuarios(usuariosFiltrados, usuariosActuales[0]?.opcionSeleccionada || 'A', esOpcionCorrecta);
}

// Obtener iniciales del nombre
function obtenerIniciales(nombre) {
    if (!nombre) return '?';
    
    const palabras = nombre.trim().split(' ');
    if (palabras.length === 1) {
        return palabras[0].substring(0, 2).toUpperCase();
    }
    
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
}

// Cerrar modal de usuarios
function cerrarModalUsuarios() {
    const modal = document.getElementById('modalUsuarios');
    if (modal) {
        modal.classList.remove('active');
        modalUsuariosActivo = false;
        usuariosActuales = [];
        usuariosFiltrados = [];

        // Limpiar buscador
        const searchInput = document.getElementById('usuariosSearchInput');
        if (searchInput) {
            searchInput.value = '';
        }
    }
}

// Event listener para clics en porcentajes
document.addEventListener('click', function(e) {
    const porcentaje = e.target.closest('.opcion-porcentaje');
    if (porcentaje) {
        // Obtener datos directamente de los atributos
        const opcion = porcentaje.getAttribute('data-opcion');
        const preguntaId = porcentaje.getAttribute('data-pregunta-id');
        const materia = porcentaje.getAttribute('data-materia');
        
        console.log('=== CLIC EN PORCENTAJE ===');
        console.log('Opción:', opcion);
        console.log('Pregunta ID:', preguntaId);
        console.log('Materia:', materia);
        
        if (opcion && preguntaId && materia) {
            mostrarUsuariosPorOpcion(materia, preguntaId, opcion);
        } else {
            console.warn('Faltan datos en el porcentaje:', { opcion, preguntaId, materia });
        }
    }
});

// Guardar el pruebaId en datosDetalleActual cuando se carga
// Modificar la función mostrarDetalleResultados para incluir el pruebaId
const mostrarDetalleResultadosOriginal = window.mostrarDetalleResultados || mostrarDetalleResultados;
window.mostrarDetalleResultados = async function(respuestaId, pruebaId, tipo) {
    await mostrarDetalleResultadosOriginal(respuestaId, pruebaId, tipo);
    
    // Agregar pruebaId a los datos actuales
    if (datosDetalleActual) {
        datosDetalleActual.pruebaId = pruebaId;
    }
};
