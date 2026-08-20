// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { NavigationToggle } from "./DashboardLayout";
import { SidebarProvider, useSidebar } from "./ui/sidebar";

function SidebarStateProbe() {
  const { state } = useSidebar();
  return <output data-testid="sidebar-state">{state}</output>;
}

beforeAll(() => {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

describe("NavigationToggle", () => {
  it("closes the actual sidebar state and reopens it on the next click", () => {
    render(<SidebarProvider><NavigationToggle /><SidebarStateProbe /></SidebarProvider>);
    expect(screen.getByTestId("sidebar-state").textContent).toBe("expanded");
    fireEvent.click(screen.getByRole("button", { name: "Toggle navigation" }));
    expect(screen.getByTestId("sidebar-state").textContent).toBe("collapsed");
    fireEvent.click(screen.getByRole("button", { name: "Toggle navigation" }));
    expect(screen.getByTestId("sidebar-state").textContent).toBe("expanded");
  });
});
