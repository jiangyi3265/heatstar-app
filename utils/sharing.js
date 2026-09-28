function clean(value) {
  return String(value ?? '').trim()
}

function attendeeKey(attendee) {
  const workNo = clean(attendee && attendee.workNo)
  if (workNo) return `work:${workNo}`
  return `name:${clean(attendee && attendee.name)}`
}

export function normalizeAttendees(record) {
  const source = Array.isArray(record && record.attendees)
    ? record.attendees
    : Array.isArray(record && record.attendeeNames)
      ? record.attendeeNames
      : []
  const unique = new Map()
  source.forEach(item => {
    const attendee = typeof item === 'string'
      ? { name: clean(item), workNo: '', team: '' }
      : {
          name: clean(item && item.name),
          workNo: clean(item && item.workNo),
          team: clean(item && item.team)
        }
    if (!attendee.name && !attendee.workNo) return
    const key = attendeeKey(attendee)
    if (!unique.has(key)) unique.set(key, attendee)
  })
  return Array.from(unique.values())
}

export function parseAttendeeText(value, people = []) {
  const roster = Array.isArray(people) ? people : []
  const byName = new Map(roster.filter(item => clean(item.name)).map(item => [clean(item.name), item]))
  const byWorkNo = new Map(roster.filter(item => clean(item.workNo)).map(item => [clean(item.workNo), item]))
  const tokens = clean(value)
    .split(/[\s、,，;；|/]+/)
    .map(clean)
    .filter(Boolean)
  const unique = new Map()
  tokens.forEach(token => {
    const person = byWorkNo.get(token) || byName.get(token)
    const attendee = person
      ? { name: clean(person.name), workNo: clean(person.workNo), team: clean(person.team) }
      : { name: token, workNo: '', team: '' }
    const key = attendeeKey(attendee)
    if (!unique.has(key)) unique.set(key, attendee)
  })
  return Array.from(unique.values())
}

export function personAttended(record, person) {
  const workNo = clean(person && person.workNo)
  const name = clean(person && person.name)
  return normalizeAttendees(record).some(attendee => {
    if (workNo && clean(attendee.workNo)) return clean(attendee.workNo) === workNo
    return Boolean(name && clean(attendee.name) === name)
  })
}

export function personalShareCount(records, person) {
  const seen = new Set()
  ;(Array.isArray(records) ? records : []).forEach((record, index) => {
    if (!personAttended(record, person)) return
    seen.add(clean(record && record.id) || `${clean(record && record.date)}:${index}`)
  })
  return seen.size
}

