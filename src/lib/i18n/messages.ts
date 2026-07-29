import type { Locale } from './locale'

/**
 * UI message catalogue. Flat dotted keys, English as the reference.
 *
 * TRANSLATION PROVENANCE: the Spanish, Russian and Chinese strings here are machine-drafted
 * and have NOT been reviewed by a native speaker. They are short interface labels, where a
 * wrong word is obvious and cheap to correct — unlike the scholarly prose elsewhere in the
 * app — but they should still be read through by someone fluent before the term is relied on
 * in teaching. Corrections are welcome and belong in this file alone.
 *
 * A missing key falls back to English rather than showing the key, so a partly-translated
 * locale degrades into English instead of into gibberish (see translate.ts).
 *
 * PLURALS: a key may be given as an object keyed by Intl.PluralRules categories
 * ({ one, few, many, other }); translate() picks the right one for the locale and count.
 * This matters for Russian, which has three plural forms where English has two.
 */
export type Message = string | Partial<Record<Intl.LDMLPluralRule, string>>
export type Catalogue = Record<string, Message>

const en: Catalogue = {
  'account.signUp': 'Sign up',
  'account.search': 'Search',
  'account.openMenu': 'Open menu',
  'preview.instructorPreview': 'Instructor Preview — you are viewing the student experience',
  // ── Primary navigation ──
  'nav.reader': 'Reader',
  'nav.vocab': 'Vocab',
  'nav.grammar': 'Grammar',
  'nav.exegesis': 'Exegesis',
  'nav.texts': 'Texts',
  'nav.dashboard': 'Dashboard',
  'nav.navigation': 'Navigation',
  'nav.morphology': 'Morphology',

  // ── Student area ──
  'nav.assignments': 'Assignments',
  'nav.grades': 'Grades',
  'nav.groupWork': 'Group Work',
  'nav.messages': 'Messages',
  'nav.calendar': 'Calendar',
  'nav.courses': 'Courses',
  'nav.materials': 'Materials',
  'nav.notifications': 'Notifications',
  'nav.archive': 'Archive',

  // ── Instructor / admin area ──
  'nav.reports': 'Reports',
  'nav.requests': 'Requests',
  'nav.users': 'Users',
  'nav.institutions': 'Institutions',
  'nav.auditLog': 'Audit Log',
  'nav.appeals': 'Appeals',
  'nav.vocabAppeals': 'Vocab Appeals',
  'nav.vocabSynonyms': 'Vocab Synonyms',
  'nav.accuracy': 'Accuracy',

  // ── Roles ──
  'role.student': 'Student',
  'role.instructor': 'Instructor',
  'role.admin': 'Admin',

  // ── Account menu ──
  'account.signedInAs': 'Signed in as',
  'account.settings': 'Settings',
  'account.signOut': 'Sign out',
  'account.signIn': 'Sign in',

  // ── Footer ──
  'footer.pricing': 'Pricing',
  'footer.terms': 'Terms of Service',
  'footer.privacy': 'Privacy Policy',
  'footer.refunds': 'Refund Policy',

  // ── Settings: interface language ──
  'settings.language.title': 'Interface language',
  'settings.language.description':
    'The language of the menus, buttons and labels. This does not change the Greek text or the translation beside it — for that, see Reading language below.',
  'settings.language.note':
    'These translations are machine-drafted and not yet checked by a native speaker. Anything untranslated appears in English. Please report anything that reads wrongly.',

  // ── Settings: reading language (existing card) ──
  'settings.reading.title': 'Reading language',
  'settings.reading.greekOnly': 'Greek only',
  'settings.reading.noParallel': 'No parallel translation',

  // ── Common actions ──
  'action.save': 'Save',
  'action.cancel': 'Cancel',
  'action.close': 'Close',
  'action.submit': 'Submit',
  'action.loading': 'Loading…',

  // ── Group presentations (a live surface, worth having early) ──
  'group.submitMySection': 'Submit my section',
  'group.reopenMine': 'Reopen mine',
  'group.yourSection': 'Your section',
  'group.allSubmitted': 'All {count} submitted',
  'group.yourSectionIn': 'Your section is in',
  'group.nOfMSubmitted': '{done} of {total} submitted',
  'group.pastDeadline': 'Past deadline',
  'group.due': 'Due {date}',
  'group.membersWaiting': {
    one: 'Waiting on 1 member.',
    other: 'Waiting on {count} members.',
  },
}

