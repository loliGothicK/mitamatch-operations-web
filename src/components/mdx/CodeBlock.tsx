"use client";

import { Children, isValidElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

type CodeProps = {
  children?: ReactNode;
  className?: string;
};

const SQL_KEYWORDS = new Set([
  "SELECT",
  "FROM",
  "WHERE",
  "ORDER",
  "BY",
  "LIMIT",
  "OFFSET",
  "GROUP",
  "HAVING",
  "AND",
  "OR",
  "NOT",
  "LIKE",
  "ILIKE",
  "IN",
  "IS",
  "NULL",
  "BETWEEN",
  "ASC",
  "DESC",
  "AS",
  "EXCEPT",
]);

function tokenizeSql(line: string) {
  const regex =
    /(--.*$)|("(?:[^"\\]|\\.)*")|('(?:[^'\\]|\\.)*')|(`[^`]+`)|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b|[<>!=]=|[(),;.*<>+=/-]/g;
  const tokens: Array<{ type: string; value: string }> = [];

  let lastIndex = 0;
  for (const match of line.matchAll(regex)) {
    const value = match[0];
    const index = match.index ?? 0;

    if (index > lastIndex) {
      tokens.push({ type: "plain", value: line.slice(lastIndex, index) });
    }

    if (match[1]) {
      tokens.push({ type: "comment", value });
    } else if (match[2] || match[3]) {
      tokens.push({ type: "string", value });
    } else if (match[4]) {
      tokens.push({ type: "identifier", value });
    } else if (/^\d/.test(value)) {
      tokens.push({ type: "number", value });
    } else if (/^[A-Za-z_]/.test(value)) {
      tokens.push({
        type: SQL_KEYWORDS.has(value.toUpperCase()) ? "keyword" : "plain",
        value,
      });
    } else {
      tokens.push({ type: "operator", value });
    }

    lastIndex = index + value.length;
  }

  if (lastIndex < line.length) {
    tokens.push({ type: "plain", value: line.slice(lastIndex) });
  }

  return tokens;
}

function renderSql(code: string) {
  const lines = code.replace(/\n$/, "").split("\n");

  return lines.map((line, lineIndex) => (
    <span key={`line-${lineIndex}`} className="mitamatch-code-line">
      {tokenizeSql(line).map((token, tokenIndex) => (
        <span
          key={`token-${lineIndex}-${tokenIndex}`}
          className={`mitamatch-token mitamatch-token-${token.type}`}
        >
          {token.value}
        </span>
      ))}
      {lineIndex < lines.length - 1 ? "\n" : null}
    </span>
  ));
}

export function CodeBlock(props: HTMLAttributes<HTMLPreElement>) {
  const child = Children.only(props.children) as ReactElement<CodeProps>;

  if (!isValidElement<CodeProps>(child)) {
    return <pre {...props} />;
  }

  const className = child.props.className ?? "";
  const rawCode =
    typeof child.props.children === "string"
      ? child.props.children
      : Array.isArray(child.props.children)
        ? child.props.children.join("")
        : "";

  if (!className.includes("language-sql")) {
    return <pre {...props} />;
  }

  return (
    <pre {...props} data-language="sql">
      <code className={className}>{renderSql(rawCode)}</code>
    </pre>
  );
}
