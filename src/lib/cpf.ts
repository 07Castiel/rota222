export function normalizarCpf(valor: string): string {
  return (valor ?? "").replace(/\D/g, "");
}

export function cpfValido(valor: string): boolean {
  const cpf = normalizarCpf(valor);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digito = (base: string, pesoInicial: number) => {
    let soma = 0;
    for (let i = 0; i < base.length; i++) {
      soma += Number(base[i]) * (pesoInicial - i);
    }
    const resto = (soma * 10) % 11;
    return resto === 10 ? 0 : resto;
  };

  const d1 = digito(cpf.slice(0, 9), 10);
  if (d1 !== Number(cpf[9])) return false;
  const d2 = digito(cpf.slice(0, 10), 11);
  return d2 === Number(cpf[10]);
}

export function formatarCpf(valor: string): string {
  const cpf = normalizarCpf(valor).slice(0, 11);
  return cpf
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}
