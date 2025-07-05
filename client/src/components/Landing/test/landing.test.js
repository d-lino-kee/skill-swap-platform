import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Landing from "../index";

// Mock navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("Landing Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setup = () =>
    render(
      <MemoryRouter>
        <Landing />
      </MemoryRouter>
    );

  it("renders welcome message and subtitle", () => {
    setup();
    expect(screen.getByText(/welcome to skillswap/i)).toBeInTheDocument();
    expect(
      screen.getByText(/connect, collaborate, and grow your skills/i)
    ).toBeInTheDocument();
  });

  it("renders all navigation buttons", () => {
    setup();
    ["Search", "Matches", "Blog", "Profile"].forEach((label) => {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    });
  });

  it("navigates to correct route when buttons are clicked", () => {
    setup();

    const searchBtn = screen.getByRole("button", { name: /search/i });
    fireEvent.click(searchBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/Search");

    const matchesBtn = screen.getByRole("button", { name: /matches/i });
    fireEvent.click(matchesBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/Matches");

    const blogBtn = screen.getByRole("button", { name: /blog/i });
    fireEvent.click(blogBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/Blog");

    const profileBtn = screen.getByRole("button", { name: /profile/i });
    fireEvent.click(profileBtn);
    expect(mockNavigate).toHaveBeenCalledWith("/Profile");
  });
});