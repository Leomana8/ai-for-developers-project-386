import "@typespec/http";
import "./models.tsp";

using TypeSpec.Http;

@service(#{ title: "Календарь звонков API" })
@server("http://localhost:3001", "Локальный сервер разработки")
namespace CallCalendar;

// ===================== HTTP-ответы =====================

model CreatedResponse<T> {
  @statusCode statusCode: 201;
  @body body: T;
}

@error
model NotFoundError {
  @statusCode statusCode: 404;
  @body body: ErrorEnvelope;
}

@error
model ConflictError {
  @statusCode statusCode: 409;
  @body body: ErrorEnvelope;
}

@error
model ValidationError {
  @statusCode statusCode: 422;
  @body body: ErrorEnvelope;
}

// ===================== Маршруты =====================

@route("/api")
namespace Api {
  @route("/event-types")
  @tag("EventTypes")
  interface EventTypes {
    @get list(): EventType[];

    @post create(@body body: EventTypeCreate): CreatedResponse<EventType> | ValidationError;
  }

  @route("/event-types/{id}/slots")
  @tag("Slots")
  interface Slots {
    @get list(@path id: string): Availability | NotFoundError;
  }

  @route("/meetings")
  @tag("Meetings")
  interface Meetings {
    @get list(): Meeting[];

    @post create(
      @body body: MeetingCreate,
    ):
      | CreatedResponse<Meeting>
      | ValidationError
      | ConflictError
      | NotFoundError;
  }

  @route("/health")
  @tag("Diagnostics")
  interface Diagnostics {
    @get check(): Health;
  }
}