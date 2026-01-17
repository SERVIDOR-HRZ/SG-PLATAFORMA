// Estructura completa del examen Saber 11 basada en los Marcos de Referencia del ICFES
// Área → Competencias → Afirmaciones → Evidencias + Temas Asociados

const SABER11_ESTRUCTURA = {
    ciencias: {
        nombre: 'Ciencias Naturales',
        componentes: ['Biológico', 'Físico', 'Químico', 'CTS'],
        competencias: [
            {
                id: 'uso_comprensivo',
                nombre: 'Uso comprensivo del conocimiento científico',
                descripcion: 'Capacidad para asociar fenómenos naturales con conceptos propios del conocimiento científico.',
                afirmaciones: [
                    {
                        id: 'uc_af1',
                        descripcion: 'Asociar fenómenos naturales con conceptos propios del conocimiento científico.',
                        evidencias: [
                            'Relaciona los componentes de un circuito en serie y en paralelo con sus respectivos voltajes y corrientes.',
                            'Relaciona los distintos factores que determinan la dinámica de un sistema o fenómeno.',
                            'Relaciona los tipos de energía presentes en un objeto con las interacciones que presenta el sistema.',
                            'Establece relaciones entre fenómenos biológicos para comprender la dinámica de lo vivo.',
                            'Establece relaciones entre fenómenos biológicos para comprender su entorno.',
                            'Diferencia distintos tipos de reacciones químicas y realiza cálculos con conservación de masa y carga.',
                            'Establece relaciones entre conceptos fisicoquímicos simples con distintos fenómenos naturales.',
                            'Establece relaciones entre las propiedades y estructura de la materia con la formación de iones y moléculas.'
                        ],
                        temas: [
                            { categoria: 'Física', nombre: 'Circuitos eléctricos: serie y paralelo', tip: 'Practica con circuitos simples. Ley de Ohm: V=IR' },
                            { categoria: 'Física', nombre: 'Dinámica: Leyes de Newton', tip: 'Dibuja diagramas de cuerpo libre. F=ma' },
                            { categoria: 'Física', nombre: 'Energía: cinética, potencial, conservación', tip: 'Resuelve problemas de montaña rusa y péndulos' },
                            { categoria: 'Biología', nombre: 'Dinámica de ecosistemas y lo vivo', tip: 'Estudia cadenas tróficas y flujo de energía' },
                            { categoria: 'Biología', nombre: 'Funcionamiento de organismos', tip: 'Sistemas: circulatorio, respiratorio, nervioso' },
                            { categoria: 'Química', nombre: 'Tipos de reacciones químicas', tip: 'Síntesis, descomposición, sustitución, redox' },
                            { categoria: 'Química', nombre: 'Estequiometría y balanceo', tip: 'Conservación de masa y carga. Calcula moles' },
                            { categoria: 'Química', nombre: 'Propiedades de la materia: iones y moléculas', tip: 'Estructura atómica, tabla periódica, enlaces' }
                        ]
                    },
                    {
                        id: 'uc_af2',
                        descripcion: 'Comprender que los problemas y sus soluciones involucran distintas dimensiones.',
                        evidencias: [
                            'Establece relaciones que hay entre dimensiones presentes en una situación problemática.',
                            'Analiza los efectos en distintas dimensiones que tendría una posible intervención.',
                            'Identifica los diferentes tipos de fuerzas que actúan sobre los cuerpos.',
                            'Identifica características de algunos procesos que se dan en los ecosistemas.',
                            'Identifica características de algunos procesos que se dan en los organismos.',
                            'Identifica las propiedades y estructura de la materia y diferencia elementos, compuestos y mezclas.',
                            'Reconoce posibles cambios en el entorno por la explotación de un recurso o el uso de una tecnología.'
                        ],
                        temas: [
                            { categoria: 'Física', nombre: 'Tipos de fuerzas: gravitacional, fricción, tensión', tip: 'Identifica fuerzas en diagramas' },
                            { categoria: 'Biología', nombre: 'Procesos ecosistémicos', tip: 'Ciclos biogeoquímicos y flujo de energía' },
                            { categoria: 'Biología', nombre: 'Procesos celulares y organísmicos', tip: 'Metabolismo, respiración, fotosíntesis' },
                            { categoria: 'Química', nombre: 'Clasificación de la materia', tip: 'Elementos, compuestos, mezclas homogéneas y heterogéneas' },
                            { categoria: 'CTS', nombre: 'Impacto ambiental de tecnologías', tip: 'Analiza pros y contras de intervenciones' }
                        ]
                    }
                ]
            },
            {
                id: 'explicacion_fenomenos',
                nombre: 'Explicación de fenómenos',
                descripcion: 'Capacidad para construir explicaciones y usar modelos para dar razón de fenómenos naturales.',
                afirmaciones: [
                    {
                        id: 'ef_af1',
                        descripcion: 'Analizar el potencial del uso de recursos naturales o artefactos y sus efectos sobre el entorno y la salud.',
                        evidencias: [
                            'Explica algunos principios para mantener la salud individual y la pública.',
                            'Explica cómo la explotación de un recurso o el uso de una tecnología tiene efectos positivos y/o negativos.',
                            'Explica el uso correcto y seguro de una tecnología o artefacto en un contexto específico.'
                        ],
                        temas: [
                            { categoria: 'CTS', nombre: 'Salud pública y principios científicos', tip: 'Vacunas, antibióticos, nutrición' },
                            { categoria: 'CTS', nombre: 'Explotación de recursos naturales', tip: 'Minería, petróleo, agua, deforestación' },
                            { categoria: 'CTS', nombre: 'Uso seguro de tecnología', tip: 'Radiación, energía nuclear, biotecnología' }
                        ]
                    },
                    {
                        id: 'ef_af2',
                        descripcion: 'Explicar cómo ocurren algunos fenómenos de la naturaleza con base en observaciones, patrones y conceptos.',
                        evidencias: [
                            'Da las razones por las cuales una reacción describe un fenómeno.',
                            'Reconoce las razones por las cuales la materia se puede diferenciar según su estructura.',
                            'Reconoce los atributos que definen ciertos procesos fisicoquímicos simples.',
                            'Elabora explicaciones al relacionar las variables de estado de un sistema electrónico.',
                            'Elabora explicaciones a partir de cinemática y dinámica newtoniana.',
                            'Elabora explicaciones a partir de los modelos básicos de la termodinámica.',
                            'Elabora explicaciones a partir de los modelos básicos de ondas.',
                            'Analiza aspectos de los ecosistemas y da razón de cómo funcionan.',
                            'Analiza la dinámica interna de los organismos.'
                        ],
                        temas: [
                            { categoria: 'Química', nombre: 'Conservación de masa y carga', tip: 'Balanceo de ecuaciones químicas' },
                            { categoria: 'Química', nombre: 'Propiedades y estructura de la materia', tip: 'Estados de la materia, cambios físicos y químicos' },
                            { categoria: 'Física', nombre: 'Modelos de circuitos eléctricos', tip: 'Ley de Ohm, potencia eléctrica' },
                            { categoria: 'Física', nombre: 'Cinemática y dinámica newtoniana', tip: 'MRU, MRUA, caída libre, proyectiles' },
                            { categoria: 'Física', nombre: 'Termodinámica', tip: 'Calor, temperatura, leyes de la termodinámica' },
                            { categoria: 'Física', nombre: 'Ondas: sonido, luz', tip: 'Frecuencia, longitud de onda, reflexión, refracción' },
                            { categoria: 'Biología', nombre: 'Ecosistemas: factores bióticos y abióticos', tip: 'Relaciones ecológicas, nichos' },
                            { categoria: 'Biología', nombre: 'Dinámica interna de organismos', tip: 'Homeostasis, sistemas de órganos' }
                        ]
                    },
                    {
                        id: 'ef_af3',
                        descripcion: 'Modelar fenómenos de la naturaleza con base en el análisis de variables y la relación entre conceptos.',
                        evidencias: [
                            'Usa modelos físicos (no básicos) basados en dinámica clásica.',
                            'Identifica y usa modelos químicos para comprender fenómenos particulares.',
                            'Analiza y usa modelos biológicos para comprender la dinámica de lo vivo.'
                        ],
                        temas: [
                            { categoria: 'Modelos', nombre: 'Físicos mecanicistas', tip: 'Péndulo, proyectiles, osciladores' },
                            { categoria: 'Modelos', nombre: 'Atómicos y moleculares', tip: 'Bohr, orbital, VSEPR, hibridación' },
                            { categoria: 'Modelos', nombre: 'Biológicos', tip: 'Modelo celular, genético, ecológico' }
                        ]
                    }
                ]
            },
            {
                id: 'indagacion',
                nombre: 'Indagación',
                descripcion: 'Capacidad para comprender que a partir de la investigación científica se construyen explicaciones sobre el mundo natural.',
                afirmaciones: [
                    {
                        id: 'in_af1',
                        descripcion: 'Comprender que a partir de la investigación científica se construyen explicaciones sobre el mundo natural.',
                        evidencias: [
                            'Analiza qué tipo de pregunta puede ser contestada a partir del contexto de una investigación científica.',
                            'Reconoce la importancia de la evidencia para comprender fenómenos naturales.'
                        ],
                        temas: [
                            { categoria: 'Método Científico', nombre: 'Formulación de preguntas investigables', tip: 'Preguntas que se pueden responder con experimentos' },
                            { categoria: 'Método Científico', nombre: 'Importancia de la evidencia empírica', tip: 'Datos observables y medibles' }
                        ]
                    },
                    {
                        id: 'in_af2',
                        descripcion: 'Derivar conclusiones para algunos fenómenos de la naturaleza basándose en conocimientos científicos y evidencia.',
                        evidencias: [
                            'Comunica de forma apropiada el proceso y los resultados de investigación.',
                            'Determina si los resultados derivados son suficientes y pertinentes.',
                            'Elabora conclusiones a partir de información o evidencias que las respalden.',
                            'Hace predicciones con base en información, patrones y regularidades.'
                        ],
                        temas: [
                            { categoria: 'Método Científico', nombre: 'Comunicación científica', tip: 'Informes, gráficas, tablas' },
                            { categoria: 'Método Científico', nombre: 'Elaboración de conclusiones', tip: 'Basadas en evidencia, no en opiniones' },
                            { categoria: 'Método Científico', nombre: 'Predicciones basadas en patrones', tip: 'Extrapolar tendencias de datos' }
                        ]
                    },
                    {
                        id: 'in_af3',
                        descripcion: 'Observar y relacionar patrones en los datos para evaluar las predicciones.',
                        evidencias: [
                            'Interpreta y analiza datos representados en texto, gráficas, dibujos, diagramas o tablas.',
                            'Representa datos en gráficas y tablas.'
                        ],
                        temas: [
                            { categoria: 'Datos', nombre: 'Interpretación de gráficas y tablas', tip: 'Lee ejes, identifica tendencias' },
                            { categoria: 'Datos', nombre: 'Representación de datos', tip: 'Elige el tipo de gráfica adecuado' }
                        ]
                    },
                    {
                        id: 'in_af4',
                        descripcion: 'Utilizar habilidades de pensamiento y procedimiento para evaluar predicciones.',
                        evidencias: [
                            'Da posibles explicaciones de eventos o fenómenos consistentes con conceptos de la ciencia.',
                            'Diseña experimentos para dar respuesta a sus preguntas.',
                            'Elige y utiliza instrumentos adecuados para reunir datos.',
                            'Reconoce la necesidad de registrar y clasificar la información.',
                            'Usa información adicional para evaluar una predicción.'
                        ],
                        temas: [
                            { categoria: 'Experimentación', nombre: 'Formulación de hipótesis', tip: 'Si... entonces...' },
                            { categoria: 'Experimentación', nombre: 'Diseño experimental', tip: 'Variables: independiente, dependiente, controladas' },
                            { categoria: 'Experimentación', nombre: 'Instrumentos de medición', tip: 'Precisión, exactitud, calibración' },
                            { categoria: 'Experimentación', nombre: 'Registro y clasificación de datos', tip: 'Tablas organizadas, unidades' }
                        ]
                    }
                ]
            }
        ]
    },

    sociales: {
        nombre: 'Sociales y Ciudadanas',
        componentes: ['Pensamiento Social', 'Interpretación de Perspectivas', 'Pensamiento Sistémico'],
        competencias: [
            {
                id: 'pensamiento_social',
                nombre: 'Pensamiento Social',
                descripcion: 'Comprensión de modelos conceptuales, características y contextos de aplicación en las ciencias sociales.',
                afirmaciones: [
                    {
                        id: 'ps_af1',
                        descripcion: 'Comprende modelos conceptuales, sus características y contextos de aplicación.',
                        evidencias: [
                            'Identifica y usa conceptos sociales básicos (económicos, políticos, culturales y geográficos).',
                            'Conoce el modelo de Estado Social de Derecho y su aplicación en Colombia.',
                            'Conoce la organización del Estado: funciones y alcances de las ramas del poder.',
                            'Conoce los mecanismos que los ciudadanos tienen para participar activamente en la democracia.'
                        ],
                        temas: [
                            { categoria: 'Conceptos', nombre: 'Económicos básicos', tip: 'Oferta, demanda, PIB, inflación, desempleo' },
                            { categoria: 'Conceptos', nombre: 'Políticos básicos', tip: 'Democracia, dictadura, república, soberanía' },
                            { categoria: 'Conceptos', nombre: 'Culturales y geográficos', tip: 'Identidad, territorio, nación, etnia' },
                            { categoria: 'Constitución', nombre: 'Estado Social de Derecho', tip: 'Art. 1 Constitución, derechos fundamentales' },
                            { categoria: 'Constitución', nombre: 'Ramas del poder público', tip: 'Ejecutiva, Legislativa, Judicial + Organismos de Control' },
                            { categoria: 'Constitución', nombre: 'Mecanismos de participación ciudadana', tip: 'Voto, tutela, referendo, plebiscito' }
                        ]
                    },
                    {
                        id: 'ps_af2',
                        descripcion: 'Comprende dimensiones espaciales y temporales de eventos, problemáticas y prácticas sociales.',
                        evidencias: [
                            'Localiza en el tiempo y en el espacio eventos históricos y prácticas sociales.',
                            'Relaciona dimensiones históricas y geográficas de eventos y problemáticas.',
                            'Relaciona problemáticas o prácticas sociales con características del espacio geográfico.'
                        ],
                        temas: [
                            { categoria: 'Historia', nombre: 'Historia de Colombia: períodos clave', tip: 'Conquista, Colonia, Independencia' },
                            { categoria: 'Historia', nombre: 'Siglo XX en Colombia', tip: 'Violencia, Frente Nacional, Constitución 91' },
                            { categoria: 'Geografía', nombre: 'Geografía de Colombia', tip: 'Regiones, recursos, fronteras, clima' },
                            { categoria: 'Geografía', nombre: 'Geografía mundial y geopolítica', tip: 'Globalización, bloques económicos' }
                        ]
                    }
                ]
            },
            {
                id: 'interpretacion_perspectivas',
                nombre: 'Interpretación y Análisis de Perspectivas',
                descripcion: 'Capacidad para contextualizar y evaluar usos de fuentes y argumentos desde múltiples perspectivas.',
                afirmaciones: [
                    {
                        id: 'ip_af1',
                        descripcion: 'Contextualiza y evalúa usos de fuentes y argumentos.',
                        evidencias: [
                            'Reconoce y compara perspectivas de actores y grupos sociales.',
                            'Reconoce que las cosmovisiones, ideologías y roles sociales influyen en diferentes argumentos.',
                            'Establece relaciones entre las perspectivas de los individuos en una situación conflictiva y las propuestas de solución.'
                        ],
                        temas: [
                            { categoria: 'Actores', nombre: 'Perspectivas de actores sociales', tip: 'Estado, guerrillas, paramilitares, víctimas' },
                            { categoria: 'Ideologías', nombre: 'Cosmovisiones e ideologías', tip: 'Liberalismo, conservadurismo, socialismo' },
                            { categoria: 'Conflictos', nombre: 'Resolución de conflictos', tip: 'Negociación, mediación, acuerdos de paz' }
                        ]
                    },
                    {
                        id: 'ip_af2',
                        descripcion: 'Evalúa usos sociales de las ciencias sociales.',
                        evidencias: [
                            'Analiza modelos conceptuales y sus usos en decisiones sociales.'
                        ],
                        temas: [
                            { categoria: 'Modelos', nombre: 'Modelos para decisiones sociales', tip: 'Políticas públicas, desarrollo, bienestar' }
                        ]
                    }
                ]
            },
            {
                id: 'pensamiento_sistemico',
                nombre: 'Pensamiento Sistémico y Reflexión Crítica',
                descripcion: 'Capacidad para comprender que los problemas involucran distintas dimensiones y reconocer relaciones entre estas.',
                afirmaciones: [
                    {
                        id: 'psr_af1',
                        descripcion: 'Comprende que los problemas y sus soluciones involucran distintas dimensiones y reconoce relaciones entre estas.',
                        evidencias: [
                            'Establece relaciones que hay entre dimensiones presentes en una situación problemática.',
                            'Analiza los efectos en distintas dimensiones que tendría una posible intervención.'
                        ],
                        temas: [
                            { categoria: 'Dimensiones', nombre: 'Política', tip: 'Gobernabilidad, corrupción, participación' },
                            { categoria: 'Dimensiones', nombre: 'Económica', tip: 'Pobreza, desigualdad, empleo' },
                            { categoria: 'Dimensiones', nombre: 'Cultural', tip: 'Identidad, discriminación, diversidad' },
                            { categoria: 'Dimensiones', nombre: 'Ambiental', tip: 'Recursos naturales, cambio climático' },
                            { categoria: 'Intervención', nombre: 'Análisis de políticas públicas', tip: 'Diseño, implementación, evaluación' }
                        ]
                    }
                ]
            }
        ]
    },

    matematicas: {
        nombre: 'Matemáticas',
        componentes: ['Numérico-Variacional', 'Geométrico-Métrico', 'Aleatorio'],
        competencias: [
            {
                id: 'interpretacion_representacion',
                nombre: 'Interpretación y Representación',
                descripcion: 'Comprende y transforma la información cuantitativa y esquemática presentada en distintos formatos.',
                afirmaciones: [
                    {
                        id: 'ir_af1',
                        descripcion: 'Comprende y transforma la información cuantitativa y esquemática presentada en distintos formatos.',
                        evidencias: [
                            'Da cuenta de las características básicas de la información presentada en diferentes formatos.',
                            'Transforma la representación de una o más piezas de información.'
                        ],
                        temas: [
                            { categoria: 'Gráficas', nombre: 'Lectura de gráficas estadísticas', tip: 'Barras, circulares, histogramas, líneas' },
                            { categoria: 'Tablas', nombre: 'Lectura e interpretación de tablas', tip: 'Frecuencias, doble entrada, series' },
                            { categoria: 'Funciones', nombre: 'Gráficas de funciones', tip: 'Lineales, cuadráticas, exponenciales' },
                            { categoria: 'Representación', nombre: 'Transformación entre representaciones', tip: 'Verbal ↔ Algebraica ↔ Gráfica ↔ Tabular' },
                            { categoria: 'Esquemas', nombre: 'Interpretación de esquemas y diagramas', tip: 'Flujo, Venn, árbol' }
                        ]
                    }
                ]
            },
            {
                id: 'formulacion_ejecucion',
                nombre: 'Formulación y Ejecución',
                descripcion: 'Frente a un problema que involucre información cuantitativa, plantea e implementa estrategias que lleven a soluciones adecuadas.',
                afirmaciones: [
                    {
                        id: 'fe_af1',
                        descripcion: 'Frente a un problema que involucre información cuantitativa, plantea e implementa estrategias que lleven a soluciones adecuadas.',
                        evidencias: [
                            'Diseña planes para la solución de problemas que involucran información cuantitativa o esquemática.',
                            'Ejecuta un plan de solución para un problema que involucra información cuantitativa o esquemática.'
                        ],
                        temas: [
                            { categoria: 'Álgebra', nombre: 'Ecuaciones lineales y sistemas 2x2', tip: 'Sustitución, igualación, eliminación' },
                            { categoria: 'Álgebra', nombre: 'Inecuaciones y desigualdades', tip: 'Resolver y graficar en recta numérica' },
                            { categoria: 'Álgebra', nombre: 'Factorización y productos notables', tip: 'Diferencia de cuadrados, trinomio' },
                            { categoria: 'Geometría', nombre: 'Cálculo de áreas', tip: 'Triángulo, círculo, trapecio, polígonos' },
                            { categoria: 'Geometría', nombre: 'Cálculo de volúmenes', tip: 'Prisma, cilindro, cono, esfera' },
                            { categoria: 'Geometría', nombre: 'Teorema de Pitágoras', tip: 'a² + b² = c²' },
                            { categoria: 'Trigonometría', nombre: 'Razones trigonométricas', tip: 'SOH-CAH-TOA: Sen=O/H, Cos=A/H, Tan=O/A' },
                            { categoria: 'Estadística', nombre: 'Medidas de tendencia central', tip: 'Media, mediana, moda' },
                            { categoria: 'Probabilidad', nombre: 'Probabilidad simple', tip: 'P = favorables / posibles' }
                        ]
                    }
                ]
            },
            {
                id: 'argumentacion',
                nombre: 'Argumentación',
                descripcion: 'Valida procedimientos y estrategias matemáticas utilizadas para dar solución a problemas.',
                afirmaciones: [
                    {
                        id: 'ar_af1',
                        descripcion: 'Valida procedimientos y estrategias matemáticas utilizadas para dar solución a problemas.',
                        evidencias: [
                            'Plantea afirmaciones que sustentan o refutan una interpretación dada a la información disponible.',
                            'Argumenta a favor o en contra de un procedimiento para resolver un problema.',
                            'Establece la validez o pertinencia de una solución propuesta a un problema dado.'
                        ],
                        temas: [
                            { categoria: 'Razonamiento', nombre: 'Validación de procedimientos', tip: 'Verificar pasos, revisar operaciones' },
                            { categoria: 'Razonamiento', nombre: 'Justificación de soluciones', tip: 'Explicar POR QUÉ funciona el método' },
                            { categoria: 'Razonamiento', nombre: 'Refutación con contraejemplos', tip: 'Un caso que no cumple invalida la regla' },
                            { categoria: 'Propiedades', nombre: 'De los números', tip: 'Primos, pares, divisibilidad: 2,3,5,9' },
                            { categoria: 'Propiedades', nombre: 'Geométricas', tip: 'Ángulos, paralelas, congruencia, semejanza' }
                        ]
                    }
                ]
            }
        ]
    },

    lectura: {
        nombre: 'Lectura Crítica',
        componentes: ['Literal', 'Inferencial', 'Crítico'],
        competencias: [
            {
                id: 'identificar_contenidos',
                nombre: 'Identificar y entender contenidos locales',
                descripcion: 'Identifica y entiende los contenidos locales que conforman un texto.',
                afirmaciones: [
                    {
                        id: 'ic_af1',
                        descripcion: 'Identifica y entiende los contenidos locales que conforman un texto.',
                        evidencias: [
                            'Entiende el significado de los elementos locales que constituyen un texto.',
                            'Identifica los eventos narrados de manera explícita en un texto y los personajes involucrados.'
                        ],
                        temas: [
                            { categoria: 'Semántica', nombre: 'Significado de palabras en contexto', tip: 'Sinónimos, antónimos, polisemia' },
                            { categoria: 'Semántica', nombre: 'Conectores lógicos', tip: 'Adversativos, causales, temporales' },
                            { categoria: 'Literal', nombre: 'Información explícita', tip: '¿Quién? ¿Qué? ¿Cuándo? ¿Dónde? ¿Cómo?' },
                            { categoria: 'Literal', nombre: 'Identificación de personajes y eventos', tip: 'Protagonistas, antagonistas, hechos principales' }
                        ]
                    }
                ]
            },
            {
                id: 'comprender_articulacion',
                nombre: 'Comprender la articulación del texto',
                descripcion: 'Comprende cómo se articulan las partes de un texto para darle un sentido global.',
                afirmaciones: [
                    {
                        id: 'ca_af1',
                        descripcion: 'Comprende cómo se articulan las partes de un texto para darle un sentido global.',
                        evidencias: [
                            'Comprende la estructura formal de un texto y la función de sus partes.',
                            'Identifica y caracteriza las diferentes voces o situaciones presentes.',
                            'Comprende las relaciones entre diferentes partes o enunciados de un texto.',
                            'Identifica y caracteriza las ideas o afirmaciones presentes en un texto informativo.',
                            'Identifica el tipo de relación existente entre diferentes elementos de un texto discontinuo.'
                        ],
                        temas: [
                            { categoria: 'Estructura', nombre: 'Estructura formal del texto', tip: 'Introducción, desarrollo, conclusión' },
                            { categoria: 'Tipologías', nombre: 'Texto narrativo', tip: 'Cuento, novela, crónica. Inicio-nudo-desenlace' },
                            { categoria: 'Tipologías', nombre: 'Texto argumentativo', tip: 'Ensayo, editorial. Tesis-argumentos-conclusión' },
                            { categoria: 'Tipologías', nombre: 'Texto expositivo', tip: 'Noticia, artículo científico' },
                            { categoria: 'Tipologías', nombre: 'Texto discontinuo', tip: 'Infografías, cómics, mapas' },
                            { categoria: 'Voces', nombre: 'Voces y situaciones', tip: 'Narrador, personajes, puntos de vista' },
                            { categoria: 'Ideas', nombre: 'Identificación de tesis', tip: 'Afirmación principal que defiende el autor' }
                        ]
                    }
                ]
            },
            {
                id: 'reflexionar_evaluar',
                nombre: 'Reflexionar y evaluar',
                descripcion: 'Reflexiona a partir de un texto y evalúa su contenido.',
                afirmaciones: [
                    {
                        id: 're_af1',
                        descripcion: 'Reflexiona a partir de un texto y evalúa su contenido.',
                        evidencias: [
                            'Establece la validez e implicaciones de un enunciado de un texto.',
                            'Establece relaciones entre un texto y otros textos o enunciados.',
                            'Reconoce contenidos valorativos presentes en un texto.',
                            'Reconoce las estrategias discursivas en un texto.',
                            'Contextualiza adecuadamente un texto o la información contenida en este.'
                        ],
                        temas: [
                            { categoria: 'Argumentación', nombre: 'Validez de argumentos', tip: '¿Las premisas apoyan la conclusión?' },
                            { categoria: 'Argumentación', nombre: 'Falacias argumentativas', tip: 'Ad hominem, generalización, hombre de paja' },
                            { categoria: 'Relaciones', nombre: 'Intertextualidad', tip: 'Referencias, alusiones, diálogo entre textos' },
                            { categoria: 'Valoración', nombre: 'Contenidos valorativos', tip: 'Juicios de valor, opiniones del autor' },
                            { categoria: 'Estrategias', nombre: 'Estrategias discursivas', tip: 'Persuasión, ironía, comparación, ejemplos' },
                            { categoria: 'Contexto', nombre: 'Contextualización histórica', tip: '¿Cuándo se escribió? ¿Qué pasaba?' },
                            { categoria: 'Intención', nombre: 'Intención comunicativa', tip: 'Informar, persuadir, entretener, criticar' }
                        ]
                    }
                ]
            }
        ]
    },

    ingles: {
        nombre: 'Inglés',
        componentes: ['A1', 'A2', 'B1', 'B+'],
        competencias: [
            {
                id: 'nivel_a1',
                nombre: 'Nivel A - Principiante (A1)',
                descripcion: 'Capacidad para comprender y utilizar expresiones cotidianas de uso frecuente.',
                afirmaciones: [
                    {
                        id: 'a1_af1',
                        descripcion: 'Comprende y utiliza expresiones cotidianas y frases sencillas para necesidades inmediatas.',
                        evidencias: [
                            'Es capaz de comprender y utilizar expresiones cotidianas de uso muy frecuente.',
                            'Puede presentarse a sí mismo y a otros, pedir y dar información personal básica.',
                            'Puede relacionarse de forma elemental siempre que su interlocutor hable despacio.'
                        ],
                        temas: [
                            { categoria: 'Vocabulario', nombre: 'Presentaciones personales', tip: 'My name is..., I am from..., I live in...' },
                            { categoria: 'Vocabulario', nombre: 'Familia y posesiones', tip: 'Mother, father, my house, my things' },
                            { categoria: 'Gramática', nombre: 'Verb TO BE', tip: 'I am, you are, he/she/it is, we/they are' },
                            { categoria: 'Vocabulario', nombre: 'Lugares de la ciudad', tip: 'School, hospital, park, bank, restaurant' }
                        ]
                    }
                ]
            },
            {
                id: 'nivel_a2',
                nombre: 'Nivel A2 - Básico',
                descripcion: 'Capacidad para comprender frases de uso frecuente y comunicarse en tareas simples.',
                afirmaciones: [
                    {
                        id: 'a2_af1',
                        descripcion: 'Comprende frases de uso frecuente y se comunica en tareas cotidianas simples.',
                        evidencias: [
                            'Es capaz de comprender frases y expresiones de uso frecuente relacionadas con áreas de experiencia relevantes.',
                            'Sabe comunicarse a la hora de llevar a cabo tareas simples y cotidianas.',
                            'Sabe describir en términos sencillos aspectos de su pasado y su entorno.'
                        ],
                        temas: [
                            { categoria: 'Gramática', nombre: 'Present Simple', tip: 'I work, she works. Rutinas y hábitos' },
                            { categoria: 'Gramática', nombre: 'Present Continuous', tip: 'I am working. Acciones en progreso' },
                            { categoria: 'Gramática', nombre: 'Past Simple', tip: 'Regulares: +ed. Irregulares: went, saw, ate' },
                            { categoria: 'Funciones', nombre: 'Invitaciones y sugerencias', tip: 'Would you like to...? Let\'s...' },
                            { categoria: 'Gramática', nombre: 'Comparativos y superlativos', tip: 'Bigger than, the biggest' }
                        ]
                    }
                ]
            },
            {
                id: 'nivel_b1',
                nombre: 'Nivel B1 - Pre-Intermedio',
                descripcion: 'Capacidad para comprender textos claros y desenvolverse en situaciones cotidianas.',
                afirmaciones: [
                    {
                        id: 'b1_af1',
                        descripcion: 'Comprende textos claros y produce textos coherentes sobre temas familiares.',
                        evidencias: [
                            'Es capaz de comprender los puntos principales de textos claros y en lengua estándar.',
                            'Sabe desenvolverse en la mayor parte de las situaciones que pueden surgir durante un viaje.',
                            'Es capaz de producir textos sencillos y coherentes sobre temas familiares.',
                            'Puede describir experiencias, acontecimientos, deseos y aspiraciones.'
                        ],
                        temas: [
                            { categoria: 'Gramática', nombre: 'Present Perfect', tip: 'Have/has + past participle. Experiencias' },
                            { categoria: 'Gramática', nombre: 'Modales: should, must, might', tip: 'Consejo, obligación, posibilidad' },
                            { categoria: 'Gramática', nombre: 'Condicionales 0, 1, 2', tip: 'If + present → will / If + past → would' },
                            { categoria: 'Gramática', nombre: 'Voz pasiva', tip: 'Be + past participle. The book was written' },
                            { categoria: 'Lectura', nombre: 'Inferencia en lectura', tip: 'Tono, intención, idea principal implícita' }
                        ]
                    }
                ]
            },
            {
                id: 'nivel_b2',
                nombre: 'Nivel B+ - Intermedio',
                descripcion: 'Capacidad para entender textos complejos y relacionarse con fluidez.',
                afirmaciones: [
                    {
                        id: 'b2_af1',
                        descripcion: 'Entiende textos complejos y se relaciona con fluidez y naturalidad.',
                        evidencias: [
                            'Es capaz de entender las ideas principales de textos complejos sobre temas concretos o abstractos.',
                            'Puede relacionarse con hablantes nativos con fluidez y naturalidad.',
                            'Puede producir textos claros y detallados sobre temas diversos.'
                        ],
                        temas: [
                            { categoria: 'Gramática', nombre: 'Third Conditional', tip: 'If + had + pp → would have + pp' },
                            { categoria: 'Gramática', nombre: 'Reported Speech', tip: 'He said that he was tired' },
                            { categoria: 'Gramática', nombre: 'Relative Clauses', tip: 'Who, which, that, whose, where' },
                            { categoria: 'Lectura', nombre: 'Lectura crítica en inglés', tip: 'Análisis de argumentos, tono, propósito' },
                            { categoria: 'Escritura', nombre: 'Escritura de ensayos', tip: 'Introduction, body paragraphs, conclusion' }
                        ]
                    }
                ]
            }
        ]
    }
};

