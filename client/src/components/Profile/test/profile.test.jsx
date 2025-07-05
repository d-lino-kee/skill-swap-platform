import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Profile from "../index";
import { auth } from "../../../firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

jest.mock("../../../firebase", () => ({
  auth: {
    currentUser: { uid: "test-uid", email: "test@example.com" },
  },
}));

jest.mock("firebase/storage", () => ({
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(),
  uploadBytes: jest.fn(() => Promise.resolve()),
  getDownloadURL: jest.fn(() => Promise.resolve("https://fakeurl.com/profile.jpg")),
}));

describe("Profile Component", () => {
  beforeEach(() => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          name: "John Doe",
          skill: "React",
          location: "Remote",
          time_availability: "9,10",
          years_of_experience: 3,
          portfolio_link: "https://portfolio.com",
          profile_picture: "https://oldpic.com/pic.jpg",
        })
      })
      .mockResolvedValueOnce({ ok: true });

    jest.clearAllMocks();
  });

  const renderWithRouter = (ui) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>);
  };

  it("renders profile form with fetched user data", async () => {
    renderWithRouter(<Profile />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("John Doe")).toBeInTheDocument();
      expect(screen.getByDisplayValue("React")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Remote")).toBeInTheDocument();
      expect(screen.getByDisplayValue("3")).toBeInTheDocument();
      expect(screen.getByDisplayValue("https://portfolio.com")).toBeInTheDocument();
      expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
    });
  });


  it("handles error if profile fetch fails", async () => {
    global.fetch = jest.fn().mockResolvedValueOnce({ ok: false });
    renderWithRouter(<Profile />);

    await waitFor(() => {
      expect(screen.getByText("Error fetching profile data.")).toBeInTheDocument();
    });
  });
});