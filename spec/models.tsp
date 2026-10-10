import "@typespec/http";

using TypeSpec.Http;

namespace CallCalendar;

// ===================== Ошибки =====================

enum ErrorCode {
  validation_error,
  slot_taken,
  out_of_window,
  not_found,
}

model Error {
  code: ErrorCode;

  message: string;

  fields: Record<string>;
}

model ErrorEnvelope {
  error: Error;
}

// ===================== Тип события =====================

model EventType {
  @doc("UUID, генерирует сервер; Владелец не вводит")
  id: string;

  @doc("Название Типа события")
  @minLength(1)
  @maxLength(100)
  name: string;

  @doc("Описание Типа события; может отсутствовать")
  @maxLength(500)
  description: string | null;

  @doc("Длительность в минутах, кратно 15, от 15 до 90")
  @minValue(15)
  @maxValue(90)
  duration: int32;
}

model EventTypeCreate {
  @minLength(1)
  @maxLength(100)
  name: string;

  @maxLength(500)
  description?: string | null;

  @doc("Длительность в минутах, кратно 15, от 15 до 90")
  @minValue(15)
  @maxValue(90)
  duration: int32;
}

// ===================== Доступность =====================

model Slot {
  @doc("Начало Слота, ISO 8601 без часового пояса, напр. 2026-10-10T09:00:00")
  start: string;

  @doc("Конец Слота, ISO 8601 без часового пояса, напр. 2026-10-10T09:15:00")
  end: string;

  available: boolean;
}

model Day {
  @format("date")
  date: string;

  slots: Slot[];
}

model AvailabilityWindow {
  @format("date")
  from: string;

  @format("date")
  to: string;
}

model Availability {
  eventTypeId: string;

  window: AvailabilityWindow;

  days: Day[];
}

// ===================== Встреча =====================

model Meeting {
  id: string;

  eventTypeId: string;

  eventTypeName: string;

  @doc("Начало Встречи, ISO 8601 без часового пояса")
  start: string;

  @doc("Конец Встречи, ISO 8601 без часового пояса")
  end: string;

  @minLength(1)
  @maxLength(100)
  guestName: string;

  @maxLength(254)
  @format("email")
  guestEmail: string;

  @doc("Время создания Записи, ISO 8601 без часового пояса")
  createdAt: string;
}

model MeetingCreate {
  eventTypeId: string;

  @doc("Начало Слота, ISO 8601 без часового пояса")
  start: string;

  @minLength(1)
  @maxLength(100)
  guestName: string;

  @maxLength(254)
  @format("email")
  guestEmail: string;
}

// ===================== Диагностика =====================

model Health {
  status: "ok";
}