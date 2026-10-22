import { ArrowUpRight, WifiOff } from 'lucide-react';

export function AppHelp({offlineText,onReferences}:{offlineText:string;onReferences:()=>void}){
  return <>
    <h2 id="modal-title">Líneas &amp; Tirantes</h2>
    <p>Herramienta de topografía para el replanteo y la nivelación de los cuatro tirantes y el mástil central de una torre.</p>
    <ol className="about-steps">
      <li><strong>Prepara la torre.</strong> En Ajustes, revisa las referencias, el suelo y el diseño. Para nivelar, completa los sellos, la referencia del nivel y su vista (+).</li>
      <li><strong>Selecciona el punto.</strong> Elige T1–T4 o MC en la barra inferior. Cada punto conserva sus datos.</li>
      <li><strong>Replantea.</strong> En Replanteo, elige E′/F′ y el cero R41/R32 para consultar la distancia al borde y el giro horario. Abre Ajuste de terreno si cambia la excavación.</li>
      <li><strong>Controla la excavación.</strong> En Nivelación, consulta la mira al sello e ingresa la vista actual: + ↓ indica falta de excavación; − ↑, exceso.</li>
    </ol>
    <p>Los cambios se guardan en este dispositivo. Exporta o importa una copia JSON desde Ajustes → Archivos de torre.</p>
    <div className="install-state"><WifiOff size={19}/>{offlineText}</div>
    <button className="text-button about-details" onClick={onReferences}>Ver fórmulas y referencias<ArrowUpRight size={14}/></button>
  </>;
}
