# Guía del dashboard en Power BI

## Páginas

### 1. Resumen ejecutivo

- Tarjetas: pedidos entregados, tasa de atraso, demora media de pedidos tardíos, puntaje medio y tasa de reseñas bajas.
- Barras: reseña baja (%) por grupo de atraso (`delay_bands.csv`).
- Línea: tasa tardía y puntaje por mes (`monthly_summary.csv`); excluir meses con menos de 500 pedidos.
- Segmentadores: mes de compra y estado del cliente. Para interacciones por mes/estado, usar `order_delivery_review.csv`.

### 2. Segmentos de riesgo

- Barras horizontales por estado: tasa tardía y volumen. Filtrar a al menos 500 pedidos.
- Barras por categoría: tasa de reseña baja y volumen. Filtrar a al menos 500 pedidos.
- Añadir etiquetas con el número de pedidos para evitar rankings engañosos de grupos pequeños.

### 3. Detalle

- Tabla de pedidos: mes, estado, `delivery_days`, `days_late`, `review_score` y `delivery_status`.
- Permitir filtrar atrasos y reseñas bajas para explorar casos.
- No publicar identificadores individuales de pedido en un dashboard abierto.

## Importación

Tras ejecutar `node scripts/analyze.mjs`, usa **Obtener datos > Texto/CSV** para importar:

- `data/processed/order_delivery_review.csv`
- `data/processed/monthly_summary.csv`
- `data/processed/state_summary.csv`
- `data/processed/category_summary.csv`
- `data/processed/delay_bands.csv`

Las tablas agregadas se usan en los visuales de resumen por mes, estado y categoría. El detalle de pedido conserva una fila por pedido, por eso sus tarjetas generales no duplican conteos.

## Medidas DAX para la tabla `order_delivery_review`

```DAX
Pedidos entregados = COUNTROWS(order_delivery_review)

Pedidos tardíos =
CALCULATE(
    [Pedidos entregados],
    order_delivery_review[days_late] > 0
)

Tasa de atraso = DIVIDE([Pedidos tardíos], [Pedidos entregados])

Pedidos con reseña =
CALCULATE(
    [Pedidos entregados],
    NOT ISBLANK(order_delivery_review[review_score])
)

Puntaje medio = AVERAGE(order_delivery_review[review_score])

Reseñas bajas =
CALCULATE(
    [Pedidos con reseña],
    order_delivery_review[review_score] <= 2
)

Tasa de reseñas bajas = DIVIDE([Reseñas bajas], [Pedidos con reseña])

Demora media (días) =
AVERAGEX(
    FILTER(order_delivery_review, order_delivery_review[days_late] > 0),
    order_delivery_review[days_late]
)
```

Da formato porcentual a las tasas. `late_rate_pct` y otros porcentajes en los CSV agregados ya vienen en escala 0–100; no vuelvas a multiplicarlos por 100.
