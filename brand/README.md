# ZIFOS — Brand Guidelines

**Versión actual: v0.2 (borrador)** · Identidad, lenguaje y dirección artística.

> *Escribimos poemas que compilan.*

Esta carpeta es la fuente de verdad de la marca. Todo lo que se diseña, escribe o construye para ZIFOS —incluido este sitio— parte de acá.

## Índice

| # | Documento | Contenido |
|---|---|---|
| 01 | [Esencia](./01-esencia.md) | Quiénes somos, la leyenda del fuego |
| 02 | [Personalidad y posicionamiento](./02-personalidad.md) | Cómo somos y dónde nos paramos |
| 03 | [Voz y tono](./03-voz-y-tono.md) | Cómo escribimos, ejemplos de tono |
| 04 | [Logotipo](./04-logotipo.md) | Imagotipo, isotipo, logotipo |
| 05 | [Tipografía](./05-tipografia.md) | Los tres registros tipográficos |
| 06 | [Color](./06-color.md) | Paleta light/dark, proporciones, reglas |
| 07 | [Fotografía y universo gráfico](./07-fotografia-y-recursos.md) | Imágenes, recursos gráficos, qué evitamos |
| 08 | [Composición y dirección artística](./08-composicion.md) | Orden editorial, rupturas controladas |
| 09 | [Principios de marca](./09-principios.md) | Los seis principios, la frase final |

Recursos visuales van en [`assets/`](./assets/): logos en `assets/logo/` (ver [Logotipo](./04-logotipo.md#archivos)); fuentes, texturas y referencias en subcarpetas propias.

## Cómo actualizar

1. Editá el documento que corresponda. Un tema por archivo; si algo nuevo no encaja en ninguno, creá uno nuevo con el siguiente número y sumalo al índice.
2. Registrá el cambio en el [CHANGELOG](./CHANGELOG.md) y, si es relevante, subí la versión de arriba.
3. Si el cambio afecta al sitio (colores, tipografías, espaciados), actualizá también los tokens en `src/styles/theme.css.ts` en el mismo commit.

Versionado orientativo: **mayor** cuando cambia la identidad (logo, paleta, voz); **menor** para agregados o aclaraciones.
