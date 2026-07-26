import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, test, expect } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { OrderRegistration } from "./Order";
import { orderList } from "@/domain/order/order";

// 1. Server Actionsのモック
vi.mock("@/_actions/order", () => ({
  getOrderListAction: vi.fn(async () => [{ id: "01KYBN9JXRDFJG4K82HCHE56E2" }]),
  updateOrderAction: vi.fn(async () => {}),
}));

vi.mock("@/components/image/OrderIcon", () => ({
  OrderIcon: ({ order }: { order: { name: string } }) => (
    // oxlint-disable-next-line next/no-img-element
    <img src="/order/test.png" alt={order.name} />
  ),
}));

const queryClient = new QueryClient();

const renderComponent = () =>
  render(
    <QueryClientProvider client={queryClient}>
      <OrderRegistration user={{ id: "test", name: "test" }} />
    </QueryClientProvider>,
  );

test("OrderRegistration - renders without crashing", async () => {
  renderComponent();
  await waitFor(() => {
    expect(screen.getByTestId("SaveIcon")).toBeInTheDocument();
  });
});

test("OrderRegistration - shows only paid orders and handles clicking", async () => {
  renderComponent();

  const paidOrders = orderList.filter((o) => o.payed);
  if (paidOrders.length === 0) return;

  const firstOrderImage = await screen.findAllByAltText(paidOrders[0].name);
  expect(firstOrderImage.length).toBeGreaterThan(0);

  fireEvent.click(firstOrderImage[0]);

  expect(await screen.findAllByText(paidOrders[0].name)).toBeDefined();
  expect(screen.getByText("効果")).toBeInTheDocument();
  expect(screen.getByText("説明")).toBeInTheDocument();
});