const es: Catalogue = {
  'account.signUp': 'Crear cuenta',
  'account.search': 'Buscar',
  'account.openMenu': 'Abrir el menú',
  'preview.instructorPreview': 'Vista de profesor: está viendo la experiencia del estudiante',
  'nav.reader': 'Lector',
  'nav.vocab': 'Vocabulario',
  'nav.grammar': 'Gramática',
  'nav.exegesis': 'Exégesis',
  'nav.texts': 'Textos',
  'nav.dashboard': 'Panel',
  'nav.navigation': 'Navegación',
  'nav.morphology': 'Morfología',

  'nav.assignments': 'Tareas',
  'nav.grades': 'Calificaciones',
  'nav.groupWork': 'Trabajo en grupo',
  'nav.messages': 'Mensajes',
  'nav.calendar': 'Calendario',
  'nav.courses': 'Cursos',
  'nav.materials': 'Materiales',
  'nav.notifications': 'Notificaciones',
  'nav.archive': 'Archivo',

  'nav.reports': 'Informes',
  'nav.requests': 'Solicitudes',
  'nav.users': 'Usuarios',
  'nav.institutions': 'Instituciones',
  'nav.auditLog': 'Registro de auditoría',
  'nav.appeals': 'Apelaciones',
  'nav.vocabAppeals': 'Apelaciones de vocabulario',
  'nav.vocabSynonyms': 'Sinónimos de vocabulario',
  'nav.accuracy': 'Precisión',

  'role.student': 'Estudiante',
  'role.instructor': 'Profesor',
  'role.admin': 'Administrador',

  'account.signedInAs': 'Sesión iniciada como',
  'account.settings': 'Configuración',
  'account.signOut': 'Cerrar sesión',
  'account.signIn': 'Iniciar sesión',

  'footer.pricing': 'Precios',
  'footer.terms': 'Términos del servicio',
  'footer.privacy': 'Política de privacidad',
  'footer.refunds': 'Política de reembolsos',

  'settings.language.title': 'Idioma de la interfaz',
  'settings.language.description':
    'El idioma de los menús, botones y etiquetas. No cambia el texto griego ni la traducción que aparece junto a él; para eso, vea «Idioma de lectura» más abajo.',
  'settings.language.note':
    'Estas traducciones son un borrador automático y todavía no las ha revisado un hablante nativo. Lo que no esté traducido aparece en inglés. Le agradecemos que informe de cualquier error.',

  'settings.reading.title': 'Idioma de lectura',
  'settings.reading.greekOnly': 'Solo griego',
  'settings.reading.noParallel': 'Sin traducción paralela',

  'action.save': 'Guardar',
  'action.cancel': 'Cancelar',
  'action.close': 'Cerrar',
  'action.submit': 'Enviar',
  'action.loading': 'Cargando…',

  'group.submitMySection': 'Enviar mi sección',
  'group.reopenMine': 'Reabrir la mía',
  'group.yourSection': 'Su sección',
  'group.allSubmitted': 'Los {count} han enviado',
  'group.yourSectionIn': 'Su sección está entregada',
  'group.nOfMSubmitted': '{done} de {total} han enviado',
  'group.pastDeadline': 'Plazo vencido',
  'group.due': 'Entrega: {date}',
  'group.membersWaiting': {
    one: 'Falta 1 integrante.',
    other: 'Faltan {count} integrantes.',
  },
}

const ru: Catalogue = {
  'account.signUp': 'Регистрация',
  'account.search': 'Поиск',
  'account.openMenu': 'Открыть меню',
  'preview.instructorPreview': 'Просмотр от лица преподавателя — вы видите интерфейс студента',
  'nav.reader': 'Чтение',
  'nav.vocab': 'Лексика',
  'nav.grammar': 'Грамматика',
  'nav.exegesis': 'Экзегеза',
  'nav.texts': 'Тексты',
  'nav.dashboard': 'Панель',
  'nav.navigation': 'Навигация',
  'nav.morphology': 'Морфология',

  'nav.assignments': 'Задания',
  'nav.grades': 'Оценки',
  'nav.groupWork': 'Групповая работа',
  'nav.messages': 'Сообщения',
  'nav.calendar': 'Календарь',
  'nav.courses': 'Курсы',
  'nav.materials': 'Материалы',
  'nav.notifications': 'Уведомления',
  'nav.archive': 'Архив',

  'nav.reports': 'Отчёты',
  'nav.requests': 'Заявки',
  'nav.users': 'Пользователи',
  'nav.institutions': 'Учебные заведения',
  'nav.auditLog': 'Журнал аудита',
  'nav.appeals': 'Апелляции',
  'nav.vocabAppeals': 'Апелляции по лексике',
  'nav.vocabSynonyms': 'Синонимы лексики',
  'nav.accuracy': 'Точность',

  'role.student': 'Студент',
  'role.instructor': 'Преподаватель',
  'role.admin': 'Администратор',

  'account.signedInAs': 'Вы вошли как',
  'account.settings': 'Настройки',
  'account.signOut': 'Выйти',
  'account.signIn': 'Войти',

  'footer.pricing': 'Цены',
  'footer.terms': 'Условия использования',
  'footer.privacy': 'Политика конфиденциальности',
  'footer.refunds': 'Политика возврата средств',

  'settings.language.title': 'Язык интерфейса',
  'settings.language.description':
    'Язык меню, кнопок и подписей. Греческий текст и перевод рядом с ним не меняются — для этого см. «Язык чтения» ниже.',
  'settings.language.note':
    'Эти переводы сделаны машиной и ещё не проверены носителем языка. Непереведённое отображается по-английски. Пожалуйста, сообщайте об ошибках.',

  'settings.reading.title': 'Язык чтения',
  'settings.reading.greekOnly': 'Только греческий',
  'settings.reading.noParallel': 'Без параллельного перевода',

  'action.save': 'Сохранить',
  'action.cancel': 'Отмена',
  'action.close': 'Закрыть',
  'action.submit': 'Отправить',
  'action.loading': 'Загрузка…',

  'group.submitMySection': 'Отправить свой раздел',
  'group.reopenMine': 'Вернуть свой раздел',
  'group.yourSection': 'Ваш раздел',
  'group.allSubmitted': 'Отправили все ({count})',
  'group.yourSectionIn': 'Ваш раздел отправлен',
  'group.nOfMSubmitted': 'Отправлено {done} из {total}',
  'group.pastDeadline': 'Срок истёк',
  'group.due': 'Срок: {date}',
  // Russian has three plural forms; English has two. This is the reason translate()
  // resolves plurals through Intl.PluralRules rather than a simple count === 1 test.
  'group.membersWaiting': {
    one: 'Ожидается {count} участник.',
    few: 'Ожидается {count} участника.',
    many: 'Ожидается {count} участников.',
    other: 'Ожидается {count} участника.',
  },
}

