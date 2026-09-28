// New multi-duty grants are authoritative; legacy single-duty profiles remain readable.
export function configuredLevels(person = {}) {
  return Array.isArray(person.levels) ? person.levels : [person.level === '全厂' ? '部门' : person.level || '无'].filter(v => v !== '无')
}
export function configuredRoles(person = {}) {
  return Array.isArray(person.permissionRoles) ? person.permissionRoles : [person.permissionRole || (person.isAdmin || ['系统管理员','厂长','管理员'].includes(person.role) ? '管理员' : configuredLevels(person).length ? '审核者' : '员工')]
}
export function dutyScopes(person, departments, duty) {
  if (Array.isArray(person.levels)) return person.levelScopes?.[duty] || []
  const did = person.departmentId || 'heat-treatment'
  const named = String(person.scope || '').split(/[、,，;；\n]/).map(v => v.trim()).filter(Boolean)
  if (duty === '公司') return ['*']
  if (duty === '部门') return [did]
  if (['评审员','精益专员'].includes(duty)) {
    const ids = departments.filter(d => named.includes(d.name)).map(d => d.id)
    return person.departmentScopes?.length ? person.departmentScopes : ids.length ? ids : [did]
  }
  return named.length && !named.some(v => ['本人','班组','本班组','工段','本工段'].includes(v)) ? named : [person[duty === '班组' ? 'team' : 'section']].filter(Boolean)
}
export function permissionDraft(person, departments) {
  const levels = configuredLevels(person)
  return { permissionRoles: configuredRoles(person), levels, levelScopes: Object.fromEntries(levels.map(level => [level, [...dutyScopes(person, departments, level)]])) }
}
export function permissionFields(draft, departments) {
  const names = new Map(departments.map(d => [d.id, d.name]))
  const scope = draft.levels.map(level => `${level}：${draft.levelScopes[level].map(id => id === '*' ? '全公司' : names.get(id) || id).join('、')}`).join('；') || '本人'
  const roles = draft.permissionRoles
  return { ...JSON.parse(JSON.stringify(draft)), level:draft.levels[0] || '无', scope,
    permissionRole:roles.includes('审核者') ? '审核者' : roles.includes('管理员') ? '管理员' : '员工',
    isAdmin:roles.includes('管理员'), departmentScopes:[...new Set(draft.levels.filter(l => ['评审员','精益专员'].includes(l)).flatMap(l => draft.levelScopes[l]))] }
}
