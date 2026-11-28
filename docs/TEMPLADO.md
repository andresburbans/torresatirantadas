# Templado de conductores · vista previa (/v2)

Módulo en prueba para flechar y verificar conductores con estación total desde una estación lateral al vano. Se abre en `/v2/` (también `/v2` o `//v2`) o desde **(?) → Vista previa · Templado de conductores**. Guarda sus datos aparte de la sesión de torre (`rumbo3d-tirantes-vanos-v2`).

## Método

1. Estaciona a un costado del vano, con vista a las dos crucetas y al centro del vano.
2. En **Ajustes → Lecturas**, mide a cada cruceta: distancia (reducida o inclinada), cenital en círculo I y horizontal. Lo habitual es poner el círculo en 0 hacia la torre izquierda.
3. Si el punto visado no es donde apoya el conductor, indica el **Δ vertical al apoyo** de esa fase (negativo hacia abajo: grapa bajo la cadena de suspensión, polea). El cable de guarda suele ir sin cadena; por eso el Δ es propio de cada fase.
4. En **Ajustes → Proyecto**, ingresa el vano de proyecto, la tabla flecha–temperatura y el peso del cable. Si la tabla es del vano regulador del cantón, ponlo en **Vano de la tabla**. El cable de guarda tiene su propia tabla y su propio peso.
5. **Flechar:** gira al Hz del punto medio, fija el cenital indicado y tensa hasta que el conductor quede en el hilo horizontal. Corrige con los botones ±0,5 / ±1 °C a medida que cambia la temperatura.
6. **Verificar:** con el círculo en el Hz del punto medio, lee el cenital al conductor. La app da la flecha real, la diferencia y si cumple. **Guardar lectura** la deja en el registro del vano (fecha, hora, temperatura y resultado), que se exporta en CSV para el protocolo.
7. **Siguiente vano del cantón** crea otro vano con el mismo conductor, tablas, Δ vertical y tolerancias, con las lecturas vacías.

## Cálculo

Cotas respecto del eje del instrumento, sin altura instrumental. Para cada cruceta: con distancia reducida `h = d / tan z`; con distancia inclinada `DH = d·sen z`, `h = d·cos z`. Luego se suma el Δ vertical de la fase.

- Vano medido `a` = distancia horizontal entre los dos apoyos; desnivel `Δh = h_izq − h_der`.
- Punto medio en planta: promedio de los dos apoyos. Su dirección da el Hz y su distancia `D` desde la estación.
- Flecha corregida: `f = f_tabla(T) × (a / a_tabla)²`, con interpolación lineal en la tabla y sin extrapolar. `T` = temperatura medida + corrección por creep.
- Cenital de flechado: `V = 90° − atan((h_cuerda − f) / D)`, con `h_cuerda = (h_izq + h_der) / 2`.
- Verificación: `f_real = h_cuerda − D / tan V_leído`. Tolerancia = la menor entre el % de la flecha y el máximo en metros.
- Tensión horizontal (parábola en vano inclinado): `H = w·a² / (8·f·cos ψ)`, `cos ψ = a / √(a² + Δh²)`.

Las pruebas (`tests/span.test.ts`) reproducen la planilla «Vano T.122 – T.124» al 0,1 mgon.

## Mejoras propuestas para las próximas rondas

Ordenadas por utilidad en campo:

1. **Importar la planilla Excel de vanos** (CSV o .xlsx) para crear todos los vanos del cantón de una vez, con vano de proyecto, desnivel y tabla.
2. **Varias lecturas por verificación**: promedio de 2–3 lecturas (círculo I y II) con su dispersión, para descartar errores de puntería.
3. **Flecha por el método de vista directa** (miras/targets en ambas torres) para quien no tenga estación disponible.
4. **Haz de conductores**: control de diferencias entre subconductores del mismo polo (HVDC ±600 kV usa haces), con tolerancia propia.
5. **Tolerancia entre fases** del mismo vano (diferencia máxima admisible) con veredicto, no solo el valor.
6. **Nombres de conductores editables** (Polo +, Polo −, OPGW, guarda) para líneas HVDC, en vez de fases superior/media/inferior.
7. **Protocolo PDF** del vano con datos, lecturas, croquis y firma, generado sin conexión.
