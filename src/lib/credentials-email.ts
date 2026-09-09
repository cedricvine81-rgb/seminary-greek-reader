// The message a user receives when an admin resets their password — ONE definition, used both
// to send it and to put it on the admin's clipboard when sending failed. Two copies of this
// text had already drifted apart within a day of being written: different wording, and a
// hard-coded sign-in URL on one side against a configured one on the other.
//
// Client-safe on purpose (no logger, no prisma, no server-only imports): the admin's browser
// builds the same text for "copy whole message" that the server just tried to send.
//
// WHY FOUR LANGUAGES. Nothing in the data says which language this person reads. There is no
// per-user locale — `Course.language` is the language a course is ASSESSED in, and the user
// being reset may be in several courses, or none, and may read the app in a language that
// matches none of them. A credentials email is also the one message a student cannot afford to
// misunderstand: it arrives unexpectedly and it is the only route back into their account. So
// the credentials are shown ONCE, language-neutral, and the short instruction that explains
// them is repeated in each language the app speaks.

export interface Credentials {
  name: string
  email: string
  tempPassword: string
  /** Absolute sign-in URL. Passed in rather than built here so the server and the admin's
   *  clipboard can never quote different addresses. */
  signInUrl: string
}

/** Subject in all four, kept short enough to survive an inbox list. */
export const CREDENTIALS_SUBJECT =
  'Seminary Greek — sign-in details · Datos de acceso · Данные для входа · 登入資訊'

/** One paragraph per language: what the password is and what happens next. */
const INSTRUCTIONS: string[] = [
  'Your Seminary Greek password has been reset. Sign in with the temporary password above — '
  + 'you will be asked to choose your own password straight away. It can be used once.',

  'Tu contraseña de Seminary Greek se ha restablecido. Inicia sesión con la contraseña temporal '
  + 'de arriba: se te pedirá que elijas tu propia contraseña de inmediato. Solo se puede usar una vez.',

  'Пароль вашей учётной записи Seminary Greek был сброшен. Войдите с помощью временного пароля, '
  + 'указанного выше, — сразу после этого вам будет предложено задать собственный пароль. '
  + 'Он действует один раз.',

  '您的 Seminary Greek 密碼已重設。請使用上方的臨時密碼登入，系統會立即請您設定自己的密碼。此密碼僅能使用一次。',
]

const CLOSING = 'If you did not expect this message, please reply and let us know.'

/** Plain text — what the admin copies, and the text part of the email. */
export function credentialsText(c: Credentials): string {
  return `Hello ${c.name},\n\n`
    + `  Sign-in page:       ${c.signInUrl}\n`
    + `  Email:              ${c.email}\n`
    + `  Temporary password: ${c.tempPassword}\n\n`
    + INSTRUCTIONS.join('\n\n')
    + `\n\n${CLOSING}\n`
}

const escape = (s: string) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

/** The HTML part. Every interpolated value is escaped here so no caller has to remember. */
export function credentialsHtml(c: Credentials): string {
  return `<p>Hello ${escape(c.name)},</p>`
    + `<p style="line-height:1.7">`
    + `Sign-in page: <a href="${escape(c.signInUrl)}">${escape(c.signInUrl)}</a><br>`
    + `Email: ${escape(c.email)}<br>`
    + `Temporary password: <strong>${escape(c.tempPassword)}</strong>`
    + `</p>`
    + INSTRUCTIONS.map(p => `<p>${escape(p)}</p>`).join('')
    + `<p>${escape(CLOSING)}</p>`
}
