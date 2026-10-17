# 06. Color

La identidad es fundamentalmente monocromática, con apariciones controladas de calor.

**Negro, blanco cálido, gris, sangre y bronce.** Los pasteles suavizan el conjunto sin convertirlo en una identidad colorida.

## Paleta

| Función | Light | Dark |
|---|---|---|
| Fondo | `#F5F1EA` | `#0F0F10` |
| Superficie | `#EAE4DB` | `#1A1A1C` |
| Texto | `#171717` | `#F3EEE6` |
| Secundario | `#8C857C` | `#A8A096` |
| Borde | `#CFC8BE` | `#2B2B2F` |
| Fuego / sangre | `#B53A2F` | `#C64638` |
| Bronce / oro viejo | `#A67C45` | `#B58A52` |
| Rosa ceniza | `#D8C1B8` | `#B89A94` |

## Proporción orientativa

- **70%** neutros principales
- **20%** grises y tonos intermedios
- **10%** acentos

## Reglas

El rojo expresa el fuego, la energía y la acción. El bronce aporta oficio y nobleza material. Nunca deben competir por protagonismo.

El oro es un detalle, no una demostración de estatus. Evitamos dorados brillantes, degradados metálicos artificiales y estéticas de lujo ostentoso.

## En el código

La paleta vive como tokens en [`src/styles/theme.css.ts`](../src/styles/theme.css.ts). Cada token usa `light-dark()`, así que un solo nombre cubre ambos modos. Nunca escribir un hex en un estilo: usar siempre el token.

| Función | Token |
|---|---|
| Fondo | `vars.color.background` |
| Superficie | `vars.color.surface` |
| Texto | `vars.color.text` |
| Secundario | `vars.color.textSecondary` |
| Borde | `vars.color.border` |
| Fuego / sangre | `vars.color.fire` |
| Bronce / oro viejo | `vars.color.bronze` |
| Rosa ceniza | `vars.color.ash` |

Si cambia la paleta, actualizar esta tabla y el archivo de tokens en el mismo commit.
