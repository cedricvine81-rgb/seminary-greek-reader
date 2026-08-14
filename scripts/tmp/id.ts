import { CATALOGUES, ALL_KEYS } from '../../src/lib/i18n/messages'
const en = CATALOGUES.en as Record<string, string>, es = CATALOGUES.es as Record<string, string>
ALL_KEYS.filter(k => es[k] === en[k] && /[a-z]{4}/.test(en[k])).forEach(k => console.log(`  ${k}: "${en[k]}"`))
