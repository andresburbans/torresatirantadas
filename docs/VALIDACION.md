# Validación de la entrega

Comprobado en el entorno local del proyecto:

- `npm run build`: exportación estática correcta; todas las rutas son estáticas.
- TypeScript estricto: compilación correcta.
- `npm test`: 26 pruebas correctas. Incluyen 27 transiciones entre los suelos 3 y 4 y las nueve pendientes de cada familia.
- Las diferencias frente a las X tabuladas son inferiores a 1,1 mm, considerando su redondeo.
- Navegador de escritorio: perfil, planta, carga de G6KL, tabla y exportación de caso JSON verificados.
- Diseño prioritario para smartphone: verificado en anchos de 360, 393 y 430 px; revisión adicional en 768 px y laptop de 1366 px. Sin desbordamiento horizontal de la página o del dibujo.
- Controles móviles de al menos 44 × 44 px, campos de 16 px o más, anclaje adaptado al ancho y barra inferior con total del punto y mira al sello.
- Acceso «Ajustar» y botones de profundidad comprobados: el resultado principal y la barra inferior se actualizan juntos.
- K editable, valor inicial 0,10 m: verificado con 0, 0,10 y 0,20 m, coma decimal, persistencia tras recarga, conservación al cargar referencias y migración de sesiones anteriores. Cambiar K solo cambia el total, manteniendo X₁, H₁, ΔX y coordenadas del borde.
- Cabecera reducida a icono, nombre, instalar y ayuda. Resumen emergente de la app comprobado en móvil; el estado offline se consulta dentro de la ayuda.
- Guía de campo: 13 apartados desplegables y tablas legibles en móvil, con desplazamiento horizontal interno y sin desbordamiento del modal.
- Actualización PWA automática verificada desde una versión anterior con dos ventanas abiertas: recarga normal, activación al completar la caché y recarga de ambas ventanas sin Ctrl + F5 ni cerrarlas. K = 0,20 m, H₁ = 4,20 m y total 29,016 m conservados. La primera instalación no fuerza recarga; una descarga incompleta no sustituye la versión offline. Se conserva la caché anterior para servir archivos con hash durante la transición.
- Comprobación de actualización al recuperar conexión, reanudar la app y por intervalo; prueba de aislamiento de cachés entre versiones.
- Prueba offline real del paquete: servidor HTTP detenido, fallo de conexión confirmado desde fuera del navegador, recarga correcta desde service worker y cálculo de profundidad → X / X → profundidad sin servidor.
- Entrada por cota de sello: Zt₀ = 100 m, Zs₁ = 96 m devuelve X₁ = 2,440 m, H₁ local = 3,972 m y H₁ con datum fijo = 4,000 m.
- En el ejemplo, H₁ = 3,50 m devuelve X₁ = 2,117 m. La operación inversa con X₁ redondeada a 2,460 m devuelve H₁ = 4,001 m; la diferencia milimétrica es consecuencia del redondeo de la referencia.
- ZIP inspeccionado: `index.html`, `_next/static`, `sw.js`, manifiesto, iconos y `_headers` presentes en la raíz esperada.

La versión base se verificó publicada en torresatirantadas.pages.dev después de corregir el comando de build y la salida out. El dominio personalizado sigue pendiente. No se ha comprobado la instalación en un dispositivo Android/iOS físico. La distancia total de campo es C + X₁ + K; la proyección X₁ y las coordenadas locales conservan la geometría del borde con C + X₁. Los casos anteriores se recuperan descartando el antiguo desplazamiento al centro.

La prueba de teléfono corresponde al tamaño de pantalla emulado en navegador.

Capturas: `docs/screenshots/mobile-393.png` y `docs/screenshots/desktop.png`. Cambio de K: `docs/screenshots/mobile-k.png`. Ayuda ampliada: `docs/screenshots/guia-campo-mobile.png`.

Captura de actualización: `docs/screenshots/actualizacion-pwa.png`.

## Versión 2 · torre con cinco puntos

