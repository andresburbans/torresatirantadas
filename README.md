# Líneas & Tirantes · RUMBO3D

PWA de geometría de replanteo para torres atirantadas HVDC ±600 kV. Desarrollada con **TypeScript, Next.js y Tailwind CSS**, exportada a archivos estáticos para Cloudflare Pages. No requiere servidor de cálculo, API, base de datos ni fuentes externas.

## Ejecutar

Requiere Node.js 22.18 o posterior compatible con Next.js 16.

```powershell
npm ci
npm run dev
```

Para probar la **PWA real**, incluido el modo sin conexión:

```powershell
npm run build
npm run preview
```

Abrir `http://127.0.0.1:3000`. El service worker solo se registra en producción. No abrir `out/index.html` mediante `file://`.

```powershell
npm test
npm run typecheck
```

## Publicar en Cloudflare Pages

Ruta recomendada: **Workers & Pages → Create application → Continue to Pages → conectar GitHub**. El repositorio es [andresburbans/torresatirantadas](https://github.com/andresburbans/torresatirantadas).

### Despliegue automático desde GitHub

1. Abrir **Continue to Pages** y seleccionar **Connect to Git / Import an existing Git repository**.
2. Conectar GitHub y elegir **`andresburbans/torresatirantadas`**.
3. Crear el proyecto Pages, por ejemplo `torresatirantadas`, con estos ajustes:

| Ajuste | Valor |
| --- | --- |
| Production branch | `main` |
| Framework preset | Next.js (Static HTML Export), o ninguno |
| Build command | `npm run build` |
| Build output directory | `out` |
| Root directory | raíz del repositorio; dejar vacía |
| Node.js | `22.18.0`, fijado en `.node-version` |

Usar **`npm run build`**, porque después de Next.js genera el inventario completo de caché offline. Si el preset rellena otro comando, reemplazarlo. Pages no necesita un comando `wrangler deploy`, un servidor Next.js ni un adaptador SSR. La carpeta `out` se genera durante la compilación y no se guarda en Git.

4. Desplegar y comprobar la URL `pages.dev` asignada. Cada push a `main` podrá actualizar producción.
5. En **Custom domains → Set up a custom domain**, asociar **`lineastirantes.rumbo3d.com`**.
6. Seguir las indicaciones DNS y esperar a que el dominio y HTTPS estén activos. Si la zona está en Cloudflare, el asistente puede crear el CNAME. Con DNS externo, crear el CNAME indicado hacia el dominio `pages.dev` asignado al proyecto. Asociar primero el dominio en Pages; crear solamente un CNAME no basta.

Crear el commit en GitHub no conecta automáticamente el repositorio ni el dominio en tu cuenta de Cloudflare.

### Corregir un despliegue con 404

Si el registro dice **`No build command specified. Skipping build step.`**, Pages ha omitido la compilación. Un despliegue marcado como correcto solo confirma la carga de archivos; si se publicó la raíz del repositorio, no existe un `index.html` de la aplicación y la URL devuelve 404.

En el proyecto Pages existente, abrir **Settings → Build → Build configuration → Edit** y guardar:

- **Build command:** `npm run build`.
- **Build output directory:** `out` (también fijado por `pages_build_output_dir` en `wrangler.toml`).
- **Root directory:** vacía, para usar la raíz del repositorio.

Después ejecutar **Retry deployment** desde Deployments sobre el último commit de `main`. El registro debe mostrar la instalación de dependencias, `next build`, el mensaje `PWA: … archivos incluidos en caché de instalación` y la publicación de `out`. Comprobar que `/`, `/sw.js` y `/manifest.webmanifest` respondan correctamente.

`wrangler.toml` fija la carpeta publicada, pero **no configura el comando de compilación de la integración Git de Pages**. Ese comando se guarda una vez en el panel. No subir la raíz del repositorio ni seleccionar `.next` como salida.

### Plan gratuito y alternativa Workers

La aplicación sirve exclusivamente archivos estáticos y calcula en el dispositivo. Pages Free admite 500 compilaciones mensuales, 20.000 archivos por sitio y hasta 100 dominios personalizados por proyecto. Las solicitudes estáticas son gratuitas e ilimitadas. Este nivel de alojamiento es independiente de la renovación del dominio.

Workers Static Assets también sirve archivos estáticos gratis, sin coste adicional por almacenarlos; Workers Builds Free incluye 3.000 minutos de compilación mensuales. Para esta versión, Pages permite usar la configuración existente directamente. Workers es otra opción si después se requieren servicios de servidor; no hace falta migrar para esta entrega.

Fuentes: [Next.js estático en Pages](https://developers.cloudflare.com/pages/framework-guides/nextjs/deploy-a-static-nextjs-site/), [integración Git](https://developers.cloudflare.com/pages/configuration/git-integration/), [límites Pages](https://developers.cloudflare.com/pages/platform/limits/), [solicitudes estáticas](https://developers.cloudflare.com/pages/functions/pricing/), [dominios](https://developers.cloudflare.com/pages/configuration/custom-domains/), [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) y [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/).

### Carga directa opcional

Para carga manual, ejecutar `npm run build` y subir la carpeta `out` en un proyecto de carga directa. También se puede generar un ZIP con sus archivos directamente en la raíz:

```powershell
Compress-Archive -Path .\out\* -DestinationPath .\cloudflare-pages.zip -Force
```

El ZIP es un artefacto generado y no se incluye en Git. Para despliegue automático desde este repositorio, usar el flujo Git descrito arriba.

## Uso en terreno · cinco puntos por torre

La pantalla principal y Ajustes se dividen ahora en **Replanteo** y **Nivelación**. La barra inferior, también en laptop, contiene el identificador de torre de solo lectura, el selector T1–T4/M1 y el único botón Ajustes. La torre se elige en Ajustes → Torre y referencias. El estado de guardado e importar/exportar están en Ajustes → Archivos de torre.

Replanteo reúne distancia al borde, Hz, cero R41/R32 y posición ocupada E′/F′. Los diagramas y el ajuste de terreno se pueden mostrar u ocultar independientemente, y empiezan ocultos. Ocultar o cambiar de pestaña no borra sus valores. Los ajustes de diseño, coordenadas, φ/C y armado están en la pestaña Replanteo del panel. Nivelación reúne vista (−) al sello, HI, sello efectivo, lectura actual y control de excavación; su pestaña de Ajustes contiene referencia, vista (+) y cinco sellos. El signo positivo con ↓ indica falta de excavación; el negativo con ↑, exceso. Diferencias menores de 0,0005 m se muestran como En sello.

Elegir un suelo o pulsar Aplicar diseño restaura su par tabulado X₀/H₀ y la profundidad objetivo H₁ = H₀, manteniendo C, sellos y K. Para GI6KL y α = 5°: S3 → H₀/H₁ 3,500 m y X₀/X₁ 2,117 m; S4 → 4,000 m y 2,460 m. Las demás familias y pendientes usan sus propias tablas. Después se puede personalizar la profundidad, X o sello en el ajuste de terreno. Actualizar una sesión anterior conserva sus objetivos personalizados.

La posición **ocupada** se guarda aparte del pivote **de diseño** de cada tirante. Cambiar de E′ a F′ conserva el borde físico calculado y obtiene desde el pivote realmente ocupado su azimut, distancia horizontal y giro al amarre. Si coincide con el pivote de diseño, la distancia es C + X₁ + K; desde el otro se muestra la distancia al mismo borde + K. En modo por eje se usa la separación 2e; con N/E reales se usan las coordenadas de ambos pivotes. No se invierte la numeración ni se traslada el anclaje al cambiar la estación. M1 no recibe K. Las sesiones de esquema 2 anteriores incorporan las pestañas y la posición automática sin perder mediciones.

La versión 2 guarda **T1, T2, T3, T4 y M1** como fichas independientes. El selector recupera su resultado antes de los diagramas. «Mostrar/Ocultar diagramas» conserva la preferencia. El diseño sigue priorizando smartphones de 360–430 px, controles de 44 px, entradas de 16 px o más y áreas seguras iOS.

1. Abrir con conexión desde el dominio que se usará en campo y esperar «Disponible sin conexión» en (?). Instalar desde Chrome/Edge o desde Safari → Compartir → Añadir a pantalla de inicio.
2. Abrir **Ajustar** y cargar torre, suelo S3/S4, fila α, β común, e y K. Elegir suelo o Aplicar diseño carga X₀/H₀ y restablece la profundidad objetivo en los cuatro tirantes. Cambiar familia o fila conserva los objetivos personalizados. También puede elegirse suelo para un solo tirante en el ajuste de terreno.
3. En Ajustes → Nivelación introducir las cinco cotas de sello de diseño, la referencia del nivel (R41/R32), su Z y la vista (+). HI = Z + vista (+). Si se mueve el nivel, renovar esa lectura.
4. Introducir C y φ propios de cada tirante. T2–T4 heredan φ de T1 hasta que se editan individualmente; se pueden volver a vincular.
5. Configurar el armado y el cero de la estación. El modo inicial **por cuadrantes** usa R41 norte y R32 sur, con F′→E′ apuntando al sur. Los desplegables empiezan en F′ / R41. Para amarres fuera del eje se puede elegir **por coordenadas**, que necesita N/E de E′, F′ y del amarre elegido.
6. Seleccionar el punto en la barra inferior. Replanteo muestra distancia y Hz; Nivelación muestra mira al sello, HI y sello efectivo. La profundidad, proyección o sello del tirante se puede cambiar mostrando el ajuste de terreno.
7. La vista actual de mira sobre terreno/fondo es opcional: diferencia positiva = falta excavar; negativa = exceso de excavación.
8. En Ajustes → Archivos de torre, **Exportar torre** conserva las cinco fichas, referencias y resultados en un JSON. **Importar torre o caso** admite esa torre y los antiguos casos individuales. Se conserva el tirante antiguo sin inventar C para los otros puntos.

Ajustar guarda al escribir. Guardar, ×, Escape y tocar fuera guardan y cierran. Los campos incompletos se conservan; las salidas que los necesitan permanecen en «—». La sesión antigua se migra a una clave nueva de almacenamiento, manteniendo intacta la copia anterior.

**Catálogo de amarres:** Ajustes integra búsqueda de torre en «Torre y referencias» y las coordenadas en su pestaña Replanteo. Contiene los 316 puntos suministrados para 148 torres, con sus N/E/Z a tres decimales, descripción y fecha originales, en `src/data/tower-references.json`. Funciona sin conexión porque se compila en la app. En Torre y referencias buscar `574`, `T574` o `T274A` y pulsar el resultado carga las RF41/RF32 identificadas de forma única. No se deduce familia, suelo, pivotes ni cotas de sello a partir del número. Los demás parámetros se conservan y deben revisarse al cambiar de torre. Una nueva torre o un cambio de Z del amarre del nivel vacía la vista (+).

Las coordenadas se bloquean al abrir Ajustes, incluida la Z repetida en Nivelación. «Habilitar edición» permite modificarlas manualmente; se guardan como antes. El bloqueo es de interfaz para evitar toques, no un control de acceso. No se modifica el esquema de los archivos exportados ni de las sesiones anteriores.

No se inventan asignaciones en datos ambiguos: T305–T308, T317, T322, T327 y T328 ofrecen alternativas `_1`/`_2` para escoger. T251, T476 y T480 tienen dos RF41 y ninguna RF32 identificada; T320 tiene una RF41 y dos puntos sin etiqueta de amarre; T321 tiene cuatro puntos sin identificar. T311 conserva también su punto `RfN` como consulta. Las referencias ambiguas o ausentes quedan vacías al seleccionar la torre, evitando heredar coordenadas de otra. Elegir una alternativa carga sus coordenadas; los puntos no identificados se consultan sin asignarlos automáticamente.

La convención inicial de los planos es **F′ para T1/T4, E′ para T2/T3; T1/T2 a −X**. El croquis de obra confirmado muestra el sur arriba y el norte abajo: +Y va de F′ hacia E′ (sur en Cuadrantes), y +X queda a su derecha. La pareja y el lado transversal siguen siendo editables para otras fichas. Por coordenadas se usa el eje N/E real. Se deben comprobar con la ficha real. Ver [docs/TORRE-CAMPO.md](docs/TORRE-CAMPO.md).

La planta utiliza los datos independientes de cada tirante. Sus coordenadas corresponden al borde C + X₁, sin K. Las N/E reales deben pertenecer al mismo sistema y unidad; no se transforman datum ni husos. M1 usa sus N/E o, si ambas están vacías, el punto medio E′–F′ expresamente identificado.

Probar apertura y cálculo en modo avión antes de salir. Borrar datos del sitio, usar navegación privada o una limpieza del almacenamiento pueden eliminar caché y sesión; conservar la exportación JSON. La instalación en un dispositivo iOS/Android físico no se ha verificado desde este entorno.

## Actualizaciones

Cada commit compilado por Pages utiliza `CF_PAGES_COMMIT_SHA` como identificador de versión (en local, `git rev-parse HEAD`). **Nueva versión** presenta las altas, bajas o cambios descritos en `src/data/release-notes.json`. Al preparar un commit para publicar, actualizar ese resumen en español para que corresponda al cambio publicado. No se consultan GitHub ni servicios externos desde el dispositivo.

El aviso aparece una vez por fecha local durante siete fechas, contadas desde el primer uso de esa versión. Cerrar con ×, Escape, fuera del cuadro o Entendido no lo repite ese día. «No volver a mostrar» lo oculta para ese commit; un commit distinto inicia su propio aviso. La preferencia se guarda aparte de los datos de torre y funciona offline. Se comprueba también al regresar a la app y al cambiar de día con ella abierta. Si el navegador impide guardar preferencias, se conservan durante esa visita, pero no se garantiza recordarlas tras cerrar o recargar.

Cada compilación produce un nombre de caché según el contenido. La instalación solo se completa si todos los archivos se guardan correctamente. La app comprueba actualizaciones al abrir, al recuperar conexión, al volver a estar visible y cada 15 minutos mientras está visible. Al completar la descarga, la nueva versión se activa y navega las ventanas abiertas a su misma URL para recargar el código nuevo automáticamente, sin Ctrl + F5 ni cerrar pestañas. La caché conserva los archivos con hash de la versión anterior durante la transición. La primera instalación no fuerza una recarga. El HTML se sirve con cabeceras de revalidación; sin conexión se utiliza la última versión completa guardada. Las sesiones JSON y el almacenamiento local se conservan. Las versiones anteriores sin K se recuperan asignando 0,10 m; los casos nuevos incluyen K y la distancia total además de la distancia geométrica al borde.

No hay analítica, peticiones de cálculo, CDNs de interfaz ni subida de los casos. Los PDFs originales no se publican; solo se incluyen las tablas transcritas y la identificación de las láminas.

## Guía de campo

En **(?) → Ver fórmulas y referencias** hay una guía de 15 apartados, disponible offline. Explica el mástil y los cuatro tirantes, las clases de suelo 3/4 y los parámetros de la Tabla 2 de GI6KL, las diferencias por torre, los ángulos y sus unidades, otras pendientes además de 5°, todos los campos, las fórmulas, cotas de sello, ejemplos a 5° y 10°, K, coordenadas y actualización PWA. Distingue los datos de los planos de las hipótesis geométricas y de las decisiones de diseño de obra.

## Geometría y planos

Ver [docs/CALCULOS.md](docs/CALCULOS.md). Motor en `src/lib/geometry.ts`; referencias en `src/lib/catalog.ts`.

Las correcciones suponen C y β fijos, pendiente constante si corresponde y el mismo prefabricado con la misma geometría de inserción de barra. Un cambio de tipo de suelo no constituye por sí solo autorización para modificar la fundación; la app calcula la posición geométrica del ajuste indicado.

## Archivos

- `src/app`: interfaz y estilos.
- `src/components/diagram.tsx`: perfil, anclaje y planta SVG.
- `src/lib`: geometría de anclaje, modelo de torre, orientación, nivelación y tablas de seis láminas.
- `scripts/build-sw.mjs`: inventario de archivos y caché versionada.
- `public`: manifiesto, iconos y cabeceras para Pages.
- `tests`: comprobación geométrica y contrato de caché offline.
- `out`: exportación estática generada.

TypeScript se compila a JavaScript para el navegador. La lógica se escribe y verifica en TypeScript; no es necesario mantener una segunda versión manual en JavaScript. Los scripts de construcción y la plantilla del service worker son JavaScript de infraestructura.
