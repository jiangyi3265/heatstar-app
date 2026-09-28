export const currentUser = {
  id: '56348',
  name: '杨春林',
  workNo: '56348',
  section: '生产工段',
  team: '热一组',
  role: '班组长',
  reviewLevel: 'team',
  points: 18,
  rank: 3
}

export const sections = [
  { id: 'production', name: '生产工段', leader: '左正', teams: ['热一组', '热二组', '热三组', '热四组', '热五组', '热六组'] },
  { id: 'maintenance', name: '维修工段', leader: '王文东', teams: ['维修组', '行车组'] },
  { id: 'cutting', name: '下料工段', leader: '张达', teams: ['下料组', '取试组'] }
]

export const teams = [
  { id: 'T01', name: '热一组', section: '生产工段', leader: '何林', deputy: '杨东', members: 11 },
  { id: 'T02', name: '热二组', section: '生产工段', leader: '吴文亮', deputy: '张泽君', members: 11 },
  { id: 'T03', name: '热三组', section: '生产工段', leader: '钟兴', deputy: '富铭俊', members: 8 },
  { id: 'T04', name: '热四组', section: '生产工段', leader: '王照伟', deputy: '许志荣', members: 9 },
  { id: 'T05', name: '热五组', section: '生产工段', leader: '陈清泉', deputy: '未配置', members: 4 },
  { id: 'T06', name: '热六组', section: '生产工段', leader: '赵强', deputy: '未配置', members: 8 },
  { id: 'T07', name: '维修组', section: '维修工段', leader: '周俊', deputy: '唐冬', members: 19 },
  { id: 'T08', name: '行车组', section: '维修工段', leader: '安兴华', deputy: '纪翔', members: 18 },
  { id: 'T09', name: '下料组', section: '下料工段', leader: '赵勇', deputy: '未配置', members: 14 },
  { id: 'T10', name: '取试组', section: '下料工段', leader: '廖军', deputy: '未配置', members: 11 },
  { id: 'T11', name: '行政组', section: '厂级职能', leader: '曹坚', deputy: '未配置', members: 5 },
  { id: 'T12', name: '计调组', section: '厂级职能', leader: '吴越', deputy: '唐宏伟', members: 9 }
]

export const people = [
  { id: '49598', name: '曹坚', workNo: '49598', team: '行政组', section: '厂级职能', role: '厂长', level: '全厂', scope: '热处理厂', points: 0, status: '在岗' },
  { id: '54782', name: '左正', workNo: '54782', team: '生产工段', section: '生产工段', role: '工段长', level: '工段', scope: '生产工段', points: 6, status: '在岗' },
  { id: '59628', name: '何林', workNo: '59628', team: '热一组', section: '生产工段', role: '班组长', level: '班组', scope: '热一组', points: 13, status: '在岗' },
  { id: '59680', name: '杨东', workNo: '59680', team: '热一组', section: '生产工段', role: '副班组长', level: '班组', scope: '热一组', points: 8, status: '在岗' },
  { id: '56348', name: '杨春林', workNo: '56348', team: '热一组', section: '生产工段', role: '员工', level: '无', scope: '本人', points: 18, status: '在岗' },
  { id: '59473', name: '吴文亮', workNo: '59473', team: '热二组', section: '生产工段', role: '班组长', level: '班组', scope: '热二组', points: 10, status: '在岗' },
  { id: '59160', name: '钟兴', workNo: '59160', team: '热三组', section: '生产工段', role: '班组长', level: '班组', scope: '热三组', points: 7, status: '在岗' },
  { id: '49463', name: '王文东', workNo: '49463', team: '维修工段', section: '维修工段', role: '工段长', level: '工段', scope: '维修工段', points: 4, status: '在岗' },
  { id: '53010', name: '周俊', workNo: '53010', team: '维修组', section: '维修工段', role: '班组长', level: '班组', scope: '维修组', points: 9, status: '在岗' },
  { id: '57853', name: '张达', workNo: '57853', team: '下料工段', section: '下料工段', role: '工段长', level: '工段', scope: '下料工段', points: 5, status: '在岗' },
  { id: '31169', name: '赵勇', workNo: '31169', team: '下料组', section: '下料工段', role: '班组长', level: '班组', scope: '下料组', points: 12, status: '在岗' },
  { id: '60412', name: '彭阳', workNo: '60412', team: '热六组', section: '生产工段', role: '员工', level: '无', scope: '本人', points: 15, status: '在岗' }
]

export const sourceCategories = [
  { id: 'pollution', name: '污染源', icon: 'droplet', color: '#b74631', note: '油、水、粉尘等污染' },
  { id: 'cleaning', name: '清扫困难源', icon: 'refresh', color: '#7b6843', note: '难清理、难接近区域' },
  { id: 'failure', name: '故障源', icon: 'tool', color: '#44677c', note: '设备异常与劣化' },
  { id: 'waste', name: '浪费源', icon: 'recycle', color: '#31705b', note: '时间、材料与能耗浪费' },
  { id: 'defect', name: '缺陷源', icon: 'circle-x', color: '#8b4c63', note: '质量偏差与缺陷' },
  { id: 'danger', name: '危险源', icon: 'shield-check', color: '#a36d1c', note: '人身与作业风险' }
]