- Motor de anclaje anterior conservado y sus pruebas intactas.
- Modelo de cinco fichas: cambio T1/T2 conserva C, objetivo y lectura propios; M1 conserva sello y objetivo independientes.
- φ: T2/T4 heredan T1, una edición en T2 solo modifica T2, y la casilla de herencia lo vuelve a vincular.
- Nivel: referencia 100,000 m + vista (+) 1,500 m → HI 101,500 m. M1 con sello 98,000 m → mira 3,500 m. Lectura actual 2,500 m → falta 1,000 m.
- Cinco cotas de prueba ingresadas desde Ajustar. Sello de T1 de diseño 96,500 m y ajuste H₁ = 4,000 m → mira efectiva 5,530 m, mientras se conserva el sello de diseño.
- En la convención editable T1/T4 en E′ y T1 al lado +X, φ = 35°27′: cero R41 → T1 54°33′; cero R32 → T1 234°33′. Cambiar el cero no cambia HI ni la mira objetivo.
- Coordenadas sintéticas con R41 fuera de eje: giro de T1 31°21′58,39″, consistente con la visual desde E′, no desde el centro de torre.
- Guardado con ×, Guardar y recarga comprobado. Los valores incompletos permanecen editables.
- Exportación e importación esquema 2 comprobadas con cinco puntos y referencias; se restaura C tras modificarla y las fichas conservan sus objetivos propios.
- Importación y migración de esquema 1 cubiertas por pruebas: conserva el caso activo y no inventa C de los otros tirantes; usa la tabla correcta para las otras referencias de la familia.

Las coordenadas de prueba son sintéticas. La configuración inicial conserva F′ para T1/T4, E′ para T2/T3 y el lado de los planos; ambas opciones pueden editarse. Se usa por defecto el modo por coordenadas y se muestran resultados pendientes hasta completarlas. La convención debe comprobarse con la ficha de obra.

- Compilación final estática y TypeScript correctos. La guía tiene 15 apartados y permanece disponible offline.
- Revisión responsive en 360, 393, 430 y 1366 px: sin desbordamiento de página ni de las tarjetas, incluidas cotas de cuatro dígitos (2253,000 m). Popup Ajustar sin desbordamiento horizontal.
- Cambiar la referencia del nivel vacía vista (+); HI queda pendiente hasta introducir la nueva lectura. Cambiar el cero de la estación no altera esa vista.
- Prueba final con servidor detenido y conexión HTTP fallida: recarga desde caché, distancia 28,779 m, giro 31°21′58,39″ y mira 5,530 m. M1 recupera mira 3,500 m y falta de excavación 1,000 m. T2 conserva H₁ = 3,80 m y lectura 2,00 m. Diagramas ocultos conservados tras recarga.
- Capturas actuales: `docs/screenshots/torre-mobile.png`, `docs/screenshots/mastil-mobile.png` y `docs/screenshots/ajustar-mobile.png`. Los datos mostrados son un ejemplo DEMO con coordenadas sintéticas.

## Catálogo de coordenadas · 19 octubre 2026

