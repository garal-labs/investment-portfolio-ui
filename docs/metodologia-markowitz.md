# Cómo se calcula la frontera eficiente de Markowitz

Este documento explica, paso a paso, cómo se obtiene la frontera eficiente de Markowitz que muestra la página de Markowitz, con las fórmulas necesarias para reproducir cada cifra a partir de los precios.

## Índice

1. Qué responde la página de Markowitz
2. Qué posiciones entran y cuáles se excluyen
3. Datos y ventana temporal
4. Rentabilidades y estadísticas por activo
5. Rentabilidad y riesgo de una cartera
6. Cartera actual y cartera de mínima varianza
7. Frontera eficiente
8. Cómo leer el gráfico
9. Importes de rebalanceo
10. Limitaciones

### Notación

| Símbolo | Significado |
|---|---|
| $N$ | Número de activos analizados |
| $n$ | Número de meses con datos comunes a todos los activos |
| $P_{i,t}$ | Cierre mensual ajustado del activo $i$ en el mes $t$, en su moneda de cotización |
| $r_{i,t}$ | Rentabilidad simple del activo $i$ en el mes $t$ |
| $\mu_i$ | Rentabilidad esperada del activo $i$ |
| $\Sigma$ | Matriz de covarianzas entre los activos |
| $w_i$ | Peso del activo $i$ en una cartera |

---

## 1. Qué responde la página de Markowitz

Dadas tus posiciones abiertas, la página de Markowitz responde a esta pregunta: **¿qué combinaciones de esos mismos activos tienen el menor riesgo posible para cada nivel de rentabilidad esperada, y dónde queda tu cartera actual respecto a ellas?**

Convenios del cálculo:

- Todas las cifras son **mensuales**, no anualizadas.
- La rentabilidad esperada es la **media histórica**; el riesgo es la **volatilidad histórica** (desviación típica).
- Las carteras propuestas son **solo largas**: cada peso está entre 0 % y 100 % y la suma es 100 %. No hay ventas en corto ni apalancamiento.

---

## 2. Qué posiciones entran y cuáles se excluyen

Entran las posiciones abiertas de la cartera. Si dos posiciones comparten ticker, se suman y se tratan como un único activo. Se necesitan **al menos 2 activos** válidos.

Una posición queda fuera del cálculo, y aparece en el aviso de activos excluidos, por alguno de estos motivos:

| Motivo | Qué significa |
|---|---|
| sin ticker | El instrumento no tiene ticker, por lo que no se pueden obtener sus precios. |
| sin precio actual | No hay un precio actual válido, y por tanto no se conoce su valor. |
| sin tipo de cambio | El precio está en otra moneda y no hay tipo de cambio actual a euros; su valor en euros es desconocido. |
| sin histórico de precios | No se han obtenido cierres mensuales utilizables para el activo. |
| histórico insuficiente | El activo tiene menos de 12 rentabilidades mensuales propias. Los meses sin dato no cuentan. |

Los activos con histórico insuficiente se excluyen antes de alinear los meses: de lo contrario, un único activo recién cotizado reduciría el análisis de toda la cartera.

El aviso indica qué porcentaje del valor de la cartera queda fuera:

$$
\text{peso excluido} = \frac{V_{\text{total}} - V_{\text{incluido}}}{V_{\text{total}}}
$$

donde $V_{\text{total}}$ es el valor en euros de las posiciones con valor conocido y $V_{\text{incluido}}$ el de las que entran en el análisis. Las posiciones sin ticker, sin precio actual o sin tipo de cambio no tienen valor en euros conocido y no cuentan en $V_{\text{total}}$.

---

## 3. Datos y ventana temporal

- **Frecuencia mensual.** Se usa el cierre de cada mes, ajustado por dividendos y splits, de modo que la rentabilidad incluye los dividendos.
- **Ventana.** Los últimos 3, 5 o 10 años según el selector, terminando en el **último mes completo**. El mes en curso nunca se utiliza.
- **Moneda.** Los precios se mantienen en la moneda de cotización de cada activo; no se convierten a euros.

---

## 4. Rentabilidades y estadísticas por activo

**Rentabilidad simple mensual.** Se calcula solo entre dos cierres de meses consecutivos:

$$
r_{i,t} = \frac{P_{i,t}}{P_{i,t-1}} - 1
$$

Si falta el cierre de un mes, no se calcula la rentabilidad de ese mes ni la del siguiente: nunca se reúnen dos meses en uno.

**Meses comunes.** Solo se usan los meses con rentabilidad para todos los activos. Un mes ausente en cualquiera de ellos se descarta para todos, y hacen falta al menos 12 meses comunes.

**Rentabilidad esperada** (media muestral):

$$
\mu_i = \frac{1}{n} \sum_{t=1}^{n} r_{i,t}
$$

**Covarianza muestral**, con denominador $n-1$:

$$
\Sigma_{ij} = \frac{1}{n-1} \sum_{t=1}^{n} \left(r_{i,t} - \mu_i\right)\left(r_{j,t} - \mu_j\right)
$$

**Volatilidad** (riesgo) y **correlación**:

$$
\sigma_i = \sqrt{\Sigma_{ii}}
\qquad\qquad
\rho_{ij} = \frac{\Sigma_{ij}}{\sigma_i\,\sigma_j}
$$

