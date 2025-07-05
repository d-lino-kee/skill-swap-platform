import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignIn from "../index";
import { useNavigate } from "react-router-dom";
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "../../../firebase";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

jest.mock("../../../firebase", () => ({
  auth: {},
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));

describe("SignIn component", () => {
  const navigateMock = jest.fn();
  const onLoginMock = jest.fn();

  beforeEach(() => {
    useNavigate.mockReturnValue(navigateMock);
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("renders input fields and buttons", () => {
    render(<SignIn onLogin={onLoginMock} />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /new user\? sign up/i })).toBeInTheDocument();
  });

  it("toggles between sign in and sign up modes", () => {
    render(<SignIn onLogin={onLoginMock} />);
    fireEvent.click(screen.getByText(/new user\? sign up/i));
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
    fireEvent.click(screen.getByText(/already have an account\? sign in/i));
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("handles rapid toggle between sign in and sign up", () => {
    render(<SignIn onLogin={onLoginMock} />);
    fireEvent.click(screen.getByText(/new user\? sign up/i));
    fireEvent.click(screen.getByText(/already have an account\? sign in/i));
    fireEvent.click(screen.getByText(/new user\? sign up/i));
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });

  it("clears error message when retrying after failed sign in", async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce(new Error("Invalid login"));
    render(<SignIn onLogin={onLoginMock} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "badpass" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText("Invalid login")).toBeInTheDocument());

    signInWithEmailAndPassword.mockResolvedValueOnce({ user: { uid: "456", email: "user@example.com" } });
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ userId: 99 }) });

    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.queryByText("Invalid login")).not.toBeInTheDocument();
      expect(onLoginMock).toHaveBeenCalled();
    });
  });

  it("signs in an existing user successfully", async () => {
    const mockUser = { uid: "123", email: "test@example.com" };
    signInWithEmailAndPassword.mockResolvedValue({ user: mockUser });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ userId: 42 }),
    });

    render(<SignIn onLogin={onLoginMock} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "test@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "password" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, "test@example.com", "password");
      expect(localStorage.getItem("currentUser")).toContain("test@example.com");
      expect(onLoginMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith("/");
    });
  });

  it("displays error message on failed sign in", async () => {
    signInWithEmailAndPassword.mockRejectedValue(new Error("Invalid login"));

    render(<SignIn onLogin={onLoginMock} />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "wrong@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "wrongpass" } });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid login")).toBeInTheDocument();
    });
  });

  it("signs up a new user successfully", async () => {
    const mockUser = { uid: "999", email: "newuser@example.com" };
    createUserWithEmailAndPassword.mockResolvedValue({ user: mockUser });

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({ ok: true }) // for /api/register
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ userId: 88 }),
      });

    render(<SignIn onLogin={onLoginMock} />);
    fireEvent.click(screen.getByText(/new user\? sign up/i));
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "newuser@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "newpass123" } });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, "newuser@example.com", "newpass123");
      expect(localStorage.getItem("currentUser")).toContain("newuser@example.com");
      expect(onLoginMock).toHaveBeenCalled();
      expect(navigateMock).toHaveBeenCalledWith("/");
    });
  });

  it("displays error on failed sign up", async () => {
    createUserWithEmailAndPassword.mockRejectedValue(new Error("Signup failed"));

    render(<SignIn onLogin={onLoginMock} />);
    fireEvent.click(screen.getByText(/new user\? sign up/i));
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "failuser@example.com" } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: "failpass" } });
    fireEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText("Signup failed")).toBeInTheDocument();
    });
  });
});