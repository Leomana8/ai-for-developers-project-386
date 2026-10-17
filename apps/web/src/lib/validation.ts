// Формат email из спеки (`@format("email")` в spec/models.tsp) проверяет на
// сервере ajv-formats. Ниже — тот же шаблон из его набора форматов: email в
// режиме `fast`, который express-openapi-validator включает по умолчанию
// (`validateFormats` → `ajvFormats: { mode: 'fast' }`). Шаблон скопирован
// дословно: подсказка клиента обязана отвергать ровно то, что отвергнет
// валидатор, иначе пользователю показывается технический текст ошибки вместо
// русского канона (§5 «Запись»). Правки сюда и в spec/models.tsp должны идти
// вместе.
const EMAIL_PATTERN =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)*$/i

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value)
}
