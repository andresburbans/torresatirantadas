# Criterio geométrico y lectura de planos

## Variables

| Símbolo | Significado | Referencia |
| --- | --- | --- |
| e | Distancia mástil → cada pivote E′ o F′ | Diseño de torre; editable, ejemplo 3,30 m |
| C | Distancia horizontal pivote → punto de afloramiento/nivelación | Ficha del tirante específico |
| K | Constante de alineación lateral para control de cabeceo | Editable, valor inicial 0,10 m |
| β | Inclinación vertical del tirante respecto de la horizontal | Grados, minutos, segundos |
| φ | Ángulo horizontal desde el eje transversal ±X | Ficha de replanteo |
| α | Pendiente del terreno en la dirección del tirante | Positiva si asciende hacia la torre |
| X₀ | Proyección horizontal de referencia al borde próximo de viga | Tabla 1 o referencia conocida |
| H₀ | Profundidad de referencia al sello | Mismo datum que H₁ |
| X₁, H₁ | Proyección y profundidad ajustadas | Resultado/objetivo |
| Zt₀ | Cota del terreno en el borde de viga de referencia | Opcional, necesaria para calcular por cota de sello |
| Zs₀, Zs₁ | Cotas de sello original y ajustada | Respecto del mismo datum altimétrico |

E′ y F′ son dos puntos distintos. Si cada uno está a e del mástil en lados opuestos, su separación es 2e. e no se suma escalarmente a C + X, porque el replanteo radial parte del pivote. El par e = 3,30/3,40 m no pudo asignarse con certeza por tipo usando los planos de fundaciones suministrados; por eso es una entrada manual.

## Cambios de profundidad

Para una línea recta de inclinación β, un traslado vertical hacia abajo de Δz exige:

`Δz = ΔX × tan(β)`

### Datum fijo

H₀ y H₁ se miden desde la misma horizontal. Por tanto:

`X₁ = X₀ + (H₁ − H₀) / tan(β)`

`H₁ = H₀ + (X₁ − X₀) × tan(β)`

### Terreno local en el borde de viga

Al desplazarse ΔX alejándose de la torre, para α positivo el terreno baja ΔX × tan(α). La profundidad medida desde ese terreno cambia en:

`ΔH = ΔX × [tan(β) − tan(α)]`

Entonces:

`X₁ = X₀ + (H₁ − H₀) / [tan(β) − tan(α)]`

`H₁ = H₀ + (X₁ − X₀) × [tan(β) − tan(α)]`

Se exige denominador positivo y alejado de cero. El modelo asume pendiente constante y referencia compatible con α y β. Si se cambian α o β, se debe cargar la fila o ingresar un nuevo par X₀/H₀ compatible. La app no reconstruye el diseño estructural al cambiar estos ángulos.

No debe suponerse que `X₀ = H₀ / tan(β)`: la altura de viga, el punto de inserción de la barra, el borde de referencia y el datum de H incorporan desplazamientos. El cálculo **incremental** conserva esos desplazamientos sin inventar su valor.

## Cotas de sello

`Zs₀ = Zt₀ − H₀`

En datum fijo:

`Zs₁ = Zt₀ − H₁`

En terreno local:

`Zt₁ = Zt₀ − (X₁ − X₀) × tan(α)`

`Zs₁ = Zt₁ − H₁`

Al ingresar directamente una cota de sello objetivo:

`ΔX = (Zs₀ − Zs₁) / tan(β)`

Luego se obtiene H₁ con la expresión del datum elegido. Esto distingue profundidad local de descenso altimétrico real.

## Ejemplo GI6KL, α = 5°

La Tabla 1 indica:

| Suelo | H | X | β |
| --- | --- | --- | --- |
| 3 | 3,50 m | 2,117 m | 57,117° |
| 4 | 4,00 m | 2,460 m | 57,117° |

Con profundidad local:

`ΔX = 0,50 / [tan(57,117°) − tan(5°)] ≈ 0,343 m`

`X₁ ≈ 2,460 m`

Con datum fijo, el mismo aumento de 0,50 m produce aproximadamente 0,323 m de cambio horizontal. Ambos resultados son correctos para sus respectivas definiciones de H. Las referencias tabuladas tienen precisión milimétrica: una operación inversa a partir de X ya redondeada puede devolver 1 mm de diferencia en H.

## Qué significa la fila de 5°

Las seis láminas llaman a α **Ángulo de terreno** y tabulan pendientes de 0° a 20° cada 2,5°. β es otro parámetro, identificado como inclinación o ángulo real del tirante.

