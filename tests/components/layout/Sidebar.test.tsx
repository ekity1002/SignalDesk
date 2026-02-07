import "@testing-library/jest-dom/vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { Sidebar } from "~/components/layout/Sidebar";

function renderSidebar(sourceCount = 0) {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Sidebar sourceCount={sourceCount} />
    </MemoryRouter>,
  );
}

describe("Sidebar", () => {
  describe("navigation", () => {
    it("should render navigation sections", () => {
      renderSidebar();

      expect(screen.getByText("FEEDS")).toBeInTheDocument();
      expect(screen.getByText("MANAGEMENT")).toBeInTheDocument();
    });

    it("should render navigation links", () => {
      renderSidebar();

      expect(screen.getByText("Latest News")).toBeInTheDocument();
      expect(screen.getByText("Favorites")).toBeInTheDocument();
      expect(screen.getByText("RSS Sources")).toBeInTheDocument();
    });
  });

  describe("logout menu", () => {
    it("should have settings button in footer", () => {
      renderSidebar();

      const settingsButton = screen.getByRole("button", {
        name: /settings/i,
      });
      expect(settingsButton).toBeInTheDocument();
    });

    it("should show dropdown menu when settings button is clicked", async () => {
      const user = userEvent.setup();
      renderSidebar();

      const settingsButton = screen.getByRole("button", {
        name: /settings/i,
      });
      await user.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByRole("menu")).toBeInTheDocument();
      });
    });

    it("should have logout option in dropdown menu", async () => {
      const user = userEvent.setup();
      renderSidebar();

      const settingsButton = screen.getByRole("button", {
        name: /settings/i,
      });
      await user.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeInTheDocument();
      });
    });

    it("should have logout link pointing to /logout", async () => {
      const user = userEvent.setup();
      renderSidebar();

      const settingsButton = screen.getByRole("button", {
        name: /settings/i,
      });
      await user.click(settingsButton);

      await waitFor(() => {
        const logoutLink = screen.getByRole("menuitem", { name: /sign out/i });
        expect(logoutLink).toHaveAttribute("href", "/logout");
      });
    });
  });
});
