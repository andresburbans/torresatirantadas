import { ALPHAS, CATALOG } from '@/lib/catalog';
import { angleLabel, format, toDms } from '@/lib/geometry';

export function FieldGuide() {
  return <article className="field-guide">
    <div className="eyebrow">FÓRMULAS Y REFERENCIAS · LECTURA DE OBRA</div>
    <h2 id="modal-title">Entender la torre, el suelo y el replanteo</h2>
    <p>Esta guía relaciona los planos de fundación con lo que mides en terreno: un mástil central, cuatro tirantes y cuatro anclajes. El objetivo de la app es obtener la posición horizontal cuando cambia la excavación y se conserva la dirección del tirante. Abre cada apartado para leer la explicación completa; todo este contenido también queda disponible sin conexión. Si una tabla no cabe en la pantalla, deslízala horizontalmente.</p>

    <details open><summary>01 · Un mástil central y cuatro tirantes</summary><div className="guide-content">
      <p>Los cuatro tirantes unen la parte superior de la torre con sus anclajes. Su disposición permite transmitir esfuerzos hacia las fundaciones y contribuir a la estabilidad del mástil. Para topografía, cada tirante es un caso concreto con su dirección horizontal, su inclinación vertical, su afloramiento y su cota de terreno. La app estudia esa geometría; no calcula tensiones ni reparto de cargas.</p>
      <p><strong>Centro del mástil y pivote de replanteo son referencias distintas.</strong> E′ y F′ están desplazados respecto del mástil. La entrada e es la distancia desde el mástil a cada pivote: si e = 3,30 m, la separación E′–F′ es 6,60 m; si e = 3,40 m, es 6,80 m. Para una distancia que ya parte de E′ o F′ no se vuelve a sumar e.</p>
      <p>Desde el pivote sale la distancia C hasta el punto de afloramiento o nivelación identificado en el plano. Después viene X₁, que llega al borde próximo de la viga. La distancia geométrica es C + X₁. Para tu control de alineación lateral, el resultado principal añade K y muestra <strong>C + X₁ + K</strong>.</p>
      <p><strong>T1, T2, T3 y T4 no implican cuatro distancias C iguales.</strong> La captura de T574 muestra valores distintos. Cada tirante tiene ahora una ficha independiente con C, objetivo, pendiente, sello, φ y vista actual. M1 tiene su propia nivelación. El selector recupera los datos del punto y «Exportar torre» conserva las cinco fichas en un archivo.</p>
      <p>La planta usa la C y el φ propios de cada tirante. Los puntos sin datos válidos no se dibujan. Puedes ocultar todos los diagramas para dejar primero las cifras de replanteo y nivelación.</p>
    </div></details>

    <details><summary>02 · Qué significan suelo tipo 3 y suelo tipo 4</summary><div className="guide-content">
      <p>Los números 3 y 4 son <strong>clases geotécnicas del proyecto</strong>. Sirven para elegir una solución de fundación asociada a unas propiedades del terreno. No son una escala universal que pueda trasladarse a cualquier obra. Tampoco debe confundirse «torre suspensión tipo 3 (GI6KL)», que aparece en el título de una lámina, con «suelo tipo 3»: son clasificaciones de objetos diferentes.</p>
      <p>En las láminas GI6KL revisadas, la Tabla 2 presenta estos valores de diseño. La letra F y las notas identifican un comportamiento friccionante. Se transcriben aquí para comprender la diferencia entre clases; no son parámetros que la app ajuste ni resultados que obtenga al medir una excavación.</p>
      <div className="guide-table"><table><caption>Tabla 2 · parámetros de las láminas GI6KL L0026 / L0027</caption><thead><tr><th>Propiedad</th><th>Suelo 3</th><th>Suelo 4</th></tr></thead><tbody>
        <tr><td>Forma de trabajo</td><td>F</td><td>F</td></tr>
        <tr><td>Cohesión adoptada</td><td>0 kPa</td><td>0 kPa</td></tr>
        <tr><td>Ángulo de fricción del suelo</td><td>35°</td><td>30°</td></tr>
        <tr><td>Ángulo de cono de arrancamiento</td><td>30°</td><td>30°</td></tr>
        <tr><td>Presión admisible neta vertical</td><td>392 kPa</td><td>196 kPa</td></tr>
        <tr><td>Presión admisible neta horizontal</td><td>294 kPa</td><td>147 kPa</td></tr>
      </tbody></table></div>
      <p>La cohesión nula es la hipótesis adoptada en esa tabla; no demuestra, por sí sola, que una muestra real carezca de cualquier cohesión. El ángulo de fricción caracteriza parte de la resistencia al corte. Las presiones admisibles son límites de diseño para las condiciones consideradas; no son la tensión del cable ni una medida directa de cuánto cuesta excavar. El ángulo del cono de arrancamiento pertenece al modelo de resistencia del anclaje, no a la inclinación del tirante.</p>
      <p>En ese ejemplo, el tipo 4 tiene un ángulo de fricción menor y presiones admisibles menores. Eso ayuda a entender por qué se adopta una solución con mayor profundidad, pero <strong>no permite deducir por cuenta propia una nueva profundidad multiplicando o dividiendo esas presiones</strong>. La elección de la fundación también depende de las cargas y del modelo de diseño.</p>
      <p>En terreno puedes notar que un material es más duro o más fácil de excavar, como comentaste para los tipos 3 y 4. Esa observación es útil, pero no basta para asignar la clase: dureza de excavación y comportamiento geotécnico no son equivalentes. La nota 4 de las láminas pide verificar la correspondencia del material encontrado y consultar al especialista geotécnico cuando las diferencias sean significativas. La nota 5 indica la consideración de suelo seco.</p>
      <p><strong>La app empieza después de esa decisión de obra:</strong> dada una profundidad o cota de sello indicada, obtiene la corrección horizontal que conserva C y β. No decide si un suelo admite una fundación, ni convierte automáticamente un suelo 3 en un suelo 4.</p>
    </div></details>

    <details><summary>03 · Por qué los valores cambian según la torre</summary><div className="guide-content">
      <p>GI6KL, G6KL y GR6KL son familias diferentes. Sus láminas no emplean exactamente el mismo β ni la misma combinación H/X. Por eso seleccionar solamente el suelo, sin identificar antes la torre y la lámina, puede llevar a usar una distancia incorrecta.</p>
      <div className="guide-table"><table><caption>Tabla 1 · referencias a α = 5°. H y X en metros.</caption><thead><tr><th>Torre</th><th>Suelo</th><th>H₀</th><th>X₀ al borde</th></tr></thead><tbody>
        {(['GI6KL','G6KL','GR6KL'] as const).flatMap(tower=>(['3','4'] as const).map(soil=><tr key={tower+soil}><td>{tower}</td><td>{soil}</td><td>{format(CATALOG[tower][soil].h,2)}</td><td>{format(CATALOG[tower][soil].x[2])}</td></tr>))}
      </tbody></table></div>
      <ul>{(['GI6KL','G6KL','GR6KL'] as const).map(tower=><li key={tower}><strong>{tower}:</strong> β = {format(CATALOG[tower].beta)}° = {angleLabel(toDms(CATALOG[tower].beta))}.</li>)}</ul>
      <p>A 5°, pasar de la referencia de suelo 3 a la de suelo 4 aumenta H en 0,50 m en las tres familias. La diferencia de X es aproximadamente 0,343 m en GI6KL, 0,456 m en G6KL y 0,457 m en GR6KL. El ángulo β menor de G6KL y GR6KL hace que el mismo descenso vertical produzca una corrección horizontal mayor, con la misma pendiente local.</p>
      <p>Los números corresponden a las revisiones incorporadas a la app. Al recibir otra revisión o una solución distinta, usa las entradas manuales con su par de referencia X₀/H₀. No mezcles H de una lámina con X de otra ni β de otra familia.</p>
      <p>El valor e = 3,30 m del ejemplo inicial procede de tu indicación. Las láminas de fundación por sí solas no permiten asignar con certeza 3,30 o 3,40 m a cada familia. Toma e y C de la ficha de replanteo de la torre concreta, no de esta tabla general.</p>
    </div></details>

    <details><summary>04 · Cuatro ángulos que no debes confundir</summary><div className="guide-content">
      <p><strong>β, ángulo vertical del tirante:</strong> inclinación de su línea respecto de la horizontal, vista en un perfil que contiene el tirante. Es el ángulo que se conserva en esta corrección. No se mide respecto del mástil vertical ni respecto de la superficie inclinada del terreno.</p>
      <p><strong>α, pendiente del terreno:</strong> inclinación del terreno en esa misma dirección de perfil. No es necesariamente la pendiente máxima de la ladera: interesa la componente en la dirección del anclaje. La convención usada aquí es α positivo cuando el terreno asciende desde el anclaje hacia la torre; al alejarte de la torre, baja. Si ocurre lo contrario, α es negativo.</p>
      <p><strong>φ, ángulo horizontal de replanteo:</strong> se ve en planta y orienta el tirante desde el eje transversal ±X de la torre. No modifica el cálculo de profundidad → X; interviene al descomponer la distancia en coordenadas locales.</p>
      <p><strong>Ángulo de fricción del suelo:</strong> propiedad geotécnica de la Tabla 2. Aunque en geotecnia también se suele usar la letra φ, no es el φ de replanteo de esta app. El valor 35° del suelo 3 no se ingresa en la casilla del ángulo horizontal. Tampoco el cono de arrancamiento de 30° reemplaza a α o β.</p>
      <h3>Grados decimales, DMS y porcentajes</h3>
      <p>Las casillas de β y φ reciben grados, minutos y segundos sexagesimales: 1° = 60′ y 1′ = 60″. El plano puede expresar β en grados decimales. Por ejemplo, 57,117° equivale a 57°07′01,2″; no a 57°11′07″. Del mismo modo, 35°27′00″ equivale a 35,45°, no a 35,27°.</p>
      <p>α se introduce en grados decimales. Una pendiente de 5° equivale aproximadamente al 8,75 %, porque pendiente porcentual = 100 × tan α. Una pendiente del 5 % equivale aproximadamente a 2,86°. Comprueba la unidad antes de copiar un dato.</p>
      <p>Si la estación informa un ángulo cenital Z para una visual ascendente, su inclinación sobre la horizontal es β = 90° − Z. Si trabaja en gon, convierte a grados sexagesimales antes de ingresar: 1 gon = 0,9°. Confirma la referencia y la configuración del instrumento; la app no detecta esa unidad automáticamente.</p>
    </div></details>

    <details><summary>05 · Qué significa 5° y cómo usar otras pendientes</summary><div className="guide-content">
      <p>La Tabla 1 llama a esa columna «Ángulo de terreno α». La fila de 5° representa una geometría calculada para esa pendiente adoptada. <strong>No se encontró una nota que obligue a usar siempre 5°</strong>, ni una justificación de que sea un factor de seguridad o una tolerancia del tirante. Si en obra se usa sistemáticamente, la razón concreta debe estar en el criterio de diseño o en la instrucción de la oficina técnica.</p>
      <p>Así cambia la referencia de GI6KL en las nueve filas incorporadas. Dentro de cada suelo, H permanece constante y X cambia con α; el terreno inclinado modifica la relación entre el punto de nivelación, el sello y la viga.</p>
      <div className="guide-table"><table><caption>GI6KL · X₀ tabulada según α, en metros</caption><thead><tr><th>Terreno α</th><th>Suelo 3 · H = 3,50</th><th>Suelo 4 · H = 4,00</th></tr></thead><tbody>{ALPHAS.map((alpha,i)=><tr key={alpha}><td>{format(alpha,1)}°</td><td>{format(CATALOG.GI6KL['3'].x[i])}</td><td>{format(CATALOG.GI6KL['4'].x[i])}</td></tr>)}</tbody></table></div>
      <ol><li>Identifica la familia de torre y el suelo de la solución indicada.</li><li>Selecciona la fila de α adoptada en el plano o instrucción correspondiente. En «Ver tabla» puedes revisar sus valores antes de aplicarlos.</li><li>Pulsa «Cargar referencia». Se cargan juntos X₀, H₀, β, α y el datum de terreno local; C, e, K, φ y el objetivo se conservan.</li><li>Revisa el objetivo que haya quedado seleccionado: cargar una referencia no significa que la nueva profundidad objetivo deba ser la de ese mismo suelo.</li><li>Introduce el cambio de campo y lee X₁ y C + X₁ + K.</li></ol>
      <p><strong>Para 0°, 2,5°, 7,5°, 10° u otra fila tabulada</strong> se sigue el mismo procedimiento. No uses la X de 5° con la H de una fila o solución diferente por simple costumbre.</p>
      <p><strong>Ejemplo con α = 10°:</strong> en GI6KL, suelo 3, el par tabulado es H₀ = 3,50 m y X₀ = 2,255 m. Si la nueva profundidad local indicada es 4,00 m, conservar β da X₁ ≈ 2,620 m: una corrección de aproximadamente 0,365 m. El incremento de profundidad sigue siendo 0,50 m, pero el desplazamiento difiere del de 5° porque cambió la pendiente del terreno y se partió de su referencia correspondiente.</p>
      <p>Si α real fuese, por ejemplo, 6°, la app permite ingresarlo manualmente, pero no interpola ni reconstruye automáticamente una fundación absoluta para 6°. Necesitas un par X₀/H₀ conocido y compatible con esa geometría, el mismo prefabricado y β. Cambiar solo α y conservar una referencia tomada a 5° puede dejar un origen incompatible. La admisión numérica de un ángulo no equivale a que exista una solución de diseño aprobada para él.</p>
      <p>Para pendientes de signo contrario o fuera de las filas del plano, la expresión geométrica puede servir desde una referencia válida, pero no se deben presentar esas cifras como una fila oficial de la Tabla 1. Si el perfil real cambia de pendiente entre las posiciones, una sola α constante ya no describe todo el desplazamiento.</p>
    </div></details>

    <details><summary>06 · Qué ingresar en cada casilla</summary><div className="guide-content">
      <dl>
        <dt>e · Mástil → E′ / F′</dt><dd>Distancia a cada pivote. La app la usa en planta. No ingreses la separación completa E′–F′ ni la sumes otra vez al total radial.</dd>
        <dt>C · Afloramiento</dt><dd>Distancia horizontal desde el pivote al punto fijo de afloramiento o nivelación del tirante. Es propia de ese tirante. Conservarla significa que el punto superficial no se desplaza en el modelo.</dd>
        <dt>X₀ · Proyección de proyecto</dt><dd>Distancia horizontal de referencia desde el afloramiento al borde de la viga indicado en el plano. No es la longitud inclinada de barra, el ancho de la excavación ni la distancia al centro del prefabricado.</dd>
        <dt>H₀ · Excavación de proyecto</dt><dd>Profundidad de referencia hasta el sello. Debe formar un par con X₀ y usar la misma definición de profundidad que el ajuste. No es una longitud medida sobre el tirante inclinado.</dd>
        <dt>H₁ o X₁ · Objetivo de campo</dt><dd>La entrada cambia con el modo. En «Profundidad → X» se introduce H₁; en «X → Profundidad», X₁ sola, sin C ni K. La otra magnitud se calcula.</dd>
        <dt>β · Ángulo vertical</dt><dd>Ángulo sexagesimal de la línea del tirante respecto de la horizontal. Usa el correspondiente a la torre y a su referencia; tres casillas para grados, minutos y segundos.</dd>
        <dt>α · Pendiente del terreno</dt><dd>Grados decimales con el signo descrito antes. Interviene cuando H se mide desde el terreno local; en datum fijo no interviene en el incremento ΔX = ΔH / tan β.</dd>
        <dt>Zt₀ · Cota de terreno de referencia</dt><dd>Elevación del borde original. Se obtiene como sello de diseño + H₀ cuando has ingresado ese sello; los casos antiguos conservan su referencia altimétrica. Permite convertir el ajuste a una nueva cota de sello.</dd>
        <dt>Zs₁ · Nueva cota de sello</dt><dd>Elevación objetivo del fondo, no profundidad positiva de excavación. Si el terreno está en cota 100,00 y el sello en 96,00, la diferencia vertical es 4,00 m.</dd>
        <dt>K · Alineación lateral</dt><dd>Adición de campo para el control de cabeceo, inicialmente 0,10 m. Puedes usar 0,20 m, cero u otro valor no negativo. No es una dimensión tomada de la Tabla 1.</dd>
        <dt>φ · Replanteo en planta</dt><dd>Ángulo horizontal desde ±X. Las coordenadas son locales al mástil; para llevarlas a la red topográfica hacen falta el origen y la orientación reales de la torre.</dd>
      </dl>
      <p>Las distancias se ingresan en metros y se admite punto o coma decimal. La app muestra tres decimales, pero calcula con mayor precisión. Un resultado como 2,460 m no significa que un dato redondeado de partida tenga precisión ilimitada.</p>
    </div></details>

    <details><summary>07 · Por qué cambia X cuando cambia la excavación</summary><div className="guide-content">
      <p>Imagina una recta de inclinación β que pasa por un afloramiento fijo. Para encontrar esa misma recta a una cota más baja hay que avanzar horizontalmente alejándose de la torre. Si el fondo sube, la intersección se acerca. Esa es la razón geométrica de la corrección; no se desplaza C para compensar el cambio.</p>
      <p>La definición trigonométrica es tan β = descenso vertical / avance horizontal. Por tanto, si el descenso de la misma referencia de viga es Δz:</p>
      <p className="guide-equation">Δz = ΔX × tan β</p>
      <p><strong>La viga y su inserción de barra tienen dimensiones.</strong> Por eso no se usa X = H / tan β como valor absoluto: H puede llegar al sello y la línea del tirante encontrarse con la viga a otra altura. Al partir de un par X₀/H₀ conocido y trasladar la misma geometría, esos desplazamientos constantes se conservan y no es necesario inventarlos.</p>
      <h3>Profundidad desde una cota fija</h3>
      <p>Si H₀ y H₁ parten de la misma horizontal, Δz = H₁ − H₀. El terreno nuevo bajo el borde no cambia ese datum.</p>
      <p className="guide-equation">X₁ = X₀ + (H₁ − H₀) / tan β</p>
      <p className="guide-equation">H₁ = H₀ + (X₁ − X₀) × tan β</p>
      <h3>Profundidad desde el terreno local</h3>
      <p>Con α positivo, al mover el borde ΔX alejándose de la torre, el terreno local baja ΔX × tan α. La profundidad local aumenta menos que el descenso absoluto de la viga:</p>
      <p className="guide-equation">ΔH = ΔX × tan β − ΔX × tan α</p>
      <p className="guide-equation">X₁ = X₀ + (H₁ − H₀) / (tan β − tan α)</p>
      <p className="guide-equation">H₁ = H₀ + (X₁ − X₀) × (tan β − tan α)</p>
      <p>Para β fijo y un cambio positivo de profundidad local, una α positiva mayor reduce el denominador y aumenta el desplazamiento horizontal requerido. Con α = 0°, ambas referencias coinciden. La app exige un denominador positivo alejado de cero; no da un resultado válido cuando la geometría se vuelve incompatible.</p>
      <p>Estas expresiones conservan β, C y la geometría de inserción de la misma viga. Si cambia el prefabricado, el punto de inserción o la referencia del sello, hace falta establecer otra referencia compatible antes de aplicar el incremento.</p>
    </div></details>

    <details><summary>08 · Profundidad y cota de sello: cuándo usar cada modo</summary><div className="guide-content">
      <p><strong>Profundidad → X:</strong> úsalo cuando la instrucción sea excavar una profundidad H₁. Antes de calcular, decide desde dónde se mide: desde el terreno de la nueva posición del borde o desde una cota horizontal fija. Una cifra de «4 metros» sin indicar su origen puede describir dos situaciones distintas.</p>
      <p><strong>X → Profundidad:</strong> úsalo cuando se quiera conocer qué profundidad corresponde a una proyección X₁. Introduce la proyección desde el afloramiento al borde. Si tienes una distancia total de campo D, primero recupera X₁ = D − C − K. No escribas C + X₁ + K en una casilla que solicita X₁.</p>
      <p><strong>Cota de sello:</strong> úsalo cuando la instrucción identifica una elevación objetivo. La app parte de Zs₀ = Zt₀ − H₀ y calcula el descenso absoluto del sello:</p>
      <p className="guide-equation">ΔX = (Zs₀ − Zs₁) / tan β</p>
      <p>Después obtiene H₁ con la referencia elegida. Para terreno local también calcula Zt₁ = Zt₀ − ΔX × tan α y Zs₁ = Zt₁ − H₁. Con datum fijo se conserva Zt₀ y se usa Zs₁ = Zt₀ − H₁.</p>
      <p><strong>Ejemplo:</strong> Zt₀ = 100,00 m, H₀ = 3,50 m y sello original 96,50 m. Si el nuevo sello se fija en 96,00 m, la viga baja 0,50 m en cota. Para β ≈ 57,117°, X₁ resulta aproximadamente 2,440 m. Con datum fijo H₁ = 4,000 m; con α = 5° y terreno local, H₁ ≈ 3,972 m. La posición física es la misma: cambió la forma de expresar la profundidad.</p>
      <p>No confundas una cota que aumenta con una profundidad que aumenta. Un sello de 96,50 que pasa a 96,00 baja y suele exigir un desplazamiento hacia afuera. Un sello que sube reduce X, mientras se conserva la misma línea del tirante.</p>
    </div></details>

    <details><summary>09 · Ejemplo completo para usar en terreno</summary><div className="guide-content">
      <p>Supón GI6KL, suelo 3 y fila α = 5°. Carga la referencia X₀ = 2,117 m, H₀ = 3,50 m y β = 57,117°. Toma C = 26,219 m del ejemplo T574 y K = 0,10 m. Son datos de demostración: cada tirante real debe usar su ficha.</p>
      <ol><li>Elige «Profundidad → X» y «Terreno local · borde de viga».</li><li>Ingresa H₁ = 4,00 m, si esa es la nueva profundidad indicada.</li><li>El incremento es ΔH = +0,50 m.</li><li>ΔX = 0,50 / (tan 57,117° − tan 5°) ≈ +0,343 m.</li><li>X₁ ≈ 2,460 m. El borde se aleja del afloramiento 0,343 m.</li><li>C + X₁ ≈ 28,679 m al borde geométrico.</li><li>El total de campo C + X₁ + K ≈ <strong>28,779 m</strong>.</li></ol>
      <p>Si la profundidad vuelve a 3,50 m, la proyección vuelve a X₀ = 2,117 m y el total queda en 28,436 m con el mismo C y K. Si excavas menos que H₀, X disminuye y aparece «se acerca», siempre que la posición resultante siga siendo válida.</p>
      <p>Con «Cota fija», el mismo incremento numérico de 0,50 m da ΔX ≈ 0,323 m. No es una contradicción de las tablas: describe otra referencia para H. No cambies de datum solo para obtener el número esperado; úsalo según cómo se definió o midió la excavación.</p>
      <p>Las X del plano están redondeadas al milímetro. Por eso, una operación inversa con X₁ = 2,460 m puede recuperar una profundidad con una diferencia del orden de un milímetro respecto de 4,000 m. La app conserva más cifras durante el cálculo y redondea solo al mostrar.</p>
      <p>El β inicial de la captura T574 es 57°07′01″. Al cargar la Tabla 1 se usa 57,117°, equivalente a 57°07′01,2″. Esa diferencia de 0,2″ explica una diferencia numérica muy pequeña y no representa un cambio de criterio.</p>
    </div></details>

    <details><summary>10 · K, cabeceo y coordenadas de los cuatro anclajes</summary><div className="guide-content">
      <p>K es la adición de alineación lateral que decidiste usar para el control de cabeceo. En esta app se aplica como una suma escalar:</p><p className="guide-equation">D_total = C + X₁ + K</p>
      <p>Pasar de K = 0,10 m a K = 0,20 m aumenta el total 0,10 m. No cambia X₁, H₁, β ni el indicador «se aleja / se acerca», que expresa exclusivamente ΔX = X₁ − X₀ debido al ajuste de excavación. K tampoco es una tolerancia de inclinación autorizada por el plano ni un ángulo calculado de cabeceo del mástil.</p>
      <p>Para conservar la lectura geométrica del borde, la planta y sus coordenadas usan R = C + X₁, sin K. El valor principal de campo incluye K y está identificado como total. Si necesitas las coordenadas de otro punto material de alineación, su dirección y referencia tendrían que definirse aparte; la app no convierte esta adición en un desplazamiento transversal de coordenadas.</p>
      <p>El origen local está en el mástil y +Y va de F′ hacia E′. Esta tabla muestra la convención inicial del plano: E′ = (0,+e), F′ = (0,−e), T1/T4 desde F′ y T1/T2 al lado −X. Ajustar permite invertir las parejas o el lado transversal si la ficha lo requiere. Con φ desde el eje transversal del cuadrante:</p>
      <div className="guide-table"><table><thead><tr><th>Tirante</th><th>X local</th><th>Y local</th><th>Pivote</th></tr></thead><tbody><tr><td>T1</td><td>−R cos φ</td><td>−e − R sen φ</td><td>F′</td></tr><tr><td>T2</td><td>−R cos φ</td><td>+e + R sen φ</td><td>E′</td></tr><tr><td>T3</td><td>+R cos φ</td><td>+e + R sen φ</td><td>E′</td></tr><tr><td>T4</td><td>+R cos φ</td><td>−e − R sen φ</td><td>F′</td></tr></tbody></table></div>
      <p>La planta representa el sistema local. Si ingresas N/E reales de pivotes y amarres, la app también calcula la orientación de cuadrícula y las coordenadas del borde en ese sistema. No se aplica conversión de datum, huso ni norte verdadero: todos los datos deben usar el mismo sistema y metros.</p>
    </div></details>

    <details><summary>11 · Leer el plano sin mezclar referencias</summary><div className="guide-content">
      <ul><li><strong>X no es la longitud inclinada de barra.</strong> Es una proyección horizontal al borde de viga. Las columnas F y longitud de tubería PVC de la Tabla 1 describen otras dimensiones del detalle; no se copian a X o a C.</li><li><strong>El sello no es la cara superior de la viga.</strong> Si una medición se toma sobre otra cara, hay que referirla al punto indicado para H. No sumes o restes alturas del prefabricado sin revisar la sección del plano.</li><li><strong>Una profundidad necesita un origen.</strong> Comprueba si el terreno de referencia está en la posición original o en la posición nueva del borde. Esto determina el datum que corresponde.</li><li><strong>Los cuatro tirantes pueden tener cotas y C diferentes.</strong> Una ladera no obliga a que sus cuatro anclajes se resuelvan con una misma profundidad local.</li><li><strong>La fila α no cambia el β del cable.</strong> Son variables independientes. Tampoco se compensa una pendiente diferente alterando β para forzar una X deseada.</li><li><strong>K se aplica una sola vez.</strong> El número grande ya incluye K; X₁ y las coordenadas de borde no lo incluyen.</li><li><strong>Revisa identificador, revisión y unidades.</strong> La captura T574 presenta 2251,950 en el renglón «Distancia C4»; parece un valor de cota. No se incorporó como distancia ni debe copiarse como C sin revisar la ficha.</li></ul>
      <p>Las notas 2 y 15 de las láminas remiten al diseño de la torre y de los tirantes para su localización; el esquema de fundación no reemplaza esa ficha específica. La app conserva la geometría de una referencia conocida. Una diferencia entre suelo encontrado y suelo de diseño necesita la decisión correspondiente antes de usar una nueva profundidad como instrucción de obra.</p>
    </div></details>

    <details><summary>12 · Cero en R41 o R32 y giro horario</summary><div className="guide-content">
      <p>En Ajustar elige qué pareja se arma en E′ o F′ y el lado transversal de T1/T2. La convención inicial mantiene el plano anterior; tus notas contenían ambas correspondencias y por eso queda configurable. La planta y la tabla de giros de Ajustar permiten revisar la elección.</p>
      <p><strong>Por coordenadas:</strong> el azimut del eje se obtiene de F′ hacia E′. La dirección de cada tirante incorpora su φ y cuadrante. El azimut del cero se calcula desde el pivote ocupado hasta R41 o R32:</p>
      <p className="guide-equation">Hz = normalizar a [0°, 360°) (azimut al tirante − azimut al amarre)</p>
      <p>La visual real puede estar desviada del eje. No basta con sumar 180° si los amarres no quedan exactamente en direcciones opuestas desde la estación.</p>
      <p><strong>Por eje:</strong> supone R41 hacia F′→E′ y R32 en la dirección opuesta. Exige verificar la alineación. Con T1/T4 en E′ y T1 al lado +X, el ejemplo de tus notas es: cero en R41, T1 = 90° − φ y T4 = 270° + φ. Cero en R32, T1 = 270° − φ y T4 = 90° + φ. Para φ = 35°27′, T1 pasa de 54°33′ a 234°33′. El signo de φ no se cambia arbitrariamente al invertir el cero.</p>
      <p>T2–T4 heredan φ de T1 mientras estén vinculados. Editar un φ individual lo separa; marcar «Usar φ de T1» recupera la herencia. β, e y K son comunes. C, los sellos y los objetivos de cada anclaje son independientes.</p>
    </div></details>

    <details><summary>13 · Nivelación de las cinco excavaciones</summary><div className="guide-content">
      <p>La estación total y el nivel tienen referencias independientes. Puedes poner 0° de estación hacia R41 y tomar la vista (+) del nivel en R32. En Ajustar ingresa la referencia del nivel, su Z, la lectura (+) y los cinco sellos de diseño.</p>
      <p className="guide-equation">HI = Z de referencia + vista (+)</p>
      <p className="guide-equation">Mira al sello = HI − Z del sello efectivo</p>
      <p>HI es la cota del plano de colimación, no la altura física del aparato sobre el terreno. Si mueves el nivel necesitas una nueva vista (+). Referencia en cota 100,000 y vista (+) de 1,500 dan HI = 101,500. Para sello en 98,000, la mira objetivo es 3,500 m.</p>
      <p>Con una vista actual sobre terreno o fondo de excavación:</p>
      <p className="guide-equation">Cota actual = HI − mira actual<br/>Falta excavar = mira al sello − mira actual</p>
      <p>Si la mira al sello es 3,500 y lees 2,500, falta bajar 1,000 m. Si lees 4,000, estás 0,500 m bajo el sello y aparece «Exceso de excavación». Una mira objetivo negativa indica que el sello está sobre el plano de colimación y requiere otra posición del nivel para una mira vertical normal.</p>
      <p>Cada tirante conserva su sello de diseño. Cambiar la profundidad traslada la misma viga y calcula el sello efectivo con β; ese sello efectivo se usa para la mira objetivo. K y el cero horizontal no cambian las cotas ni HI. La nivelación puede calcularse aunque aún falte C, porque C no interviene en la geometría vertical.</p>
      <p>M1 tiene sello propio y otra cota objetivo opcional, sin fórmulas de tirantes. Sus N/E pueden ingresarse o dejarse ambas vacías para usar el punto medio E′–F′; la suposición queda indicada. La Z de coordenadas no sustituye al sello.</p>
      <p>Ajustar guarda al escribir y al cerrar con Guardar, ×, Escape o tocando fuera. Los datos incompletos se conservan y las salidas que los necesitan muestran «—». Exportar torre guarda las cinco fichas; importar un caso antiguo recupera su tirante activo y deja las C desconocidas de los demás pendientes.</p>
    </div></details>

    <details><summary>14 · Instalar, trabajar sin conexión y recibir actualizaciones</summary><div className="guide-content">
      <p>La app es una PWA: dispone de manifiesto de instalación, iconos y un service worker que guarda el HTML, JavaScript, estilos, tablas, dibujos y esta guía. Los cálculos se realizan en el dispositivo y no necesitan una API ni enviar datos a un servidor.</p>
      <ol><li>Ábrela con conexión y desde el dominio que vayas a usar en campo.</li><li>En la ayuda (?) espera «Disponible sin conexión». La indicación aparece cuando terminó de guardarse la versión completa; instalar el icono por sí solo no garantiza que haya finalizado esa descarga.</li><li>En Chrome o Edge usa «Instalar aplicación». En iPhone, abre en Safari y usa Compartir → Añadir a pantalla de inicio.</li><li>Antes de salir, prueba el modo avión: cierra y abre la app, cambia una profundidad y comprueba el resultado. Exporta los casos que necesites conservar.</li></ol>
      <p>La última torre se guarda en este dispositivo. Exportar torre genera un JSON con las cinco fichas, referencias, constantes y resultados; importarlo vuelve a calcular con esos datos. También puedes importar los antiguos casos individuales. Borrar datos del sitio, usar navegación privada o una limpieza del almacenamiento del dispositivo puede eliminar la sesión y la caché.</p>
      <h3>Qué ocurre al publicarse otra versión</h3>
      <p>Con conexión, la app comprueba actualizaciones al abrir, al volver a estar visible, al recuperar conexión y cada 15 minutos mientras está visible. Si encuentra un nuevo deploy, descarga sus archivos en una caché separada. Si la descarga falla, mantiene la versión anterior que ya funcionaba sin conexión.</p>
      <p>Cuando la siguiente versión termina de descargarse, se activa y la app se recarga automáticamente, conservando los datos de la última sesión. <strong>No necesitas Ctrl + F5, borrar la caché ni cerrar todas las pestañas.</strong> Las ventanas abiertas también pasan a la nueva versión. Con conexión, una recarga normal puede mostrar brevemente la versión guardada mientras descarga la nueva; al completar la descarga, la sustituye automáticamente. Sin conexión, sigue funcionando la última versión completa guardada.</p>
      <p>No se borra la sesión por actualizar la app. Los casos antiguos sin K se recuperan asignando 0,10 m. La detección de un deploy nuevo necesita internet y que el navegador permita ejecutar la app; no se promete una actualización en segundo plano cuando está completamente cerrada.</p>
      <p>El dominio pages.dev y un dominio personalizado tienen almacenamientos distintos. Si empiezas a usar lineastirantes.rumbo3d.com, ábrelo primero con conexión, espera su descarga e importa allí los JSON que necesites; la caché de pages.dev no se traslada automáticamente.</p>
    </div></details>

    <details><summary>15 · De dónde salen estos datos</summary><div className="guide-content">
      <p>El catálogo transcribe la Tabla 1 de seis láminas entregadas para esta obra. Los parámetros geotécnicos explicados arriba proceden de la Tabla 2 de GI6KL. Las referencias al papel de los especialistas y al diseño específico se apoyan en las notas de esas láminas; no se han convertido en reglas de asignación automática de suelo.</p>
      <ul>{(['GI6KL','G6KL','GR6KL'] as const).map(tower=><li key={tower}><strong>{tower}:</strong> {CATALOG[tower]['3'].sheet} y {CATALOG[tower]['4'].sheet}. Revisión {CATALOG[tower]['3'].revision}.</li>)}</ul>
      <p>La ficha de replanteo T574 aporta el ejemplo C1 = 26,219 m, φ = 35°27′00″ y β = 57°07′01″. Las tablas de fundación aportan sus β decimales y los pares H/X. El valor inicial de e y la constante K proceden de la práctica de campo indicada por el usuario.</p>
      <p>Las fórmulas se derivan de una recta de inclinación constante y, cuando corresponde, un terreno con pendiente constante. Las pruebas numéricas comparan las 27 transiciones suelo 3 → 4 de las tres familias y nueve pendientes; la diferencia frente a las tablas es inferior a 1,1 mm, compatible con su redondeo. Esa concordancia valida la relación geométrica implementada, no constituye una aprobación estructural de una modificación.</p>
      <p>Referencias de funcionamiento PWA: <a href="https://web.dev/articles/service-worker-lifecycle" target="_blank" rel="noreferrer">ciclo de vida del service worker, web.dev</a> y <a href="https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update" target="_blank" rel="noreferrer">comprobación de actualizaciones, MDN</a>. Estos enlaces externos requieren conexión; la explicación de esta guía está guardada en la app.</p>
    </div></details>
  </article>;
}
