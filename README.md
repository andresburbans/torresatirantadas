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

## Uso en terreno

La interfaz prioriza smartphones: anclaje adaptado al ancho de pantalla, botones táctiles de al menos 44 px y entradas numéricas de 16 px o más. La barra inferior muestra X₁ y C + X₁ durante el desplazamiento; «Ajustar» lleva a los controles de campo. Se oculta al editar un campo para dejar espacio al teclado. Las áreas seguras de iOS se respetan mediante `viewport-fit=cover` y `safe-area-inset`.

Perfil, anclaje y planta caben en el ancho móvil. La planta muestra sus coordenadas en casillas legibles debajo del dibujo. En laptop se conserva el dibujo con resultados laterales. Los cálculos continúan usando exclusivamente el borde de la viga.

1. Abrir la app con conexión desde **el dominio que se usará en campo**.
2. Esperar la indicación **Disponible sin conexión**. Se muestra después de guardar todos los archivos de la versión.
3. Instalar desde Chrome/Edge o, en Safari para iOS, Compartir → Añadir a pantalla de inicio.
4. Probar una apertura y un cambio de profundidad en modo avión antes de salir.
5. Completar C, β, e y φ del tirante específico. Los valores iniciales son un ejemplo T574, no una asignación automática por tipo de torre.
6. Seleccionar torre, suelo y α de referencia y pulsar **Cargar referencia** si se quiere usar la Tabla 1. Esto reemplaza X₀, H₀, α y β; conserva C, e, φ y el objetivo.
7. Elegir datum de profundidad y calcular desde H₁, X₁ o la nueva cota de sello.

La última sesión se guarda localmente. **Exportar caso** guarda un JSON con entradas, resultados y referencia; **Importar caso** lo recupera. El dibujo se descarga como SVG.

Los datos de cada tirante no se guardan como cuatro fichas independientes: el selector T1–T4 identifica el caso activo y el cuadrante de la planta. Para conservar varios tirantes, exportar un archivo por caso. La planta refleja una geometría simétrica ilustrativa a partir del C y φ activos, no presume que los cuatro C sean iguales en la torre real.

El modo offline no depende de que el sistema operativo conceda almacenamiento permanente. Borrar los datos del sitio, la navegación privada o la limpieza de almacenamiento del dispositivo pueden eliminar la caché o la sesión. Conservar los casos exportados.

## Actualizaciones

Cada compilación produce un nombre de caché según el contenido. La instalación solo se completa si todos los archivos se guardan correctamente. La nueva versión espera a que se cierren las ventanas de la versión anterior, para evitar mezclar archivos. Abrir con conexión, cerrar las ventanas de la PWA y volver a abrir permite activar la actualización descargada. Las sesiones JSON y el almacenamiento local se conservan.

No hay analítica, peticiones de cálculo, CDNs de interfaz ni subida de los casos. Los PDFs originales no se publican; solo se incluyen las tablas transcritas y la identificación de las láminas.

## Geometría y planos

Ver [docs/CALCULOS.md](docs/CALCULOS.md). Motor en `src/lib/geometry.ts`; referencias en `src/lib/catalog.ts`.

Las correcciones suponen C y β fijos, pendiente constante si corresponde y el mismo prefabricado con la misma geometría de inserción de barra. Un cambio de tipo de suelo no constituye por sí solo autorización para modificar la fundación; la app calcula la posición geométrica del ajuste indicado.

## Archivos

- `src/app`: interfaz y estilos.
- `src/components/diagram.tsx`: perfil, anclaje y planta SVG.
- `src/lib`: geometría tipada y tablas de seis láminas.
- `scripts/build-sw.mjs`: inventario de archivos y caché versionada.
- `public`: manifiesto, iconos y cabeceras para Pages.
- `tests`: comprobación geométrica y contrato de caché offline.
- `out`: exportación estática generada.

TypeScript se compila a JavaScript para el navegador. La lógica se escribe y verifica en TypeScript; no es necesario mantener una segunda versión manual en JavaScript. Los scripts de construcción y la plantilla del service worker son JavaScript de infraestructura.
