# Guion de demo — RondaPro

Duración objetivo: **90 segundos** (corte principal).  
Variante extendida: **120 segundos**.  
Formato: **16:9 · 1280×720**.  
UI: **español**. Captions en pantalla: **español**.  
Audio: **sin narración** (el video se subtitula después).  
Ritmo: pausas cortas (0.4–0.8 s) en cada pantalla nueva; no correr el mouse.

## Antes de grabar

1. API + Mongo levantados. `npm run seed` en `apps/api`.
2. Usuarios:
   - `demo@rondapro.local` / `Demo1234!` (auditor)
   - `supervisor@rondapro.local` / `Demo1234!` (supervisor)
3. Sitio seed: `Store 12 — Palermo`.
4. Flutter **con** `DEMO_MODE=true` (el default es `false`; sin esto no aparece **Adjuntar fotos**):
   ```bash
   flutter run -d chrome --web-renderer html \
     --dart-define=API_BASE_URL=http://127.0.0.1:3000 \
     --dart-define=DEMO_MODE=true
   ```
5. Para vender IA de verdad, poné `GEMINI_API_KEY` en `apps/api/.env` **antes** de levantar la API. Si tu `.env` todavía tiene `GEMINI_MODEL=gemini-2.0-flash`, cambialo a `gemini-2.5-flash` o borralo (el default del repo ya es 2.5 + `thinkingBudget: 0`). No pegues la key en el video ni en el repo.
6. Las fotos de **Adjuntar fotos** son JPEG 640×480 (display promo + extintor). Si ves cuadrados de un color, no hiciste `git pull` de este commit.
7. Completá **una ronda de ensayo** (login → plantilla → fotos → completar → PDF) y borrala de la cabeza: esa pasada no se graba.
8. Ventana del browser a 1280×720. Ocultá bookmarks. `debugShowCheckedModeBanner` ya está en false.

### Captions en pantalla (esta grabación)

Usá captions. Texto exacto por escena, abajo.

### Resultado de la ronda (fijo)

| Ítem | Tipo | Obligatorio | Resultado |
|---|---|---|---|
| Entrada libre y limpia | Pasa/Falla | sí | **Pasa** |
| Notas de góndola | Texto | no | `Gondola de bebidas incompleta en cabecera` |
| Foto de display promo | Foto | sí | 1 foto (display) |
| Foto de extintor | Foto | sí | 1 foto (extintor) |
| Salida de emergencia despejada | Pasa/Falla | sí | **Falla** |

Hallazgos visibles al completar:

1. Manual: **Extintor vencido** · gravedad **Alta** · abierto.  
   Notas: `Fecha de recarga 03/2024. Colocado detras de cajas.`
2. Automático (el backend lo crea al fallar un bool):  
   **Check fallido: Salida de emergencia despejada** · gravedad **Media** · abierto.

Resumen:

- Con key: caption `Resumen IA · Gemini · gemini-2.5-flash · {N}ms`
- Fallback: caption `Resumen automático · heurístico`

---

## Corte A — 90 s (el que hay que grabar)

Usuario: **auditor** (`demo@rondapro.local`).  
Se muestra el login.  
Features opcionales en este corte: **PDF sí**. Supervisor/orden/notificaciones/Panel: **no**.

| # | t | Pantalla | Acción exacta | Caption |
|---|---|---|---|---|
| 1 | 0:00–0:08 | Login | Email ya viene precargado. Click **Entrar**. Esperar Home. | `RondaPro · auditorias de piso retail` |
| 2 | 0:08–0:16 | Plantillas | Click **Nueva plantilla**. | `Plantilla reutilizable para el equipo` |
| 3 | 0:16–0:38 | Nueva plantilla | Nombre: `Ronda de piso retail`. Descripción: `Walkthrough diario sucursal`. Reemplazá el ítem default y dejá exactamente estos 5 (en este orden): 1. `Entrada libre y limpia` · Pasa/Falla · obligatorio. 2. `Notas de gondola` · Texto · no obligatorio. 3. `Foto de display promo` · Foto · obligatorio. 4. `Foto de extintor` · Foto · obligatorio. 5. `Salida de emergencia despejada` · Pasa/Falla · obligatorio. Guardar. | `Checklist con texto, pasa/falla y foto` |
| 4 | 0:38–0:46 | Lista de plantillas | Click en `Ronda de piso retail`. En el diálogo: sitio `Store 12 — Palermo`. Nota de ubicación: `Pasillo 4 / deposito`. Click **Empezar**. | `Sitio + nota de ubicacion` |
| 5 | 0:46–1:08 | Inspección | Switch **Entrada libre y limpia** → Pasa. En Notas de góndola escribí `Gondola de bebidas incompleta en cabecera`. Click **Adjuntar fotos** (aparece porque `DEMO_MODE=true`). Click **Agregar hallazgo**. Título: `Extintor vencido`. Notas: `Fecha de recarga 03/2024. Colocado detras de cajas.` Gravedad: **Alta**. Guardar. Switch **Salida de emergencia despejada** → dejar en Pendiente/falla (no lo pases). | `2 evidencias + 1 hallazgo de alta` |
| 6 | 1:08–1:18 | Inspección → Detalle | Click **Completar ronda**. Esperar el resumen. Scroll lento 2 s sobre el caption + el texto. | caption de resumen (IA o heurístico, según key) |
| 7 | 1:18–1:28 | Detalle | Click ícono PDF en el AppBar. En web se descarga el PDF. Mostralo 2 s. | `PDF con fotos y caption por item` |
| 8 | 1:28–1:30 | Detalle | Hold 1 s. Frame final. | `RondaPro · inspeccion lista para el supervisor` |