- Incorporados los 316 registros originales para 148 torres. N/E/Z conservados como texto con tres decimales; descripciones y fechas sin reinterpretar. Siete puntos carecen de identificación RF41/RF32 y permanecen como consulta.
- Cuatro pruebas nuevas verifican integridad del catálogo, búsqueda normalizada (incluida T274A), selección, compatibilidad con esquema 2, conservación de datos de proyecto, renovación de vista (+) y tratamiento de referencias duplicadas/ausentes. Total: 30 pruebas correctas; compilación estática y TypeScript correctos.
- Interfaz: buscar y seleccionar T574 precarga RF41 N 7250330.350 / E 430641.386 / Z 2252.033 y RF32 N 7250277.301 / E 430645.250 / Z 2253.679. Todas las coordenadas y la Z duplicada en Nivel están en modo solo lectura inicialmente. No existe el apartado 05: las cinco ternas están en 01.
- Habilitar edición, cambiar E de RF41, cerrar con × y reabrir conserva la edición y vuelve a bloquearla. Repetir selección de catálogo repone los valores suministrados. T305 queda sin selección inicial por duplicados; escoger RF41_2 carga N 7385378.140 manteniendo el bloqueo manual.
- Revisado sin desbordamiento horizontal a 360 y 393 px y a 1366 px; campos móviles a 16 px o más. Capturas: `buscar-torre-mobile.png`, `referencias-bloqueo-mobile.png` y `referencias-mobile.png` en `docs/screenshots`.
- Prueba con servidor de vista previa detenido y HTTP inaccesible: recarga desde caché, búsqueda de T588 no utilizada previamente y precarga de RF41 N 7243220.178 / RF32 Z 2413.041 correctas. Campos bloqueados, anchura del área de ajustes y contenido iguales (352 px). El catálogo forma parte del JavaScript precargado; no depende de un servicio externo.

## Aviso por versión y nombre Ajustes

- «Ajustar» pasa a «Ajustes» en ambos botones, título del panel, ayuda y mensajes que remiten al panel.
- Cada compilación incluye el identificador del commit; el aviso y sus preferencias se renuevan cuando cambia ese identificador. El resumen en español está en `src/data/release-notes.json` y se actualiza con cada cambio publicado.
- Cuatro pruebas nuevas cubren una aparición por fecha local, persistencia entre recargas, siete fechas incluyendo el primer día, caducidad sin reinicio en visitas tardías, exclusión voluntaria, nueva versión, fechas inválidas y cruce de mes. Total: 34 pruebas correctas; compilación estática y TypeScript correctos.
- Navegador: aparece «Nueva versión», se puede marcar «No volver a mostrar» y cerrar con Entendido; recargar el mismo día no lo repite. El botón principal abre «Ajustes de torre». El popup incorpora foco inicial, ciclo de tabulación y cierre por Escape o fondo.
- Segunda sesión: cerrar solo con ×, sin marcar la casilla, y recargar tampoco lo repite ese día. Recarga con servidor detenido: cálculo 28,779 m disponible desde caché y aviso sin repetición. Vista móvil de 393 × 852 px, diálogo de 369 px y página de 393 px sin desbordamiento.
- Captura: `docs/screenshots/nueva-version-mobile.png`.

## Replanteo / Nivelación · reorganización móvil

