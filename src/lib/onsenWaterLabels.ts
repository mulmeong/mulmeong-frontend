const COMPONENT_LABELS: Record<string, string> = {
  'Na-Cl': '나트륨·염화물',
  'Na-CO3': '나트륨·탄산염',
  'Na-HCO3': '나트륨·탄산수소염',
  'Ca-HCO3': '칼슘·탄산수소염',
  'S-Na': '황·나트륨',
}

export function normalizeWaterCode(value: string) {
  return value.trim().replaceAll('₃', '3').replaceAll('–', '-').replaceAll('−', '-')
}

export function waterCodeLabel(value: string) {
  const code = normalizeWaterCode(value)
  return Object.hasOwn(COMPONENT_LABELS, code) ? COMPONENT_LABELS[code] : undefined
}

export function waterPhLabel(ph: number, label?: string) {
  if (label) return label
  if (!Number.isFinite(ph) || ph < 0 || ph > 14) return '산성·알칼리성 지표'
  return ph < 7 ? '산성' : ph > 7 ? '알칼리성' : '중성'
}
