export const PROPOSAL_TYPES = [
  {
    value: 'lean', label: '精益提案', shortLabel: '精益提案', icon: 'bulb', badge: '效率与价值',
    description: '适合流程、质量、成本、现场管理等可量化改善。',
    points: ['改善前后证据', '项目类型与节省金额']
  },
  {
    value: 'six', label: '六源改善提案', shortLabel: '六源改善', icon: 'recycle', badge: '现场问题闭环',
    description: '适合污染、故障、浪费、缺陷、危险等现场源头治理。',
    points: ['六源分类六宫格', '自动编号与解决责任']
  },
  {
    value: 'tool', label: '工具开发', shortLabel: '工具开发', icon: 'tool', badge: '工装与辅具',
    description: '按热处理厂最新工具开发模板，记录设计思路和实际运用效果。',
    points: ['工装或辅具分类', '设计照片与应用照片']
  },
  {
    value: 'opl', label: 'OPL 单点课程', shortLabel: 'OPL', icon: 'clipboard-text', badge: '单点培训',
    description: '按热处理厂最新 OPL 模板，沉淀知识、技巧、改善或故障处理课程。',
    points: ['课程内容与讲师', '培训对象与总体评价']
  }
]

const FALLBACK = PROPOSAL_TYPES[0]

export function proposalTypeMeta(value) {
  return PROPOSAL_TYPES.find(item => item.value === value) || FALLBACK
}

export function proposalTypeLabel(value, full = false) {
  const item = proposalTypeMeta(value)
  return full ? item.label : item.shortLabel
}

export function proposalTypeIcon(value) {
  return proposalTypeMeta(value).icon
}

export function proposalExportFormat(value) {
  return value === 'six' ? 'pptx' : 'docx'
}

export function proposalExportFormatLabel(value) {
  return proposalExportFormat(value) === 'pptx' ? 'PPT' : 'Word'
}

export function isProposalType(value) {
  return PROPOSAL_TYPES.some(item => item.value === value)
}

export function proposalEvidenceLabels(value) {
  if (value === 'tool') return { title: '工具图片', subtitle: '核对设计、成品和现场应用情况', before: '开发前或设计', after: '成品或应用', hasAfter: true }
  if (value === 'opl') return { title: '课程步骤', subtitle: '每一步对应一张图片和一段说明', before: '步骤内容', after: '', hasAfter: false }
  return { title: '改善证据', subtitle: '点击照片可查看原图，前后证据并排核对', before: '改善前', after: '改善后', hasAfter: true }
}

export function proposalOplSteps(proposal) {
  if (!proposal) return []
  const explicit = Array.isArray(proposal.oplSteps)
    ? proposal.oplSteps.map(item => ({
      photo: String((item && (item.photo || (Array.isArray(item.photos) && item.photos[0]))) || ''),
      text: String((item && (item.text || item.description)) || '')
    })).filter(item => item.photo || item.text)
    : []
  if (explicit.length) return explicit

  const photos = Array.isArray(proposal.beforePhotos) ? proposal.beforePhotos.filter(Boolean) : []
  const content = String(proposal.contentText || proposal.beforeText || '')
  if (photos.length) {
    return photos.map((photo, index) => ({
      photo,
      text: index === 0 ? content : ''
    }))
  }
  return content ? [{ photo: '', text: content }] : []
}

export function proposalContentHeading(value) {
  if (value === 'six') return '问题与措施'
  if (value === 'tool') return '设计与运用效果'
  if (value === 'opl') return '培训评价'
  return '改善说明'
}

export function proposalNarrativeRows(proposal) {
  if (!proposal) return []
  if (proposal.type === 'six') {
    return [
      { label: '问题描述', value: proposal.problem || proposal.beforeText },
      { label: '改善措施', value: proposal.measures || proposal.afterText }
    ]
  }
  if (proposal.type === 'tool') {
    return [
      { label: '设计思路说明', value: proposal.designIdea || proposal.beforeText },
      { label: '运用效果说明', value: proposal.applicationEffect || proposal.afterText }
    ]
  }
  if (proposal.type === 'opl') {
    return [
      { label: '培训总体评价', value: proposal.trainingEvaluation || proposal.afterText }
    ]
  }
  return [
    { label: '改善前说明', value: proposal.beforeText },
    { label: '改善后说明', value: proposal.afterText }
  ]
}

export function proposalInformationRows(proposal, displayNumber) {
  if (!proposal) return []
  const submitted = { label: '提交时间', value: proposal.submittedAt, mono: true }
  if (proposal.type === 'tool') {
    return [
      { label: '工具编号', value: displayNumber, mono: true },
      { label: '提交门类', value: proposalTypeLabel(proposal.type, true) },
      { label: '工具类别', value: proposal.toolCategory },
      { label: '所属部门', value: proposal.department || '热处理厂' },
      { label: '所属工段', value: proposal.section },
      { label: '所属班组', value: proposal.team },
      { label: '开发人员', value: proposal.firstAuthor },
      { label: '开发日期', value: proposal.developmentDate, mono: true },
      { label: '使用范围', value: proposal.usageScope },
      submitted
    ]
  }
  if (proposal.type === 'opl') {
    const category = proposal.oplCategory === '其他' && proposal.otherCategory ? `其他：${proposal.otherCategory}` : proposal.oplCategory
    return [
      { label: 'OPL 编号', value: displayNumber, mono: true },
      { label: '提交门类', value: proposalTypeLabel(proposal.type, true) },
      { label: '类别', value: category },
      { label: '所属部门', value: proposal.department || '热处理厂' },
      { label: '所属工段', value: proposal.section },
      { label: '所属班组', value: proposal.team },
      { label: '编者', value: proposal.firstAuthor },
      { label: '岗位', value: proposal.position },
      { label: '编制日期', value: proposal.oplDate, mono: true },
      { label: '讲师', value: proposal.lecturer },
      { label: '培训日期', value: proposal.trainingDate, mono: true },
      { label: '受训人员', value: proposal.trainees },
      { label: '培训总体评价', value: proposal.trainingEvaluation },
      submitted
    ]
  }
  const shared = [
    { label: '所属部门', value: proposal.department || '热处理厂' },
    { label: '提案类型', value: proposalTypeLabel(proposal.type, true) },
    { label: '所属工段', value: proposal.section },
    { label: '所属班组', value: proposal.team },
    { label: '第一作者', value: proposal.firstAuthor },
    { label: '团队成员', value: proposal.members || '无' },
    submitted
  ]
  if (proposal.type === 'six') {
    return [
      { label: '六源编号', value: displayNumber, mono: true },
      { label: '六源分类', value: (proposal.categories || []).join('、') },
      { label: '发现人', value: proposal.discoverer },
      { label: '发现日期', value: proposal.discoverDate, mono: true },
      ...shared,
      { label: '解决单位', value: proposal.solvingUnit },
      { label: '解决人', value: proposal.solver },
      { label: '改善日期', value: proposal.improveDate, mono: true },
      { label: '改善节约成本金额', value: `¥${Number(proposal.savedAmount || 0).toLocaleString()}`, mono: true }
    ]
  }
  return [
    { label: '提案编号', value: displayNumber, mono: true },
    { label: '项目类型', value: proposal.projectType },
    ...shared,
    { label: '节省金额', value: `¥${Number(proposal.savedAmount || 0).toLocaleString()}`, mono: true }
  ]
}
