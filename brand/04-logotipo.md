# 04. Logotipo

## Concepto de la identidad visual

**Un garabato sobre una pintura de colección. Un diagrama dibujado en el vidrio de un BMW. Un abrazo informal en una reunión de traje.**

La identidad vive en la tensión entre lo refinado y lo espontáneo.

Una composición impecable puede convivir con una corrección hecha a mano. Una tipografía sofisticada puede acompañarse de código, tachaduras, flechas o notas improvisadas.

La imperfección es deliberada, pero nunca descuidada.

## Imagotipo

Combina tres símbolos:

- **Las llaves `{ }`:** una referencia directa a JavaScript, nuestro universo técnico y la idea de contener posibilidades.
- **Los tres puntos:** los socios fundadores, individuos con identidades propias que comparten una base.
- **La llama:** la fuerza colectiva que emerge de esa unión. Orgánica, ascendente, expresiva y abstracta.

## Isotipo

Utiliza dos trazos de fuego refinados, tres puntos y llaves tipográficas. No representa personas literalmente.

## Logotipo

El logotipo «zifos» utiliza una serif de alto contraste, elegante y con personalidad editorial.

Debe conservar su legibilidad y carácter tanto en pequeñas aplicaciones monocromáticas como en composiciones de gran formato.

## Archivos

En [`assets/logo/`](./assets/logo/). Todos usan `fill="currentColor"`: toman el color del texto que los rodea, así que funcionan en light y dark sin variantes.

| Archivo | Contenido | Uso |
|---|---|---|
| `zifos-logo.svg` | Imagotipo completo: `{ llama · · · }` + «zifos» | Uso principal |
| `zifos-logo-small.svg` | Imagotipo con el wordmark un poco más espaciado | Tamaños reducidos (menos de ~200px de ancho): a escala chica el espaciado original se siente apretado |
| `zifos-isotipo.svg` | Solo el símbolo | Espacios reducidos, avatares, favicon |
| `zifos-wordmark.svg` | Solo «zifos» | Cuando el símbolo ya está presente |
| `source/zifos-logo-original.svg` | SVG fuente (lienzo completo 2508×627) | Origen de los tres SVG de arriba |
| `source/zifos-logo-original.png` | PNG original (2508×627) | Referencia, no usar en producción |

> **Pendiente:** `source/zifos-logo-original.svg` es una vectorización automática (potrace) del PNG, no el vector original de diseño. Los tres SVG y `public/favicon.svg` se derivan de él: se recorta el lienzo, se separa símbolo y wordmark, y se usa `currentColor`. Cuando exista el vector original del diseñador, reemplazar el fuente y correr `pnpm brand:logo` para regenerar los derivados (script: `scripts/build-logo.mjs`).

En el sitio se importan como componentes: `import Logo from "@brand/assets/logo/zifos-logo.svg"`.
