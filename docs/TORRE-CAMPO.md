# Torre completa: orientación, nivelación y estado

La implementación mantiene el motor de anclaje probado y añade un modelo de torre con cuatro tirantes y M1. Cada tirante guarda C, par X₀/H₀, objetivo, modo, datum, α, φ, suelo, sello de diseño y vista actual. β, e y K son comunes. M1 tiene sello de diseño, otro sello objetivo opcional y vista actual, sin aplicar la geometría de un tirante.

## Convenciones que requieren identificación en obra

Las notas intercambiaban E′ y F′ para T1/T4 y mencionaban una vez R42. Se conservan R41 y R32, y la correspondencia inicial de los planos: F′ → T1/T4, E′ → T2/T3. El lado inicial coloca T1/T2 a −X. Ambas decisiones son editables y se usan también en la planta.

El eje +Y va de F′ a E′ y +X queda a su derecha. No se presupone que +Y coincida con norte de cuadrícula. El modo inicial es por coordenadas: los campos desconocidos quedan vacíos y no se publica un giro hasta disponer de los datos necesarios. El modo por eje es una elección explícita y muestra su supuesto de alineación R41 hacia E′ y R32 hacia F′.

## Ángulos horarios

Con N/E en el mismo sistema y metros:

`Az(P→Q) = atan2(EQ − EP, NQ − NP)`, normalizado a `[0°, 360°)`.

La dirección de cada tirante resulta del azimut F′→E′ más su dirección local definida por φ, pareja de pivotes y lado transversal.

`Hz = normalizar(Az al objetivo − Az al amarre)`.

La visual al amarre parte del pivote ocupado, no del centro del mástil. Así se consideran amarres fuera del eje. Los puntos coincidentes o coordenadas parciales producen una salida pendiente, no un giro inventado.

Para la convención del ejemplo del usuario (T1/T4 en E′, T1 al lado +X), con amarres alineados:

| Punto | 0° hacia R41 | 0° hacia R32 |
| --- | --- | --- |
| T1 | 90° − φ | 270° − φ |
| T4 | 270° + φ | 90° + φ |

Esta tabla no se aplica universalmente a otras numeraciones. La diferencia entre ceros es 180° solo cuando las visuales de amarre son realmente opuestas desde la estación.

Las N/E mostradas son del borde, con distancia C + X₁. K se suma al total de campo y no desplaza esas coordenadas. La posición N/E de M1 puede introducirse; si ambas entradas están vacías se usa el punto medio de los pivotes y se identifica esa suposición.

## Nivelación

La referencia del nivel puede ser distinta del cero de estación. Sus Z y vista (+) definen:

`HI = Z_ref + vista (+)`.

`Mira_sello = HI − Z_sello_efectivo`.

`Cota_actual = HI − mira_actual`.

`Falta_excavar = Mira_sello − mira_actual`.

Una diferencia negativa se etiqueta como exceso, mostrando su magnitud. Una mira objetivo negativa se identifica como sello sobre la colimación y no se presenta como lectura normal ejecutable.

Cada sello de diseño de tirante define `Zt₀ = Zs₀ + H₀`. La traslación vertical de la misma viga conserva su geometría:

`Zs₁ = Zs₀ − (X₁ − X₀) tan β`.

Es equivalente a las cotas del motor existente, con el signo de pendiente y datum elegidos. La vista al sello utiliza Zs₁, conservando Zs₀. La geometría vertical se valida sin exigir C, K, e o φ, que no intervienen en esa nivelación. Las referencias altimétricas antiguas se conservan al migrar. M1 usa su sello objetivo explícito o el de diseño si el objetivo está vacío.

## Presets y guardado

Los presets cargan un par X₀/H₀ de la familia, suelo y α exactos, y β común. Los objetivos que seguían la profundidad de diseño siguen el nuevo H₀; los personalizados se conservan. Nunca se cambia silenciosamente una cota de diseño ingresada. Al editar la referencia se debe comprobar que corresponda a la solución de obra.

T2–T4 heredan φ de T1 hasta su edición individual. Volver a marcar la vinculación restaura la herencia. El estado entero se guarda en `rumbo3d-tirantes-tower-v2`; no se elimina la sesión `rumbo3d-tirantes-v1`. Un caso antiguo se recupera en su tirante, dejando pendientes las C desconocidas de los demás. Exportar torre usa esquema 2 y conserva datos incompletos; se siguen admitiendo los casos esquema 1.

Ajustar guarda al escribir y al cerrar de cualquier forma. El arranque espera a recuperar la sesión antes de mostrar controles editables, evitando que una selección rápida se sustituya por la restauración inicial. Se conservan el punto seleccionado y la preferencia de diagramas.

## Verificación

Las pruebas cubren los ocho giros (cuatro tirantes × dos ceros), convenciones invertidas, amarres fuera de eje, puntos coincidentes, redondeo cerca de 360°, las cinco lecturas, profundidad → sello efectivo, exceso de excavación, datos inválidos, herencia y migración de ambas familias de referencia. Se mantienen las pruebas geométricas y de actualización offline anteriores.
