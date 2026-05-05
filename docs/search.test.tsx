import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import { HttpResponse, http } from "msw";
import { PriceSearch } from "../src/components/PriceSearch";

const server = setupServer(
  http.get("/api/compare", () =>
    HttpResponse.json({
      stores: [
        { id: "1", name: "Store A", totalPrice: 24.5, distanceMiles: 2.2 },
        { id: "2", name: "Store B", totalPrice: 21.0, distanceMiles: 3.1 },
      ],
    })
  )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("compare search", () => {
  it("submits a location and shows store results from the API", async () => {
    const user = userEvent.setup();
    render(<PriceSearch />);

    await user.type(screen.getByLabelText(/location/i), "94107");
    await user.click(screen.getByRole("button", { name: /compare prices/i }));

    expect(await screen.findByRole("heading", { name: "Store A" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Store B" })).toBeInTheDocument();

    const results = screen.getByRole("list", { name: /store results/i });
    expect(within(results).getByText(/\$24\.50/)).toBeInTheDocument();
    expect(within(results).getByText(/\$21\.00/)).toBeInTheDocument();
  });
});