export const proposals = [
  {
    id: 'LY-RT-2025-0008', sourceNo: 'RTC-LY-202508-0008', type: 'six', typeText: '六源改善', title: '油污拖把、扫帚存放架油污收集改善',
    categories: ['污染源', '危险源'], discoverer: '杨春林', discoverDate: '2025-08-15', team: '热一组', section: '生产工段', firstAuthor: '杨春林', members: '许帅威',
    problem: '淬火油槽旁清理产品油污的拖把、扫帚存放架，因油污滴落直接流向地面，造成环境污染，操作者清理产品油污或路过时有滑倒风险。',
    beforeText: '工具上的油污从存放架缝隙滴落到地面，形成污染和滑倒风险。',
    afterText: '在料架凹槽最深处钻孔，并在下方增设接油槽，使油污集中流入接油槽。',
    measures: '将拖把、扫帚架凹陷最深处钻一小孔，在下方增设接油槽，保证油污不再从料架缝隙流向地面。',
    solvingUnit: '生产工段', solver: '杨春林', improveDate: '2025-08-25', savedAmount: '3200',
    beforePhotos: ['/static/images/oil-rack-before.jpg'], afterPhotos: ['/static/images/oil-rack-after.jpg'],
    status: 'approved', statusText: '已采纳', stars: 3, points: 5, submittedAt: '2026-07-18 09:26', reviewer: '曹坚', reviewComment: '结构简单、实用性强，降低污染和滑倒风险，具备推广价值。', mock: false
  },
  {
    id: 'JY-RT-2026-0031', type: 'lean', typeText: '精益提案', title: '集控温度点查询', team: '热一组', section: '生产工段', projectType: '效率', firstAuthor: '阳钦州', members: '',
    beforeText: '炉温监控曲线实时显示。当操作者查询特定温度点（如保温开始时间）时，需要移动鼠标在曲线上手动寻找，耗时且不便。',
    afterText: '增加设定温度定位查询，可根据目标温度直接显示特定温度点在曲线上的位置及时间。',
    savedAmount: '0', beforePhotos: ['/static/images/temperature-before.png'], afterPhotos: ['/static/images/temperature-after.png'],
    status: 'approved', statusText: '已采纳', stars: 2, points: 3, submittedAt: '2026-05-31 17:12', reviewer: '左正', reviewComment: '提高管控效率，保障现场查询记录与数据记录一致。', mock: false
  },
  {
    id: 'LY-RT-2026-0018', sourceNo: 'RTC-LY-202608-0018', type: 'six', typeText: '六源改善', title: '淬火区地沟盖板防绊倒改善',
    categories: ['危险源'], discoverer: '杨春林', discoverDate: '2026-08-06', team: '热一组', section: '生产工段', firstAuthor: '杨春林', members: '刘成、肖鹏',
    problem: '地沟盖板局部翘起，推车经过时有卡滞和绊倒风险。', beforeText: '盖板连接处高差明显。', afterText: '重新校平并增加限位件。', measures: '校平盖板并焊接可拆卸限位块。',
    solvingUnit: '维修组', solver: '周俊', improveDate: '2026-08-09', savedAmount: '800', beforePhotos: ['/static/images/oil-rack-before.jpg'], afterPhotos: ['/static/images/oil-rack-after.jpg'],
    status: 'pending_team', statusText: '班组长审核', stars: 0, points: 0, submittedAt: '2026-08-10 14:20', mock: true
  },
  {
    id: 'JY-RT-2026-0042', type: 'lean', typeText: '精益提案', title: '料框标识快速识别优化', team: '热一组', section: '生产工段', projectType: '现场管理', firstAuthor: '杨春林', members: '许帅威',
    beforeText: '旧标识位置不统一，夜班查找耗时。', afterText: '统一色块与编号位置，增加耐高温标签。', savedAmount: '1500',
    beforePhotos: ['/static/images/temperature-before.png'], afterPhotos: ['/static/images/temperature-after.png'], status: 'rejected', statusText: '已驳回', stars: 0, points: 0,
    submittedAt: '2026-07-28 08:40', reviewer: '何林', rejectReason: '改善后照片未体现完整料框区域，请补拍全景并说明标签耐温等级。', mock: true
  },
  {
    id: 'JY-RT-2026-0039', type: 'lean', typeText: '精益提案', title: '热处理记录表自动带入炉号', team: '热二组', section: '生产工段', projectType: '效率', firstAuthor: '何乐', members: '张泽君',
    beforeText: '炉号需要重复手工录入。', afterText: '扫码后自动带入炉号和批次。', savedAmount: '4600', beforePhotos: ['/static/images/temperature-before.png'], afterPhotos: ['/static/images/temperature-after.png'],
    status: 'pending_section', statusText: '工段长审核', stars: 1, points: 0, submittedAt: '2026-08-08 10:05', mock: true
  }
]

