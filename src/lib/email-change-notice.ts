// What we tell someone when an admin changes the email address they sign in with.
//
// TWO messages, not one sent twice, because the two addresses need different things:
//
//   · the NEW address is told what to sign in with from now on. It is the only place that
//     information exists — the person may have no idea the change was made.
//   · the OLD address is told that the account's login has MOVED AWAY from it. That is the
//     security half: if the change was a mistake, or was not asked for, the person who owns
//     the account still holds this address and this is the one message that reaches them.
//     Sending only to the new address would tell the change's beneficiary and nobody else.
//
// Same shape as credentials-email.ts, for the same reasons: one definition used by the server
// and by the admin's clipboard, and every language the app speaks, because nothing in the data
// says which one this person reads.

export interface EmailChange {
  name: string
  oldEmail: string
  newEmail: string
  /** Absolute sign-in URL, passed in so server and clipboard cannot quote different ones. */
  signInUrl: string
}

export const EMAIL_CHANGE_SUBJECT_NEW =
  'Seminary Greek — your sign-in email has changed · Tu correo de acceso ha cambiado · '
  + 'Ваш адрес для входа изменён · 您的登入電子郵件已變更'

export const EMAIL_CHANGE_SUBJECT_OLD =
  'Seminary Greek — sign-in email moved away from this address · Correo de acceso trasladado · '
  + 'Адрес для входа изменён · 登入電子郵件已轉移'

/** Told to the address that now signs in. */
const TO_NEW = (c: EmailChange): string[] => [
  `Your Seminary Greek sign-in email has been changed to ${c.newEmail}. Use it the next time `
  + `you sign in. Your password has not changed.`,

  `Tu correo de acceso a Seminary Greek se ha cambiado a ${c.newEmail}. Úsalo la próxima vez `
  + `que inicies sesión. Tu contraseña no ha cambiado.`,

  `Ваш адрес для входа в Seminary Greek изменён на ${c.newEmail}. Используйте его при `
  + `следующем входе. Ваш пароль не изменился.`,

  `您的 Seminary Greek 登入電子郵件已變更為 ${c.newEmail}。下次登入時請使用此地址。您的密碼未變更。`,
]

/** Told to the address that no longer signs in — the one that must raise the alarm. */
const TO_OLD = (c: EmailChange): string[] => [
  `The sign-in email for your Seminary Greek account has been changed from ${c.oldEmail} to `
  + `${c.newEmail}. This address can no longer be used to sign in. If you did not ask for this, `
  + `please reply to this message straight away.`,

  `El correo de acceso de tu cuenta de Seminary Greek se ha cambiado de ${c.oldEmail} a `
  + `${c.newEmail}. Esta dirección ya no sirve para iniciar sesión. Si no lo solicitaste, `
  + `responde a este mensaje de inmediato.`,

  `Адрес для входа в вашу учётную запись Seminary Greek изменён с ${c.oldEmail} на `
  + `${c.newEmail}. Этот адрес больше не подходит для входа. Если вы этого не запрашивали, `
  + `сразу же ответьте на это письмо.`,

  `您 Seminary Greek 帳戶的登入電子郵件已從 ${c.oldEmail} 變更為 ${c.newEmail}。`
  + `此地址將無法再用於登入。若您並未提出此要求，請立即回覆本郵件。`,
]

const body = (c: EmailChange, paragraphs: string[]) =>
  `Hello ${c.name},\n\n${paragraphs.join('\n\n')}\n\n  Sign-in page: ${c.signInUrl}\n`

export const emailChangeTextNew = (c: EmailChange) => body(c, TO_NEW(c))
export const emailChangeTextOld = (c: EmailChange) => body(c, TO_OLD(c))

const escape = (s: string) => s
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const html = (c: EmailChange, paragraphs: string[]) =>
  `<p>Hello ${escape(c.name)},</p>`
  + paragraphs.map(p => `<p>${escape(p)}</p>`).join('')
  + `<p>Sign-in page: <a href="${escape(c.signInUrl)}">${escape(c.signInUrl)}</a></p>`

export const emailChangeHtmlNew = (c: EmailChange) => html(c, TO_NEW(c))
export const emailChangeHtmlOld = (c: EmailChange) => html(c, TO_OLD(c))