const zh: Catalogue = {
  'account.signUp': '註冊',
  'account.search': '搜尋',
  'account.openMenu': '開啟選單',
  'preview.instructorPreview': '教師預覽 — 你正在檢視學生所見的介面',
  'nav.reader': '閱讀',
  'nav.vocab': '詞彙',
  'nav.grammar': '語法',
  'nav.exegesis': '釋經',
  'nav.texts': '文獻',
  'nav.dashboard': '主頁',
  'nav.navigation': '導覽',
  'nav.morphology': '詞形',

  'nav.assignments': '作業',
  'nav.grades': '成績',
  'nav.groupWork': '小組作業',
  'nav.messages': '訊息',
  'nav.calendar': '行事曆',
  'nav.courses': '課程',
  'nav.materials': '教材',
  'nav.notifications': '通知',
  'nav.archive': '存檔',

  'nav.reports': '報表',
  'nav.requests': '申請',
  'nav.users': '使用者',
  'nav.institutions': '機構',
  'nav.auditLog': '稽核紀錄',
  'nav.appeals': '申訴',
  'nav.vocabAppeals': '詞彙申訴',
  'nav.vocabSynonyms': '詞彙同義詞',
  'nav.accuracy': '準確度',

  'role.student': '學生',
  'role.instructor': '教師',
  'role.admin': '管理員',

  'account.signedInAs': '登入身分',
  'account.settings': '設定',
  'account.signOut': '登出',
  'account.signIn': '登入',

  'footer.pricing': '價格',
  'footer.terms': '服務條款',
  'footer.privacy': '隱私權政策',
  'footer.refunds': '退款政策',

  'settings.language.title': '介面語言',
  'settings.language.description':
    '選單、按鈕與標籤所使用的語言。這不會改變希臘文原文或旁邊的譯文；若要更改譯文，請見下方的「閱讀語言」。',
  'settings.language.note':
    '這些譯文由機器初譯，尚未經母語人士校訂。未翻譯的部分會以英文顯示。若發現錯誤，歡迎回報。',

  'settings.reading.title': '閱讀語言',
  'settings.reading.greekOnly': '僅希臘文',
  'settings.reading.noParallel': '不顯示對照譯文',

  'action.save': '儲存',
  'action.cancel': '取消',
  'action.close': '關閉',
  'action.submit': '送出',
  'action.loading': '載入中…',

  'group.submitMySection': '送出我的部分',
  'group.reopenMine': '重新開啟我的部分',
  'group.yourSection': '你的部分',
  'group.allSubmitted': '{count} 人全部送出',
  'group.yourSectionIn': '你的部分已送出',
  'group.nOfMSubmitted': '已送出 {done} / {total}',
  'group.pastDeadline': '已過期限',
  'group.due': '期限：{date}',
  // Chinese has no grammatical plural, so `other` covers every count.
  'group.membersWaiting': { other: '尚有 {count} 人未送出。' },
}

export const CATALOGUES: Record<Locale, Catalogue> = { en, es, ru, zh }

/** Every key the app knows about — used by the coverage script to find gaps. */
export const ALL_KEYS = Object.keys(en)
