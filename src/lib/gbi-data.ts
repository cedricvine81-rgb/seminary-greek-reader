// ── GBI / Macula-Greek dataset (SBLGNT) ───────────────────────────────────────
// Source: Clear-Bible/macula-greek (CC BY 4.0)
// Converted from macula-greek-SBLGNT.tsv to a word-ID indexed JSON.

export interface GbiEntry {
  role?:  string   // syntactic role: s, v, o, o2, io, p, vc, adv, aux
  en?:    string   // English gloss
  ln?:    string   // Louw-Nida domain number(s), e.g. "33.38" or "10.24 33.19"
  frame?: string   // semantic frame, e.g. "A0:n40001002001 A1:n40001002004"
  type?:  string   // word type: "common" | "proper" | "cardinal" | ...
}

export interface GbiDisplay {
  role:     string | null   // human-readable role label
  gloss:    string | null   // English contextual gloss from GBI
  domains:  LnDomain[]     // Louw-Nida semantic domains
  frame:    FrameArg[]     // semantic argument structure (verbs)
}

export interface LnDomain {
  code:   string   // e.g. "33.38"
  name:   string   // e.g. "Written Material"
  domain: string   // e.g. "Communication"
}

export interface FrameArg {
  slot:  string   // "A0", "A1", etc.
  label: string   // "Agent (Subject)", "Patient (Object)", etc.
}

// ── Lazy-loaded cache ─────────────────────────────────────────────────────────

let _cache: Record<string, GbiEntry> | null = null
let _loading: Promise<Record<string, GbiEntry>> | null = null

export function loadGbi(): Promise<Record<string, GbiEntry>> {
  if (_cache) return Promise.resolve(_cache)
  if (_loading) return _loading
  _loading = fetch('/data/gbi.json')
    .then(r => r.json() as Promise<Record<string, GbiEntry>>)
    .then(data => { _cache = data; return data })
  return _loading
}

// ── Louw-Nida domain names ────────────────────────────────────────────────────

const LN_DOMAINS: Record<number, string> = {
  1:  'Geographical Objects and Features',
  2:  'Natural Substances',
  3:  'Plants',
  4:  'Animals and Animal Products',
  5:  'Food and Drink',
  6:  'Artifacts',
  7:  'Constructions',
  8:  'Body Parts and Body Products',
  9:  'People',
  10: 'Kinship Terms',
  11: 'Groups and Classes of People',
  12: 'Supernatural Beings and Powers',
  13: 'Be, Become, Exist, Happen',
  14: 'Physical Events and States',
  15: 'Linear Movement',
  16: 'Non-Linear Movement',
  17: 'Stances and Positions',
  18: 'Attachment',
  19: 'Physical Impact',
  20: 'Violence and Destruction',
  21: 'Danger, Risk, Safe, Save',
  22: 'Trouble, Hardship, Relief',
  23: 'Physiological Processes and States',
  24: 'Sensory Events and States',
  25: 'Psychological Feelings and Emotions',
  26: 'Psychological Faculties',
  27: 'Learn',
  28: 'Know',
  29: 'Memory and Recall',
  30: 'Think',
  31: 'Hold a View, Believe, Trust',
  32: 'Understand',
  33: 'Communication',
  34: 'Association',
  35: 'Help, Care For',
  36: 'Guide, Lead',
  37: 'Control, Rule',
  38: 'Punish, Reward',
  39: 'Hostility, Strife',
  40: 'Reconciliation, Forgiveness',
  41: 'Behavior and Related States',
  42: 'Perform, Do',
  43: 'Agriculture and Vegetation',
  44: 'Animal Husbandry and Fishing',
  45: 'Building, Constructing',
  46: 'Measure',
  47: 'Weigh',
  48: 'Number',
  49: 'Divide, Separate, Scatter',
  50: 'Combine, Join',
  51: 'Make, Create',
  52: 'Use, Handle',
  53: 'Possess, Transfer, Exchange',
  54: 'Economics',
  55: 'Juridical Activities',
  56: 'Courts and Legal Procedures',
  57: 'Moral and Ethical Qualities',
  58: 'Nature, Class, Example',
  59: 'Quantity',
  60: 'Spatial Positions',
  61: 'Sequence',
  62: 'Arrange, Organize',
  63: 'Whole, Unite, Part, Divide',
  64: 'Comparison',
  65: 'Value',
  66: 'Proper, Inappropriate',
  67: 'Time',
  68: 'Aspect',
  69: 'Affirmation, Negation',
  70: 'Real, Unreal',
  71: 'Mode',
  72: 'True, False',
  73: 'Genuine, Phony',
  74: 'Proper, Improper',
  75: 'Good, Evil',
  76: 'Power, Force',
  77: 'Ready, Prepared',
  78: 'Lack, Need, Poverty, Abundance',
  79: 'Features of Objects',
  80: 'Space',
  81: 'Discourse Markers',
  82: 'Discourse Markers',
  83: 'Connectors',
  84: 'Clause Connectors',
  85: 'Discourse Markers',
  86: 'Discourse Units',
  87: 'Status',
  88: 'Moral and Ethical Qualities',
  89: 'Semiotic Devices',
  90: 'Case',
  91: 'Discourse Referentials',
  92: 'Discourse Cohesion',
  93: 'Names of Persons and Places',
}

function lnCodeToDomain(code: string): LnDomain | null {
  // Parse codes like "33.38", "93.169a", "10.24"
  const num = parseFloat(code)
  if (isNaN(num)) return null
  const domainNum = Math.floor(num)
  const domainName = LN_DOMAINS[domainNum]
  if (!domainName) return null
  return { code, name: '', domain: domainName }
}

const FRAME_LABELS: Record<string, string> = {
  A0: 'A0 — Agent / Subject',
  A1: 'A1 — Patient / Object',
  A2: 'A2 — Instrument / Beneficiary',
  A3: 'A3 — Starting Point',
  A4: 'A4 — End Point',
}

const GBI_ROLE_LABELS: Record<string, string> = {
  s:   'Subject',
  v:   'Predicate (Verb)',
  o:   'Object',
  o2:  'Secondary Object',
  io:  'Indirect Object',
  p:   'Predicate Complement',
  vc:  'Verb Complement',
  adv: 'Adverbial',
  aux: 'Auxiliary',
}

// ── Main display builder ───────────────────────────────────────────────────────

export function buildGbiDisplay(entry: GbiEntry | undefined): GbiDisplay | null {
  if (!entry) return null

  const role = entry.role ? (GBI_ROLE_LABELS[entry.role] ?? entry.role) : null
  const gloss = entry.en ?? null

  // Parse LN codes (may be space-separated for polysemous words)
  const domains: LnDomain[] = []
  if (entry.ln) {
    for (const code of entry.ln.split(' ')) {
      const d = lnCodeToDomain(code.trim())
      if (d) domains.push(d)
    }
  }

  // Parse semantic frame: "A0:n40001002001 A1:n40001002004"
  const frame: FrameArg[] = []
  if (entry.frame) {
    for (const part of entry.frame.split(' ')) {
      const [slot] = part.split(':')
      const label = FRAME_LABELS[slot]
      if (label) frame.push({ slot, label })
    }
  }

  if (!role && domains.length === 0 && !gloss) return null
  return { role, gloss, domains, frame }
}
