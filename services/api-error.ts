import { isApiError } from "@/services/api";

function normalizeMessage(message?: string | string[]) {
  if (Array.isArray(message)) {
    return message.join("\n");
  }

  return message;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!isApiError(error)) {
    return fallback;
  }

  const message = normalizeMessage(error.response?.data?.message);

  if (message) {
    if (message === "Invalid credentials") {
      return "Email ou senha incorretos.";
    }

    if (message === "Email already in use") {
      return "Este email ja esta em uso.";
    }

    if (message === "Invalid Vera PIN.") {
      return "PIN Vera incorreto.";
    }

    if (message === "Vera PIN is not configured.") {
      return "O PIN Vera ainda nao foi configurado.";
    }

    if (message === "Too many failed Vera PIN attempts. Try again later.") {
      return "Muitas tentativas. Tente novamente mais tarde.";
    }

    if (message === "Current Vera PIN is required.") {
      return "Digite o PIN Vera atual para alterar.";
    }

    if (message === "Consent must be accepted before enabling Vera mode.") {
      return "Aceite o consentimento Vera antes de ativar o modo privado.";
    }

    if (message === "Latitude and longitude must be sent together.") {
      return "Latitude e longitude devem ser enviadas juntas.";
    }

    if (
      message === "Alert session can only be closed as resolved or cancelled."
    ) {
      return "A sessao de alerta so pode ser encerrada como resolvida ou cancelada.";
    }

    if (message === "Alert session is already closed.") {
      return "Essa sessao de alerta ja foi encerrada.";
    }

    if (message === "Alert session not found") {
      return "Sessao de alerta nao encontrada.";
    }

    if (
      message ===
      "Emergency contacts can only be notified for active alert sessions."
    ) {
      return "Contatos so podem ser acionados em uma sessao ativa.";
    }

    if (
      message ===
      "Emergency contacts can only be notified for critical alerts."
    ) {
      return "Contatos so podem ser acionados quando a sessao estiver critica.";
    }

    return message;
  }

  if (error.response?.status === 401) {
    return "Sessao expirada. Entre novamente para continuar.";
  }

  if (error.response?.status === 404) {
    return "Nao encontramos esse recurso agora.";
  }

  if (error.code === "ECONNABORTED") {
    return "A conexao demorou demais. Tente novamente.";
  }

  return fallback;
}
