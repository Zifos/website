# 05. Tipografía

Tres registros complementarios:

| # | Registro | Uso | Aporta |
|---|---|---|---|
| 1 | **Serif editorial de alto contraste** | Títulos, manifiestos, frases memorables | Sofisticación y sensibilidad |
| 2 | **Sans serif contemporánea** | Textos funcionales, navegación, interfaces, comunicación comercial | Claridad y pragmatismo |
| 3 | **Monoespaciada y manuscrita** | Fragmentos de código, diagramas, notas, comentarios, pequeñas intervenciones irreverentes | Ruptura, humanidad |

La tipografía construye la sofisticación. Las anotaciones humanas rompen su rigidez.

## Familias elegidas

| Registro | Familia | Pesos / estilos | Token | Fuente |
|---|---|---|---|---|
| Serif (títulos) | **Instrument Serif** | 400 · normal e itálica | `vars.font.serif` | Google Fonts (OFL) |
| Sans (texto, interfaz) | **DM Sans** | variable 100–1000 · normal e itálica | `vars.font.sans` | Google Fonts (OFL) |
| Mono (código, notas) | **IBM Plex Mono** | 400, 500 · normal | `vars.font.mono` | Google Fonts (OFL) |
| Manuscrita | _Pendiente_ | — | — | — |

Todos los títulos (`h1`–`h6`) usan Instrument Serif; el cuerpo usa DM Sans; `code`, `pre`, `kbd` y `samp` usan IBM Plex Mono.

En el sitio se configuran en `astro.config.ts` (`fonts`): se descargan de Google Fonts al compilar y se sirven desde nuestro dominio, sin pedidos a Google en el navegador. Sumar un peso o estilo se hace ahí; no cargar fuentes por otro medio.
