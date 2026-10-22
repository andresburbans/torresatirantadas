# Torre completa: orientación, nivelación y estado

La implementación mantiene el motor de anclaje probado y añade un modelo de torre con cuatro tirantes y M1. Cada tirante guarda C, par X₀/H₀, objetivo, modo, datum, α, φ, suelo, sello de diseño y vista actual. β, e y K son comunes. M1 tiene sello de diseño, otro sello objetivo opcional y vista actual, sin aplicar la geometría de un tirante.

## Convenciones que requieren identificación en obra

El croquis confirmado identifica R41 al norte y R32 al sur, con F′ → T1/T4 y E′ → T2/T3. El lado inicial coloca T1/T2 a −X. Ambas decisiones son editables y se usan también en la planta.

El eje +Y va de F′ a E′ y +X queda a su derecha. No se presupone que +Y coincida con norte de cuadrícula. El modo inicial es Cuadrantes, con F′ y cero R41. La disposición confirmada tiene R41 al norte y R32 al sur; en el dibujo el sur está arriba. Por tanto +Y = F′→E′ apunta al sur y R41 está a 180° locales; R32 está a 0° locales. El modo por coordenadas sigue disponible para amarres fuera de eje, usando N/E reales.

## Ángulos horarios

Con N/E en el mismo sistema y metros:

`Az(P→Q) = atan2(EQ − EP, NQ − NP)`, normalizado a `[0°, 360°)`.

La dirección de cada tirante resulta del azimut F′→E′ más su dirección local definida por φ, pareja de pivotes y lado transversal.

`Hz = normalizar(Az al objetivo − Az al amarre)`.

La visual al amarre parte del pivote ocupado, no del centro del mástil. Así se consideran amarres fuera del eje. Los puntos coincidentes o coordenadas parciales producen una salida pendiente, no un giro inventado.

Para la disposición confirmada y amarres alineados:

| Armado | Punto | 0° hacia R41 (norte) | 0° hacia R32 (sur) |
| --- | --- | --- | --- |
| F′ | T1 | 90° − φ₁ | 270° − φ₁ |
| F′ | T4 | 270° + φ₄ | 90° + φ₄ |
| E′ | T2 | 90° + φ₂ | 270° + φ₂ |
| E′ | T3 | 270° − φ₃ | 90° − φ₃ |

El signo de T3/E′/R41 del croquis se corrige de +φ a −φ. Para φ = 35°27′, los resultados posibles son 54°33′, 125°27′, 234°33′ y 305°27′. Esta tabla no sustituye la visual N/E cuando el amarre queda fuera de eje; la diferencia entre ceros es 180° solo si las visuales son opuestas desde el pivote ocupado. Cambiar a un pivote distinto del de diseño requiere calcular el traslado al mismo borde, conservado por el motor.

Las sesiones anteriores a `survey.orientationVersion: 2` adoptan una sola vez Cuadrantes/F′/R41. Se conservan C, φ, β, X/H, cotas, lecturas, coordenadas y las otras preferencias. Una vez migradas, las elecciones explícitas de modo, estación y cero persisten entre recargas y exportaciones.

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

## Escala informativa entre amarres

`Dteórica = hypot(N41 − N32, E41 − E32)`; `factor = Dteórica / Dmedida` según la convención solicitada. La observación es horizontal, en metros. No se usa Z. Se reporta un solo valor con siete decimales en Ajustes y Replanteo. Nunca alimenta las funciones de geometría, orientación, cotas o nivelación; tampoco cambia automáticamente las coordenadas de pivotes/mástil.

Cambiar torre o N/E de R41/R32 invalida únicamente la medición de escala. El comportamiento anterior de la vista (+) al cambiar la cota de su referencia se conserva. Al migrar proyectos se añade un campo vacío sin alterar las medidas existentes.
