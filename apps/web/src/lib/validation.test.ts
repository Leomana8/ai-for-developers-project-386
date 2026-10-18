import { describe, expect, it } from 'vitest'

import { isValidEmail } from './validation'

// Правило обязано совпадать с тем, что проверяет сервер (`@format("email")` в
// спеке, ajv-formats в режиме `fast`). Расхождение означает, что пользователь
// увидит технический текст валидатора вместо русского канона §5 (#51).
describe('isValidEmail', () => {
  it.each([
    'ivan@example.com',
    'Ivan@Example.COM',
    'user.name+tag@sub.example.co.uk',
    'a@b.co',
    'user@localhost',
    'a..b@example.com',
  ])('принимает %s', (value) => {
    expect(isValidEmail(value)).toBe(true)
  })

  it.each([
    '',
    'not-an-email',
    'фук@gse.tu',
    'фук@example.com',
    'юзер@example.com',
    'user@пример.рф',
    'user@-example.com',
    'user@example..com',
    'user@example.com.',
    '"q"@example.com',
    'user@[127.0.0.1]',
  ])('отвергает %s', (value) => {
    expect(isValidEmail(value)).toBe(false)
  })
})
