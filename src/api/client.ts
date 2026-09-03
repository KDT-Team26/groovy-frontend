import { getToken } from "./tokenStore";

// S3+CloudFront 정적 배포로 전환하면서 컨테이너 런타임 주입(env-config.js/window.__ENV__)
// 방식은 더 이상 쓰지 않는다 — 환경별로 이미지를 재사용할 필요가 없어졌으므로, Vite 표준
// 방식대로 빌드타임에 .env.production 값이 번들에 그대로 박힌다.
export const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

interface ApiEnvelope<T> {
  status: string;
  message: string;
  data: T;
}

// 백엔드는 실패 응답도 성공 응답과 동일한 { status, message, data } envelope으로 내려주므로,
// 원문 텍스트 대신 그 message를 사용자에게 보여줄 에러 메시지로 우선 사용한다.
function extractErrorMessage(body: string): string | undefined {
  try {
    const parsed = JSON.parse(body) as Partial<ApiEnvelope<unknown>>;
    return typeof parsed.message === "string" && parsed.message ? parsed.message : undefined;
  } catch {
    return undefined;
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const message = extractErrorMessage(body);
    throw new Error(message ?? `API ${options.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const envelope = (await res.json()) as ApiEnvelope<T>;
  if (envelope.status !== "SUCCESS") {
    throw new Error(envelope.message);
  }
  return envelope.data;
}
