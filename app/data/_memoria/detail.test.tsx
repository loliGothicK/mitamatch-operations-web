import "@testing-library/jest-dom";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  default: {},
  notFound: () => notFoundMock(),
}));

vi.mock("@/components/image/MemoriaIcon", () => ({
  MemoriaIcon: ({ memoria }: { memoria: { name: { full: string } } }) => (
    <div data-testid="memoria-icon">{memoria.name.full}</div>
  ),
}));

import { memoriaList } from "@/domain/memoria/memoria";
import Detail from "@/data/_memoria/detail";

describe("Memoria Detail", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
  });

  const sample = memoriaList.find(
    (m) => memoriaList.filter((other) => other.uniqueId === m.uniqueId).length >= 2,
  )!;
  const variants = memoriaList.filter((m) => m.uniqueId === sample.uniqueId);

  it("renders memoria details by uniqueId and selects the matching cardType tab", () => {
    const secondVariant = variants[1]!;
    render(<Detail id={sample.uniqueId} type={secondVariant.cardType} />);

    expect(screen.getByRole("heading", { name: sample.name.full })).toBeInTheDocument();
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(variants.length);
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
  });

  it("falls back to the first tab when type is omitted", () => {
    render(<Detail id={sample.uniqueId} />);

    const tabs = screen.getAllByRole("tab");
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  });

  it("calls notFound when uniqueId does not exist", () => {
    expect(() => render(<Detail id="non-existent-id" />)).toThrow("NEXT_NOT_FOUND");
    expect(notFoundMock).toHaveBeenCalled();
  });
});
