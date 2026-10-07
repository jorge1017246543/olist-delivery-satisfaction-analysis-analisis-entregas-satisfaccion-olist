# Hallazgos

Los resultados completos están en `data/processed/`. Los porcentajes se redondean a dos decimales.

## 1. La tardanza coincide con peores reseñas

| Entrega | Pedidos con reseña | Puntaje medio | Reseña baja (1–2) |
|---|---:|---:|---:|
| A tiempo o antes | 89.443 | 4,29 | 9,23% |
| Tarde | 6.381 | 2,27 | 62,36% |

La diferencia de reseña baja es 53,13 puntos porcentuales y el cociente de tasas es 6,76. Aunque solo 6,77% del universo de entregas fue tardío, esos pedidos representan 32,52% de todas las reseñas bajas. El atraso medio de los pedidos tardíos fue 10,62 días.

## 2. El riesgo crece con la duración del atraso

| Días de atraso | Pedidos con reseña | Puntaje medio | Reseña baja |
|---|---:|---:|---:|
| 0 o menos | 89.443 | 4,29 | 9,23% |
| 1–3 | 1.852 | 3,29 | 32,18% |
| 4–7 | 1.748 | 2,11 | 67,56% |
| 8–14 | 1.446 | 1,67 | 80,08% |
| 15+ | 1.335 | 1,73 | 78,20% |

La caída más fuerte ocurre entre 1–3 y 4–7 días. La tasa no aumenta más en el tramo 15+; puede influir la composición de pedidos y la falta de reseñas, por lo que no conviene presentar la curva como lineal.

## 3. Dónde priorizar una revisión operativa

Entre estados con al menos 500 entregas, MA tiene la mayor tasa tardía: 17,43% en 717 pedidos. CE registra 13,76% en 1.279 y BA 12,16% en 3.256. RJ tiene 12,11% en 12.350 pedidos y el mayor volumen tardío: 1.495. Estas cifras sugieren revisar rutas, promesas de entrega y desempeño de vendedores/transportistas de esos destinos; no identifican cuál factor explica el resultado.

Por categoría, `office_furniture` tiene 21,95% de reseñas bajas en 1.254 pedidos, frente a 12,77% general; su tasa tardía es 8,05%. Esta diferencia apunta a una línea de investigación sobre producto, empaque, daños o expectativas de descripción, además de la logística.

## 4. Cambios temporales

Los periodos con más volumen de 2017 muestran 12,40% de entregas tardías en noviembre (7.288 pedidos). En 2018, febrero presenta 14,13% (6.555) y marzo 18,96% (7.003). Son señales para revisar el contexto de capacidad y demanda, no evidencia de estacionalidad causal: el dataset no incluye promociones, capacidad logística ni eventos operativos.

## Acciones sugeridas

1. Crear una alerta operativa al superar la fecha estimada y una prioridad de contacto/investigación al llegar a 4 días de atraso.
2. Analizar los destinos MA, CE, BA y RJ con volumen, separando vendedores, transportistas y distancia en una segunda iteración.
3. Revisar reseñas y devoluciones de `office_furniture` para distinguir logística de calidad/daño del producto.
4. Comparar periodos de alto volumen antes de cambiar promesas o capacidad; usar datos más recientes para validar que el patrón siga vigente.
