import { RadioTower } from 'lucide-react';

// Cloudflare Pages sirve 404.html para rutas como //v2 o /v2/index (enlaces copiados a mano).
// Se corrige la ruta antes de mostrar el error: barras repetidas y barra final de las páginas.
const fixPath = `(function(){var l=location,p=l.pathname,c=p.replace(/\\/{2,}/g,'/').replace(/\\/index(\\.html)?$/,'/');if(!/\\/$|\\.[a-z0-9]+$/i.test(c))c+='/';if(c!==p)l.replace(c+l.search+l.hash);})();`;

export default function NotFound() {
  return <>
    <script dangerouslySetInnerHTML={{ __html: fixPath }} />
    <header className="app-header"><a className="brand" href="/" aria-label="Líneas y Tirantes, inicio"><span className="brand-mark"><RadioTower size={23} strokeWidth={1.4} /></span><span>Líneas <span className="brand-amp">&</span> Tirantes</span></a></header>
    <main className="tower-app not-found">
      <h1>Página no encontrada</h1>
      <p>Revisa la dirección. Las pantallas disponibles son:</p>
      <ul><li><a href="/">Replanteo y Nivelación</a></li><li><a href="/v2/">Templado de conductores (vista previa)</a></li></ul>
    </main>
  </>;
}