- Pantalla y panel Ajustes separados en pestañas accesibles por teclado. La barra inferior permanece disponible en móvil y laptop: torre de solo lectura, punto T1–T4/M1 y un único botón Ajustes. No contiene resultados duplicados. Guardado e importar/exportar quedan en Archivos de torre dentro del panel.
- Las sesiones anteriores de esquema 2 se recuperan con Replanteo, ajuste de terreno oculto y posición automática de diseño; conservan las profundidades, sellos y lecturas existentes. Las nuevas preferencias y la posición ocupada se guardan/exportan con la torre.
- Posición E′/F′ independiente del pivote de diseño. Cuatro tirantes, dos posiciones y dos amarres verificados con coordenadas fuera de eje: mismo borde físico, distancia desde el pivote ocupado + K y giro horario a la visual real. Modo por eje comprobado contra coordenadas alineadas. M1 sigue usando distancia sin K.
- Elegir suelo carga diseño y objetivo: GI6KL a 5°, S3 H₀/H₁ 3,500 m, X 2,117 m; S4 4,000 m y 2,460 m. El ajuste personalizado 4,200 m se conserva al ocultar y mostrar el ajuste de terreno o cambiar de pantalla. Elegir S3 lo restablece a 3,500 m; C y sellos se conservan. Las otras familias siguen sus tablas.
- Demostración sintética DEMO: C 26,219 m, X 2,117 m, K 0,100 m → 28,436 m desde F′; Hz R41 234°33′, R32 54°33′. Desde E′ se obtiene 32,710 m y 225°03′36,77″ hacia el mismo borde, sin moverlo.
- Nivelación DEMO: HI 101,500 m, sello 96,500 m → mira 5,000 m. Lectura 4,000 m → +1,000 m ↓, Falta excavar. Lectura 5,500 m → −0,500 m ↑, Exceso de excavación. M1 con sello 98,000 m y lectura 2,500 m → mira 3,500 m y +1,000 m ↓.
- La pestaña de Ajustes se abre según la tarea actual; al cambiarla vuelve al comienzo de su contenido. Las secciones de la otra tarea no se ven ni entran en el recorrido de foco. La búsqueda de T476 actualiza la torre de solo lectura; referencias ambiguas continúan requiriendo elección.
- Sin desbordamiento a 360, 393, 430 y 1366 px; cotas grandes 2254,500 / 2250,000 m verificadas. Cambiar Z de referencia vacía vista (+), como antes. La vista Nivelación de 393 × 852 px reúne resultados y control de excavación sobre la barra fija.
- Con servidor detenido y HTTP inaccesible, recarga recupera Nivelación con mira 5,000 m, +1,000 m ↓ y ajuste oculto. Cambiar a Replanteo y ocupar E′ conserva los resultados 32,710 m y 225°03′36,77″ desde la caché.
- Total: 40 pruebas correctas, TypeScript y compilación estática correctos; 30 recursos en precarga PWA. Capturas de prueba DEMO: `replanteo-tabs-mobile.png`, `nivelacion-tabs-mobile.png`, `nivelacion-exceso-mobile.png`, `ajustes-nivelacion-tabs-mobile.png` en `docs/screenshots`.

## Corrección de cuadrantes · R41 norte / R32 sur

- Croquis confirmado: sur arriba, norte abajo; F′ para T1/T4 y E′ para T2/T3. El eje local +Y = F′→E′ apunta al sur. El error anterior del modo por eje consistía en tratar R41 como si estuviera hacia ese +Y.
- Se convierte la dirección local a azimut referido al norte antes de restar la visual del cero: R41 = 0°, R32 = 180°. Los ocho giros se comprobaron tanto en pruebas como mediante los desplegables reales con φ = 35°27′00″:

| Armado | Tirante | 0° R41 norte | 0° R32 sur |
| --- | --- | --- | --- |
| F′ | T1 | 54°33′00″ | 234°33′00″ |
| F′ | T4 | 305°27′00″ | 125°27′00″ |
| E′ | T2 | 125°27′00″ | 305°27′00″ |
| E′ | T3 | 234°33′00″ | 54°33′00″ |

- En el dibujo, T3/E′/R41 se corrige a 270° − φ. La lógica propuesta para R32 coincide con los cuatro resultados. Tabla de los ocho giros incorporada a la guía; la tabla de Ajustes usa el pivote de diseño de cada tirante.
- Dos desplegables en Replanteo: F′/E′ y R41 · Norte/R32 · Sur. Valores iniciales F′/R41 y modo Cuadrantes. Recarga tras elegir E′/R32 recupera ambas elecciones y 54°33′ para T3.
- La migración a `orientationVersion: 2` aplica una sola vez Cuadrantes/F′/R41 a sesiones anteriores. Conserva coordenadas, φ, profundidades, cotas, lecturas y referencia/altura instrumental del nivel. La elección posterior de modo por coordenadas, posición y cero se conserva en nuevas sesiones y exportaciones. Cálculo N/E de amarres fuera de eje sin alterar.
- Concordancia de Hz, azimutes y distancias entre Cuadrantes y coordenadas alineadas en ambas estaciones. Se mantienen las pruebas de traslado al mismo borde y de coordenadas fuera de eje.
- Sin desbordamiento de los desplegables a 360, 393 y 1366 px. Planta identifica R32 · Sur arriba (y=24) y R41 · Norte abajo (y=309) en modo Cuadrantes.
- Con servidor detenido y HTTP inaccesible: recarga mantiene E′/T3/R32 = 54°33′; elegir F′/T1/R32 produce 234°33′ y 28,436 m desde caché.
- Total: 43 pruebas correctas, TypeScript y compilación estática correctos, 30 recursos PWA. Capturas: `docs/screenshots/angulos-r41-mobile.png` y `docs/screenshots/angulos-r32-mobile.png`.