Cierre: pantalla de **detalle de ronda completada**, con resumen visible. Frame final 1.5 s con título `RondaPro` y CTA `Repo en GitHub`.

---

## Corte B — 120 s (si querés mostrar rol supervisor)

Mismo resultado de ronda. Extra: orden + notificación + panel.

| # | t | Usuario | Pantalla | Acción | Caption |
|---|---|---|---|---|---|
| 1 | 0:00–0:08 | supervisor | Login | Cambiá el email a `supervisor@rondapro.local`, misma password, **Entrar**. | `Rol supervisor` |
| 2 | 0:08–0:22 | supervisor | Plantillas | Si no existe `Ronda de piso retail`, creala igual que en el corte A (comprimí ítems). Si ya existe, no la recréis. | `Misma plantilla para todo el equipo` |
| 3 | 0:22–0:32 | supervisor | Plantillas | Ícono de orden (assignment) en la card. Sitio `Store 12 — Palermo`. Auditor `Demo Auditor`. Nota `Pasillo 4 / deposito`. **Enviar orden**. | `Orden de inspeccion al auditor` |
| 4 | 0:32–0:38 | supervisor | AppBar | Campana de notificaciones. Mostrar la orden. Volver. | `El auditor recibe la orden` |
| 5 | 0:38–0:46 | — | Login | Salir. Entrar como `demo@rondapro.local`. | `Cambio a auditor` |
| 6 | 0:46–0:52 | auditor | Historial | Abrir la ronda `in_progress` asignada. | `Ronda asignada, lista para ejecutar` |
| 7 | 0:52–1:22 | auditor | Inspección | Igual que escena 5 del corte A + **Completar ronda**. | mismas captions |
| 8 | 1:22–1:32 | auditor | Detalle | PDF. | `Informe con evidencias embebidas` |
| 9 | 1:32–1:38 | auditor | Panel | Tab **Panel**. Scroll 2 s. | `Tablero de hallazgos abiertos` |
| 10 | 1:38–2:00 | auditor | Panel / Detalle | Volvé al detalle 1 s. Frame final. | `RondaPro · de la orden al PDF` |

---

## Texto que se tipea (copiar/pegar)

```
Plantilla
  Ronda de piso retail
  Walkthrough diario sucursal

Ítems
  Entrada libre y limpia          Pasa/Falla   obligatorio
  Notas de gondola                Texto        no
  Foto de display promo           Foto         obligatorio
  Foto de extintor                Foto         obligatorio
  Salida de emergencia despejada  Pasa/Falla   obligatorio

Sitio
  Store 12 — Palermo

Nota de ubicación
  Pasillo 4 / deposito

Notas de góndola
  Gondola de bebidas incompleta en cabecera

Hallazgo
  Extintor vencido
  Fecha de recarga 03/2024. Colocado detras de cajas.
  Alta
```

Acentos: la UI está en español, pero el PDF dobla a ASCII (`gondola`, `deposito`). Escribí sin tildes en los campos libres para que el PDF y la UI coincidan en el video.

---

## Checklist de grabación

- [ ] Seed corrido
- [ ] Ensayo completo hecho (no se graba)
- [ ] Key de Gemini cargada **o** decisión consciente de mostrar heurístico
- [ ] `DEMO_MODE=true` (si no, el botón **Adjuntar fotos** no aparece y en web no hay cámara)
- [ ] Si tu `.env` tenía `GEMINI_MODEL=gemini-2.0-flash`, cambialo o borralo y reiniciá la API
- [ ] 1280×720, 16:9
- [ ] Captions listos en el editor (CapCut / Premiere)
- [ ] No se ve `.env`, terminal con keys, ni `Agregar 2 fotos de demo`
- [ ] Al completar hay **2 fotos** y el botón no está disabled
- [ ] El PDF se descarga en web y muestra `Evidencia: Foto de display promo` y `Evidencia: Foto de extintor`
- [ ] Frame final 1.5 s

Si grabás en emulador Android y una foto se ve rota, relanzá con `--no-enable-impeller`.
