# Metodología

## Pregunta y alcance

Se busca identificar qué segmentos y condiciones de entrega coinciden con mayor frecuencia de retrasos y evaluaciones bajas. La unidad principal es el pedido, para que los pedidos con varias filas de reseñas o productos no inflen los KPI generales.

## Fuentes

Del conjunto de Olist se usan `orders`, `order_reviews`, `customers`, `order_items`, `products` y `product_category_name_translation`. Se omite geolocalización porque este análisis no calcula rutas ni distancias.

## Preparación

1. Mantener pedidos con estado `delivered` y fecha de compra, entrega real y entrega estimada válidas.
2. Calcular la tardanza como diferencia entre días calendario de entrega real y estimada. Los valores mayores que cero son tardíos; cero o menos son puntuales/anticipados.
3. Agrupar las reseñas por pedido y usar el promedio si hay más de una fila. Mantener pedidos sin reseña para las métricas de entrega, pero excluirlos de las métricas de satisfacción.
4. Unir cliente para obtener el estado de destino.
5. Crear una lista distinta de categorías por pedido. En el análisis por categoría un pedido multicategoría se cuenta una vez por cada categoría presente.

## Métricas

- **Tasa tardía:** pedidos con fecha de entrega posterior a la fecha estimada / pedidos entregados con las tres fechas requeridas.
- **Demora media:** diferencia media de días calendario, solo entre los pedidos tardíos.
- **Promedio de reseña:** media del puntaje por pedido entre pedidos con reseña.
- **Tasa de reseña baja:** pedidos con promedio de reseña <= 2 / pedidos con reseña.
- **Tasa alta:** pedidos con promedio de reseña >= 4 / pedidos con reseña.

## Verificaciones de calidad

La corrida obtiene 99.441 filas de pedidos, 99.224 filas de reseñas, 96.470 pedidos entregados con fechas completas y 95.824 con reseña. Se detectan 547 pedidos con más de una fila de reseña. Todos los pedidos del universo tienen estado de cliente y al menos un artículo enlazado; 1.392 pedidos incluyen la categoría `unknown`, por falta de traducción o categoría no informada. Los scripts de análisis agregan reseñas y categorías antes de las comparaciones para evitar duplicaciones.