// Función para obtener la estructura de una materia
function getEstructuraMateria(materia) {
    return SABER11_ESTRUCTURA[materia] || null;
}

// Función para obtener los componentes de una materia
function getComponentesMateria(materia) {
    const estructura = SABER11_ESTRUCTURA[materia];
    return estructura ? estructura.componentes : [];
}

// Función para obtener las competencias de una materia
function getCompetenciasMateria(materia) {
    const estructura = SABER11_ESTRUCTURA[materia];
    return estructura ? estructura.competencias : [];
}

// Función para obtener las afirmaciones de una competencia
function getAfirmacionesCompetencia(materia, competenciaId) {
    const competencias = getCompetenciasMateria(materia);
    const competencia = competencias.find(c => c.id === competenciaId);
    return competencia ? competencia.afirmaciones : [];
}

// Función para obtener las evidencias de una afirmación
function getEvidenciasAfirmacion(materia, competenciaId, afirmacionId) {
    const afirmaciones = getAfirmacionesCompetencia(materia, competenciaId);
    const afirmacion = afirmaciones.find(a => a.id === afirmacionId);
    return afirmacion ? afirmacion.evidencias : [];
}

// Función para obtener los temas de una afirmación
function getTemasAfirmacion(materia, competenciaId, afirmacionId) {
    const afirmaciones = getAfirmacionesCompetencia(materia, competenciaId);
    const afirmacion = afirmaciones.find(a => a.id === afirmacionId);
    return afirmacion ? afirmacion.temas : [];
}

// Exportar para uso global
window.SABER11_ESTRUCTURA = SABER11_ESTRUCTURA;
window.getEstructuraMateria = getEstructuraMateria;
window.getComponentesMateria = getComponentesMateria;
window.getCompetenciasMateria = getCompetenciasMateria;
window.getAfirmacionesCompetencia = getAfirmacionesCompetencia;
window.getEvidenciasAfirmacion = getEvidenciasAfirmacion;
window.getTemasAfirmacion = getTemasAfirmacion;
