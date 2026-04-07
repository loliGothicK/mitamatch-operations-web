"use client";

import { Children, cloneElement, isValidElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import LightbulbOutlined from "@mui/icons-material/LightbulbOutlined";
import ErrorOutlineOutlined from "@mui/icons-material/ErrorOutlineOutlined";
import ReportProblemOutlined from "@mui/icons-material/ReportProblemOutlined";
import {match} from "ts-pattern";

type CalloutKind = "note" | "tip" | "important" | "warning" | "caution";

const CALLOUT_PATTERN = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)]\s*/i;

type ParagraphProps = {
  children?: ReactNode;
};

function normalizeChildren(children: ReactNode): ReactNode[] {
  return Children.toArray(children);
}

function extractLeadingText(children: ReactNode) {
  const nodes = normalizeChildren(children);
  const firstTextIndex = nodes.findIndex((node) => typeof node === "string" && node.trim().length > 0);
  const first = firstTextIndex >= 0 ? nodes[firstTextIndex] : null;

  if (typeof first !== "string") {
    return null;
  }

  const matched = first.match(CALLOUT_PATTERN);
  if (!matched) {
    return null;
  }

  const kind = matched[1].toLowerCase() as CalloutKind;
  const rest = first.replace(CALLOUT_PATTERN, "");
  const nextNodes = [...nodes];
  nextNodes[firstTextIndex] = rest;
  return {
    kind,
    children: nextNodes,
  };
}

function asTitle(kind: CalloutKind) {
  return match(kind)
    .with("note", () => "Note")
    .with("tip", () => "Tip")
    .with("important", () => "Important")
    .with("warning", () => "Warning")
    .with("caution", () => "Caution")
    .exhaustive();
}

function CalloutIcon({ kind }: { kind: CalloutKind }) {
  return match(kind)
    .with("note", () => <InfoOutlined fontSize="small" />)
    .with("tip", () => <LightbulbOutlined fontSize="small" />)
    .with("important", () => <InfoOutlined fontSize="small" />)
    .with("warning", () => <ReportProblemOutlined fontSize="small" />)
    .with("caution", () => <ErrorOutlineOutlined fontSize="small" />)
    .exhaustive();
}

export function Callout(props: HTMLAttributes<HTMLQuoteElement>) {
  const children = normalizeChildren(props.children);
  const directChild = props.children;
  const firstParagraphChild = children.find(
    (child): child is ReactElement<ParagraphProps> =>
      isValidElement<ParagraphProps>(child) && child.type === "p",
  );

  if (typeof props.children === "string") {
    const extracted = extractLeadingText(props.children);
    if (!extracted) {
      return <blockquote {...props} />;
    }

    return (
      <blockquote {...props} className={`mitamatch-callout mitamatch-callout-${extracted.kind}`}>
        <div className="mitamatch-callout-heading">
          <span className="mitamatch-callout-icon">
            <CalloutIcon kind={extracted.kind} />
          </span>
          <div className="mitamatch-callout-title">{asTitle(extracted.kind)}</div>
        </div>
        <p>{extracted.children}</p>
      </blockquote>
    );
  }

  if (isValidElement<ParagraphProps>(directChild) && directChild.type === "p") {
    const extracted = extractLeadingText(directChild.props.children);
    if (!extracted) {
      return <blockquote {...props} />;
    }

    const patchedChild = cloneElement(directChild as ReactElement<ParagraphProps>, {
      children: extracted.children,
    });

    return (
      <blockquote {...props} className={`mitamatch-callout mitamatch-callout-${extracted.kind}`}>
        <div className="mitamatch-callout-heading">
          <span className="mitamatch-callout-icon">
            <CalloutIcon kind={extracted.kind} />
          </span>
          <div className="mitamatch-callout-title">{asTitle(extracted.kind)}</div>
        </div>
        {patchedChild}
      </blockquote>
    );
  }

  if (!firstParagraphChild) {
    return <blockquote {...props} />;
  }

  const extracted = extractLeadingText(firstParagraphChild.props.children);
  if (!extracted) {
    return <blockquote {...props} />;
  }

  const patchedChildren = children.map((child) => {
    if (child === firstParagraphChild) {
      return cloneElement(firstParagraphChild, {
        children: extracted.children,
      });
    }

    return child;
  });

  return (
    <blockquote {...props} className={`mitamatch-callout mitamatch-callout-${extracted.kind}`}>
      <div className="mitamatch-callout-heading">
        <span className="mitamatch-callout-icon">
          <CalloutIcon kind={extracted.kind} />
        </span>
        <div className="mitamatch-callout-title">{asTitle(extracted.kind)}</div>
      </div>
      {patchedChildren}
    </blockquote>
  );
}
