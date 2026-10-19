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