export const announcements = [
  { id: 'N01', title: '三季度精益改善分享会报名', summary: '8月20日前由各班组提交分享案例与主持人。', date: '2026-08-11', top: true, status: '已发布' },
  { id: 'N02', title: '六源编号规则已更新', summary: '自8月起编号前缀统一为 RTC-LY。', date: '2026-08-01', top: false, status: '已发布' },
  { id: 'N03', title: '7月积分核算已完成', summary: '可在积分中心查看个人与班组明细。', date: '2026-07-26', top: false, status: '草稿' }
]

export const permissionLogs = [
  { id: 'L01', time: '2026-08-09 09:18', operator: '曹坚', target: '左正', action: '审核层级变更', detail: '班组级 → 工段级；2条未审核提案自动移交' },
  { id: 'L02', time: '2026-08-02 15:30', operator: '曹坚', target: '何林', action: '管辖范围更新', detail: '新增热一组；权限立即生效' },
  { id: 'L03', time: '2026-07-28 11:06', operator: '系统管理员', target: '王文东', action: '角色分配', detail: '分配维修工段审核者角色' }
]

export const pointRules = { oneStar: 1, twoStar: 3, threeStar: 5, cutoffDay: 25 }

export const sharingRecords = [
  { id: 'S01', date: '2026-07-18', team: '热一组', host: '何林', shouldAttend: 11, attended: 10, rate: 91, cases: 3, attachment: '7月改善案例汇编.pdf' },
  { id: 'S02', date: '2026-06-22', team: '热一组', host: '杨东', shouldAttend: 11, attended: 11, rate: 100, cases: 2, attachment: '温度查询改善分享.pptx' },
  { id: 'S03', date: '2026-07-20', team: '热二组', host: '吴文亮', shouldAttend: 11, attended: 8, rate: 73, cases: 2, attachment: '二组7月分享记录.pdf' }
]

export const candidatePeople = [
  { id: 'C01', name: '杨春林', workNo: '56348', team: '热一组', points: 18, threeStar: 1, shares: 2, compliance: true, eligible: true, confirmed: true },
  { id: 'C02', name: '彭阳', workNo: '60412', team: '热六组', points: 15, threeStar: 1, shares: 2, compliance: true, eligible: true, confirmed: false },
  { id: 'C03', name: '赵勇', workNo: '31169', team: '下料组', points: 17, threeStar: 0, shares: 3, compliance: true, eligible: false, confirmed: false }
]

export const candidateTeams = [
  { id: 'CT01', name: '热一组', total: 92, average: 8.4, hasStar: true, shares: 3, participation: 64, compliance: true, eligible: true, confirmed: true },
  { id: 'CT02', name: '热六组', total: 61, average: 7.6, hasStar: true, shares: 3, participation: 55, compliance: true, eligible: false, confirmed: false },
  { id: 'CT03', name: '下料组', total: 116, average: 8.3, hasStar: false, shares: 4, participation: 57, compliance: true, eligible: false, confirmed: false }
]

export const honorResults = {
  quarter: '2026年第二季度',
  publishedAt: '2026-07-05',
  stars: [
    { rank: 1, name: '杨春林', team: '热一组', points: 18, highlight: '油污收集与温度查询改善' },
    { rank: 2, name: '彭阳', team: '热六组', points: 16, highlight: '炉台安全联锁优化' },
    { rank: 3, name: '赵勇', team: '下料组', points: 15, highlight: '锯切余料分类改善' }
  ],
  team: { name: '热一组', average: 8.4, participation: 64, shares: 3 }
}

export const quarterHistory = [
  { quarter: '2026年第二季度', star: '杨春林', team: '热一组', status: '已发布' },
  { quarter: '2026年第一季度', star: '何乐', team: '热二组', status: '已归档' },
  { quarter: '2025年第四季度', star: '彭阳', team: '热六组', status: '已归档' },
  { quarter: '2025年第三季度', star: '赵勇', team: '下料组', status: '已归档' }
]

export const monthRanking = [
  { rank: 1, name: '杨春林', team: '热一组', points: 18, trend: 'up' },
  { rank: 2, name: '彭阳', team: '热六组', points: 16, trend: 'same' },
  { rank: 3, name: '赵勇', team: '下料组', points: 15, trend: 'up' },
  { rank: 4, name: '何乐', team: '热二组', points: 12, trend: 'down' }
]

export const teamRanking = [
  { rank: 1, name: '热一组', total: 92, average: 8.4, participation: 64 },
  { rank: 2, name: '下料组', total: 116, average: 8.3, participation: 57 },
  { rank: 3, name: '热六组', total: 61, average: 7.6, participation: 55 },
  { rank: 4, name: '热二组', total: 78, average: 7.1, participation: 45 }
]
