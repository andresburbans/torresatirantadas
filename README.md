# Líneas & Tirantes

Aplicación de campo para el replanteo y la nivelación de torres atirantadas HVDC ±600 kV. Permite trabajar con los cuatro tirantes y el mástil central, consultar los datos de cada punto y ajustar la proyección del anclaje cuando cambia la profundidad de excavación.

Está pensada para usarla desde el teléfono, incluso sin conexión. Desarrollada con TypeScript, Next.js y Tailwind CSS; se publica como sitio estático en Cloudflare Pages.

[Abrir la aplicación](https://torresatirantadas.pages.dev/)

## Qué permite hacer

- **Replanteo:** consultar la distancia al borde del prefabricado y el giro horario desde E′ o F′, con el cero de estación en R41 o R32.
- **Ajuste de excavación:** recalcular X conservando el afloramiento C y el ángulo vertical β, a partir de una nueva profundidad, proyección o cota de sello.
- **Nivelación:** obtener la cota instrumental, la mira al sello y cuánto falta excavar o cuánto se ha sobreexcavado, tanto en T1–T4 como en MC.
- **Referencias de torre:** buscar una torre y cargar sus coordenadas R41/R32 desde el catálogo, con edición manual de coordenadas disponible.
- **Factor de escala:** comparar la distancia horizontal medida R41–R32 con la calculada por sus coordenadas N/E. El cociente teórica / medida se muestra para ingresarlo en la estación total; no se aplica a C + X₁ + K ni a los demás resultados.

Cada punto conserva sus datos, su estación E′/F′ y su referencia del cero. MC muestra sus cuatro vértices en coordenadas locales o UTM, con offset configurable; Ajustes permite autocompletar E′/F′ desde MC y los amarres. Los diagramas de perfil, anclaje y planta se pueden mostrar u ocultar, y la torre completa se puede exportar e importar en un archivo JSON.

## Uso en campo

1. En **Ajustes**, busca la torre y revisa sus referencias. Completa la familia, el suelo, los ángulos y las distancias de diseño.
2. Para nivelar, ingresa las cinco cotas de sello y la vista (+) a la referencia del nivel.
3. Selecciona T1–T4 o MC en la barra inferior y abre **Replanteo** o **Nivelación**, según el trabajo.
4. Si cambia la excavación de un tirante, muestra **Ajuste de terreno** e introduce el nuevo valor.

La configuración habitual usa F′ para T1/T4 y E′ para T2/T3, con R41 al norte y R32 al sur. El modo por cuadrantes supone que los amarres están alineados con el eje de torre; para referencias fuera del eje está disponible el cálculo por coordenadas.

La explicación de los parámetros, las tablas por tipo de suelo y las fórmulas está en **(?) → Ver fórmulas y referencias**, también disponible sin conexión.

## Instalar y trabajar sin conexión

Abre la app con internet y espera a que la ayuda (?) indique **Disponible sin conexión**. En Android puedes usar la opción de instalar del navegador; en iPhone, abre Safari y elige **Compartir → Añadir a pantalla de inicio**.

Antes de salir a terreno, comprueba que abre y calcula en modo avión. La sesión se guarda en el dispositivo: exporta una copia JSON para conservar el trabajo fuera del navegador. Cada dominio mantiene su propio almacenamiento.

Con conexión, la app comprueba si hay una nueva versión y la carga al terminar de descargarla. Sin conexión utiliza la última versión guardada.

## Desarrollo local

Requiere Node.js 22.18.0, indicado en `.node-version`.

```sh
npm ci
npm run dev
```

La aplicación queda disponible en `http://127.0.0.1:3000`.

Para comprobar la instalación y el funcionamiento sin conexión, utiliza la compilación de producción:

```sh
npm run build
npm run preview
```

El service worker se registra en producción. La exportación se genera en `out/` y debe servirse por HTTP; no se abre directamente como un archivo local.

Las comprobaciones del proyecto se ejecutan con:

```sh
npm test
npm run typecheck
```

La versión visible se define en `package.json` con formato mayor.menor.parche. Las novedades de cada publicación se mantienen en `src/data/release-notes.json`.

## Publicación

Cloudflare Pages está conectado a la rama `main` de este repositorio. La configuración de compilación es:

| Campo | Valor |
| --- | --- |
| Comando de compilación | `npm run build` |
| Directorio de salida | `out` |
| Directorio raíz | Raíz del repositorio; dejar vacío |
| Node.js | `22.18.0` |

El comando incluye la generación de la caché de la PWA. La carpeta `out/` se genera durante el despliegue y no se guarda en Git. Cada push a `main` activa una nueva publicación.

## Documentación

- [Cálculos y tablas de diseño](docs/CALCULOS.md)
- [Replanteo y nivelación en campo](docs/TORRE-CAMPO.md)
- [Validación y pruebas realizadas](docs/VALIDACION.md)

---

Creada por Andrés Burbano (c) 2026 · RUMBO3D
