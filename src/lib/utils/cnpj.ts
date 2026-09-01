/**
 * Formata CNPJ de 14 digitos para xx.xxx.xxx/xxxx-xx
 */
export function formatarCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return cnpj
  return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`
}

/**
 * Remove mascara do CNPJ
 */
export function limparCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, '')
}

/**
 * Valida CNPJ
 */
export function validarCNPJ(cnpj: string): boolean {
  const c = cnpj.replace(/\D/g, '')
  if (c.length !== 14) return false
  if (/^(\d)\1{13}$/.test(c)) return false

  const calcDigito = (s: string, weights: number[]) => {
    const sum = s.split('').reduce((acc, d, i) => acc + parseInt(d) * weights[i], 0)
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }

  const w1 = [5,4,3,2,9,8,7,6,5,4,3,2]
  const w2 = [6,5,4,3,2,9,8,7,6,5,4,3,2]

  const d1 = calcDigito(c.slice(0,12), w1)
  const d2 = calcDigito(c.slice(0,13), w2)

  return parseInt(c[12]) === d1 && parseInt(c[13]) === d2
}
