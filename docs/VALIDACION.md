# Validación de la entrega

Comprobado en el entorno local del proyecto:

- `npm run build`: exportación estática correcta; todas las rutas son estáticas.
- TypeScript estricto: compilación correcta.
- `npm test`: 11 pruebas correctas. Incluyen 27 transiciones entre los suelos 3 y 4 y las nueve pendientes de cada familia.
- Las diferencias frente a las X tabuladas son inferiores a 1,1 mm, considerando su redondeo.
- Navegador de escritorio: perfil, planta, carga de G6KL, tabla y exportación de caso JSON verificados.
- Diseño prioritario para smartphone: verificado en anchos de 360, 393 y 430 px; revisión adicional en 768 px y laptop de 1366 px. Sin desbordamiento horizontal de la página o del dibujo.
- Controles móviles de al menos 44 × 44 px, campos de 16 px o más, anclaje adaptado al ancho y barra inferior con X₁ / C + X₁.
- Acceso «Ajustar» y botones de profundidad comprobados: el resultado principal y la barra inferior se actualizan juntos.
- Prueba offline real del paquete: servidor HTTP detenido, fallo de conexión confirmado desde fuera del navegador, recarga correcta desde service worker y cálculo de profundidad → X / X → profundidad sin servidor.
- Entrada por cota de sello: Zt₀ = 100 m, Zs₁ = 96 m devuelve X₁ = 2,440 m, H₁ local = 3,972 m y H₁ con datum fijo = 4,000 m.
- En el ejemplo, H₁ = 3,50 m devuelve X₁ = 2,117 m. La operación inversa con X₁ redondeada a 2,460 m devuelve H₁ = 4,001 m; la diferencia milimétrica es consecuencia del redondeo de la referencia.
- ZIP inspeccionado: `index.html`, `_next/static`, `sw.js`, manifiesto, iconos y `_headers` presentes en la raíz esperada.

No se ha desplegado el sitio ni configurado el DNS del dominio. No se ha comprobado la instalación en un dispositivo Android/iOS físico. Los resultados y las coordenadas locales usan exclusivamente C + X₁ hasta el borde de la viga. Los casos anteriores se recuperan descartando el antiguo desplazamiento al centro.

La prueba de teléfono corresponde al tamaño de pantalla emulado en navegador.

Capturas: `docs/screenshots/mobile-393.png` y `docs/screenshots/desktop.png`.
