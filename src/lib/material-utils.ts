export function calcularPrecioMaterial(
  costoDirecto: number,
  tipoMargen: string,
  valorMargen: number,
  redondeo: string,
  redondeoMultiplo: number
): number {
  let precio =
    tipoMargen === 'porcentaje'
      ? costoDirecto * (1 + valorMargen / 100)
      : costoDirecto + valorMargen;

  if (redondeo !== 'ninguno' && redondeoMultiplo > 0) {
    switch (redondeo) {
      case 'superior':
        precio = Math.ceil(precio / redondeoMultiplo) * redondeoMultiplo;
        break;
      case 'inferior':
        precio = Math.floor(precio / redondeoMultiplo) * redondeoMultiplo;
        break;
      case 'mas_cercano':
        precio = Math.round(precio / redondeoMultiplo) * redondeoMultiplo;
        break;
    }
  }

  return precio;
}
