import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PostCreation from './blog'; // Adjust path if needed
import { BrowserRouter } from 'react-router-dom';

// Reusable render function
const renderComponent = () =>
  render(
    <BrowserRouter>
      <PostCreation />
    </BrowserRouter>
  );

beforeEach(() => {
  localStorage.setItem("currentUser", JSON.stringify({ userId: "123" }));

  // Mocking fetch globally
  global.fetch = jest.fn((url) => {
    if (url.includes('/api/loadUserSettings')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ express: JSON.stringify([{ name: "Suraya" }]) }),
      });
    }

    if (url.includes('/api/posts')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve([
          {
            id: 1,
            title: "Test Post",
            content: "Test content",
            tag: "General",
            author: "Suraya",
            created_at: new Date().toISOString()
          }
        ])
      });
    }

    return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders SkillSwap title and Create a Post button', async () => {
  renderComponent();

  expect(screen.getByText(/Welcome to SkillSwap Discussions/i)).toBeInTheDocument();
  expect(screen.getByText(/Create a Post/i)).toBeInTheDocument();
});

test('renders tag filter dropdown', async () => {
  renderComponent();

  expect(screen.getByLabelText(/Filter by Tag/i)).toBeInTheDocument();
});

test('shows post form when Create a Post is clicked', async () => {
  renderComponent();

  fireEvent.click(screen.getByText(/Create a Post/i));

  expect(await screen.findByText(/Create a New Post/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Post Title/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/^Tag$/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Post Content/i)).toBeInTheDocument();
  expect(screen.getByText(/Submit Post/i)).toBeInTheDocument();
});

test('renders a fetched post card', async () => {
  renderComponent();

  await waitFor(() => {
    expect(screen.getByText(/Test Post/i)).toBeInTheDocument();
    expect(screen.getByText(/Test content/i)).toBeInTheDocument();
    expect(screen.getByText(/Tag: General/i)).toBeInTheDocument();
  });
});