La fila α = 5° corresponde a la geometría con esa pendiente adoptada. No hay en las notas revisadas una instrucción que exija usarla universalmente. Que se siga siempre esa fila en obra podría obedecer a una pendiente de proyecto o a un criterio específico de la oficina técnica, pero esa justificación no consta en el material entregado. No puede afirmarse que sea un factor de seguridad, una tolerancia de β ni una regla aplicable a todo terreno.

## Borde de la viga

X está acotada hasta la cara de viga próxima al punto de nivelación. Esa es la referencia de replanteo utilizada por la app:

`D_borde = C + X₁`

Los resultados, las coordenadas en planta y los casos exportados corresponden al borde indicado en los esquemas técnicos.

El resultado principal de campo incorpora la constante de alineación lateral indicada por el usuario:

`D_total = C + X₁ + K`

K vale 0,10 m por defecto, admite cero y otros valores no negativos, y se guarda en la sesión y en los casos exportados. Se aplica como suma escalar al total de campo; no modifica X₁, H₁, ΔX ni las coordenadas geométricas del borde, que conservan R = C + X₁. Al importar casos anteriores sin K se asignan 0,10 m y se conservan las demás entradas.

Los dibujos de la app son esquemáticos; las cifras provienen del motor numérico. La posición de la barra en la viga y la forma de excavación dibujadas no son detalles constructivos. La figura general no establece la altura real de la torre.

## Planta local

Eje X transversal, Y longitudinal; origen en el mástil. E′ = (0,+e), F′ = (0,−e). φ se mide desde ±X. Para R = C + X₁ (distancia al borde de la viga):

| Tirante | X local | Y local | Pivote |
| --- | --- | --- | --- |
| T1 | −R cos φ | −e − R sen φ | F′ |
| T2 | −R cos φ | +e + R sen φ | E′ |
| T3 | +R cos φ | +e + R sen φ | E′ |
| T4 | +R cos φ | −e − R sen φ | F′ |

La tabla describe la convención inicial. La versión 2 usa C y φ independientes para cada tirante y permite invertir las parejas y el lado transversal. El modo por coordenadas calcula giros de cuadrícula y N/E del borde en el sistema ingresado, sin transformar datum ni huso. Ver TORRE-CAMPO.md para orientación y nivelación.

## Fuentes locales revisadas

Se extrajeron las dos páginas de cada PDF disponible junto a las tres carpetas indicadas y se revisaron visualmente las seis tablas de localización y el detalle del anclaje. Solo se transcribieron a la app valores pertinentes; las notas del plano se trataron como datos del documento.

| Familia | β decimal del plano | Suelo 3, H / X a 5° | Suelo 4, H / X a 5° | Láminas / revisión |
| --- | --- | --- | --- | --- |
| GI6KL | 57,117° | 3,50 / 2,117 m | 4,00 / 2,460 m | 0005.L0026 / L0027; rev. 3, 13-04-2026 |
| G6KL | 49,843° | 3,00 / 1,822 m | 3,50 / 2,278 m | 0007-L0024 / L0025; rev. 3, 07-04-2026 |
| GR6KL | 49,794° | 3,00 / 1,825 m | 3,50 / 2,282 m | 0008-L0024 / L0025; rev. 4, 13-04-2026 |

Prefijo de láminas: `CNX-KILO-033-DL-LG-CV-PLN-E-`.

- `TORRES GI6KL SUELO 3 Y 4.pdf`
- `TORRE G6KL SUELO 3 Y 4.pdf`
- `TORRE GR6KL SUELO 3 Y 4.pdf`

La captura de replanteo T574 aporta C1 = 26,219 m, φ = 35°27′00″ y β = 57°07′01″. El β decimal de fundación GI6KL equivale a 57°07′01,2″. La app mantiene esa pequeña diferencia: ejemplo inicial con la captura; carga de referencia con el plano.

La captura muestra 2251,950 en el renglón Distancia C4: parece un dato de cota y no se utilizó como distancia.

## Verificación

Las pruebas cubren las 27 transiciones suelo 3 → 4 de las tres familias y nueve pendientes, con diferencia menor a 1,1 mm respecto de la tabla redondeada. También verifican excavación menor, operación inversa, cota objetivo, signo de elevaciones, invariancia de C, efecto del pivote, coma decimal, DMS e inválidos. Pruebas separadas del service worker comprueban instalación completa, respuesta sin red y rechazo de una instalación parcial.