La correlación va de −1 a 1: cuanto menor es, más se compensan los movimientos de los dos activos y más diversificación aportan juntos.

---

## 5. Rentabilidad y riesgo de una cartera

Para una cartera con pesos $w$ (que suman 1):

$$
R_p = w^{\top}\mu = \sum_i w_i\,\mu_i
$$

$$
\sigma_p^2 = w^{\top}\Sigma\, w = \sum_i \sum_j w_i\, w_j\, \Sigma_{ij}
\qquad\qquad
\sigma_p = \sqrt{\sigma_p^2}
$$

La rentabilidad de la cartera es la media ponderada de las rentabilidades de los activos. Su riesgo no es la media ponderada de las volatilidades: depende también de las covarianzas, y por eso combinar activos poco correlacionados reduce el riesgo.

---

## 6. Cartera actual y cartera de mínima varianza

**Cartera actual.** Sus pesos salen del valor en euros de cada posición incluida:

$$
w_i^{\text{actual}} = \frac{V_i}{\sum_j V_j}
$$

La suma solo recorre los activos incluidos, de modo que los pesos se reescalan para sumar 100 %.

**Cartera de mínima varianza.** Es la combinación de activos con el menor riesgo posible:

$$
\begin{aligned}
\min_{w}\quad & w^{\top}\Sigma\, w \\
\text{sujeto a}\quad & \sum_i w_i = 1 \\
& 0 \le w_i \le 1
\end{aligned}
$$

---

## 7. Frontera eficiente

La frontera eficiente es el conjunto de carteras con el **mínimo riesgo para cada rentabilidad objetivo**.

1. Se calcula la cartera de mínima varianza, con rentabilidad $R_{\text{mín}}$.
2. La rentabilidad máxima alcanzable $R_{\text{máx}}$ es la del activo con mayor rentabilidad esperada (sin ventas en corto, no se puede superar).
3. Entre $R_{\text{mín}}$ y $R_{\text{máx}}$ se fijan rentabilidades objetivo $R^{\ast}$ equiespaciadas.
4. Para cada una se busca la cartera de menor varianza que alcance esa rentabilidad:

$$
\begin{aligned}
\min_{w}\quad & w^{\top}\Sigma\, w \\
\text{sujeto a}\quad & \sum_i w_i = 1 \\
& w^{\top}\mu = R^{\ast} \\
& 0 \le w_i \le 1
\end{aligned}
$$

El primer punto de la frontera es siempre la cartera de mínima varianza y el último concentra todo en el activo de mayor rentabilidad esperada. Si algún punto no puede resolverse, se omite, por lo que la frontera puede tener algunos puntos menos de los previstos.

---

## 8. Cómo leer el gráfico

- El **eje horizontal** es el riesgo (volatilidad mensual) y el **vertical** la rentabilidad esperada mensual.
- La **curva** es la frontera eficiente: ninguna combinación de tus activos queda por encima de ella con el mismo riesgo.
- Un **punto de la frontera** se elige como cartera objetivo. Por defecto se propone el de riesgo más cercano al de tu cartera actual, que normalmente ofrece más rentabilidad esperada con un riesgo similar.
- Si tu cartera actual queda **por debajo** de la curva, existe una combinación con la misma rentabilidad esperada y menos riesgo, o con el mismo riesgo y más rentabilidad.
- El primer punto es la cartera de mínima varianza.

---

## 9. Importes de rebalanceo

Para pasar de la cartera actual a la cartera objetivo elegida, la diferencia de peso de cada activo y el importe a mover son:

$$
d_i = w_i^{\text{objetivo}} - w_i^{\text{actual}}
\qquad\qquad
\text{importe}_i = (w_i^{\text{objetivo}} - w_i^{\text{actual}}) \times V_{\text{incluido}}
$$

donde $V_{\text{incluido}}$ es el valor en euros de los activos incluidos en el análisis.

- Un importe positivo es una **compra** y uno negativo una **venta**.
- Si la diferencia de peso es inferior a 0,5 puntos porcentuales, la acción se muestra como **mantener**.
- Como ambos conjuntos de pesos suman 100 %, los importes se compensan: el rebalanceo no requiere aportar ni retirar dinero.
- Las posiciones excluidas no se mueven.
- Solo se calculan importes en euros, no número de títulos.

---

## 10. Limitaciones

- **Estimaciones históricas.** La rentabilidad esperada y las covarianzas se calculan con datos pasados y no garantizan resultados futuros. La media de pocos años tiene un error de estimación elevado.
- **Cifras mensuales.** No se anualizan.
- **Concentración.** La optimización no impone límites a los pesos individuales y tiende a concentrarse en los activos con mayor rentabilidad histórica; la frontera es sensible a ese ruido.
- **Sin efecto del tipo de cambio.** Las rentabilidades se calculan en la moneda de cotización de cada activo; los pesos, en euros.
- **Sin costes ni impuestos.** Los importes de rebalanceo son teóricos y no incluyen comisiones, impuestos ni restricciones de lote.
- **Universo cerrado.** Solo se combinan los activos que ya están en la cartera y superan las exclusiones.
- **Ventana común.** El activo con menos histórico limita la ventana de todos.
- **Sin ventas en corto, apalancamiento ni activo libre de riesgo.**

> Este cálculo es informativo y no constituye asesoramiento de inversión.
