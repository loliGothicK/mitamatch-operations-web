import { type NextRequest, NextResponse } from "next/server";
import { getSession } from "@/actions/auth";

// 1. Specify protected and public routes
const protectedRoutes = ["/dashboard", "/user"];

export default async function proxy(req: NextRequest) {
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-base-path", req.nextUrl.basePath);
  // Nonceの生成
  const nonce = generateNonce();
  // CSPヘッダの生成
  const csp = generateCspHeader(nonce);

  // コンポーネント側で取得できるようにリクエストヘッダにも設定
  requestHeaders.set("X-CSP-Nonce", nonce);
  // Next.jsが差し込むインラインスクリプトにもNonceが設定されるようにリクエストヘッダにもCSPを設定
  requestHeaders.set("Content-Security-Policy", csp);

  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route),
  );

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  const user = await getSession();

  // 4. Redirect to /login if the user is not authenticated
  if (!user) {
    return NextResponse.redirect(new URL("/api/auth/discord", req.nextUrl));
  }

  // 5. Redirect to /dashboard if the user is authenticated
  if (!req.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
  if (!req.nextUrl.pathname.startsWith("/user")) {
    return NextResponse.redirect(new URL(`/user/@${user.userId}`, req.nextUrl));
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Routes Middleware should not run on
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|.*\\.png$).*)",
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};

// Nonceのビット長
// 参考: https://w3c.github.io/webappsec-csp/#security-nonces
const NONCE_BIT_LENGTH = 128;

// Nonceの生成
// Node.jsのAPIは利用できないので、Web Crypto APIを使用
function generateNonce(): string {
  return bufferToHex(
    crypto.getRandomValues(new Uint8Array(NONCE_BIT_LENGTH / 8)),
  );
}

// CSPヘッダの生成
function generateCspHeader(nonce: string): string {
  const scriptSrc = [
    "'self'",
    // 開発環境ではevalを許可
    process.env.NODE_ENV === "development" && "'unsafe-eval'",
    `'nonce-${nonce}'`,
    // Twitterの埋め込みやGoogle Tag Managerを使っている場合は適宜設定
    "https://www.googletagmanager.com",
    "https://platform.twitter.com",
  ]
    .filter(Boolean)
    .join(" ");

  // CSPの設定
  // 自分のサイトの状況に応じて適宜設定
  return [
    "default-src 'self'",
    "connect-src 'self' https://www.google-analytics.com",
    "frame-src 'self' https://www.googletagmanager.com https://platform.twitter.com",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "font-src * data:",
    "img-src * data:",
  ].join("; ");
}

// ArrayBufferを16進数の文字列に変換する
function bufferToHex(buffer: Uint8Array): string {
  return Array.from(buffer)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