## Factor informativo R41–R32 · 19 octubre 2026

- Alcance ajustado a la última indicación del usuario: un solo factor `Dmedida / Dteórica`, calculado con N/E de R41/R32 y una observación horizontal. No se agrega transformación de coordenadas, cálculo automático de pivotes ni corrección de otras medidas.
- Distancia teórica 2D sin Z y sin redondeo intermedio; nueve decimales para mostrar el factor. Se aceptan coma y punto decimal. Distancias vacías, no positivas, referencias incompletas/coincidentes y resultados no finitos impiden presentar una escala válida. No se fuerza un resultado inferior a 1.
- Se agrega en Ajustes → Replanteo y, si está completo, como resumen discreto en Replanteo. No se expone un segundo factor ni ppm. Guía offline con fórmula, ejemplo y alcance; novedades actualizadas.
- La medición se guarda con esquema 2 y su JSON. Migración de sesiones antiguas agrega únicamente `baselineDistance: ''`. Cambiar torre o N/E de los amarres vacía la observación; cambiar solo Z conserva la medición de escala y mantiene la invalidación anterior de la vista (+) del nivel.
- Se comparan los resultados completos de geometría, orientación, nivelación, planta y coordenadas antes/después de distintas observaciones: 4 tirantes y M1, ambos modos de orientación, E′/F′ y ambos ceros. C + X₁ + K y todas las salidas son idénticas. Los motores de geometría, ángulos y nivelación conservan sus fórmulas.
- Prueba móvil con catálogo T574: Dteórica = 53,189537 m mostrados; Dmedida = 53,180 m → factor 0,999820689. Se mantienen distancia 28,436 m y Hz 54°33′00″. Cambiar Z no elimina el factor; cambiar N/E vacía la lectura medida y retira el factor de la pantalla principal.
- Disponible sin conexión confirmado en la ayuda. Con servidor de prueba detenido y HTTP inaccesible, recarga recupera factor, torre y datos. Cambiar offline la medición a 53,170 m recalcula 0,999632682, manteniendo 28,436 m y 54°33′.
- Sin desbordamiento horizontal a 360, 393, 430 y 1366 px de viewport. Capturas: `docs/screenshots/escala-ajustes-mobile.png` y `docs/screenshots/escala-replanteo-mobile.png`.
- Total: 49 pruebas correctas, TypeScript y compilación estática correctos, 30 recursos de precarga PWA.

## Versión visible y crédito · 20 octubre 2026

- Versión visible 2.0.1 con formato mayor.menor.parche; fuente única `package.json`, importada por `src/lib/app-info.ts`, y lockfile sincronizado. El aviso conserva por separado su identidad de deploy basada en commit: no cambia su frecuencia de una vez al día por siete fechas ni la opción de no mostrar otra vez.
- Crédito exacto «Creada por Andrés Burbano (c) 2026» en el aviso y al final del footer. El pie muestra también v2.0.1. Novedades actualizadas para este cambio.
- Revisión visual del aviso a 393 × 852 px y del pie mediante scroll; sin desbordamiento horizontal a 360 y 1366 px. Capturas `version-2-0-1-mobile.png` y `credito-footer-mobile.png` en `docs/screenshots`.
- 49 pruebas correctas, compilación estática y TypeScript correctos, 30 recursos de precarga PWA. No se modifican cálculos, datos de torre ni mecanismos de caché/actualización.
- Configuración iOS revisada: manifiesto standalone, metadatos Apple, apple-touch-icon y viewport con safe area presentes. Instalación documentada con Safari → Compartir → Añadir a pantalla de inicio. No se dispone de prueba en Safari/iPhone físico en este entorno.
