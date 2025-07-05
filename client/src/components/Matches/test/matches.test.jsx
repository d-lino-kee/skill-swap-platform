import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Matches from '../index'; // <-- Make sure it's the default export

beforeEach(() => {
  // Mock localStorage
  const user = { userId: 1 };
  Storage.prototype.getItem = jest.fn(() => JSON.stringify(user));

  // Mock fetch
  global.fetch = jest.fn((url) => {
    if (url.includes('/api/matches')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          pending: [
            {
              id: 101,
              sender_name: 'Alice',
              sender_skill: 'React',
              requested_skill: 'Node.js',
              location: 'Online',
              time_availability: 'Mon,Wed',
              email: 'alice@example.com'
            },
            {
              id: 102,
              sender_name: 'Charlie',
              sender_skill: 'Vue',
              requested_skill: 'Django',
              location: 'Remote',
              time_availability: 'Tue,Thu',
              email: 'charlie@example.com'
            }
          ],
          accepted: [
            {
              id: 201,
              name: 'Bob',
              skill: 'Express',
              location: 'Online',
              time_availability: 'Fri,Sat',
              email: 'bob@example.com'
            }
          ]
        })
      });
    }

    if (url.includes('/accept')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ email: 'accepted@example.com' })
      });
    }

    if (url.includes('/reject')) {
      return Promise.resolve({ ok: true });
    }

    return Promise.reject(new Error('Unknown endpoint'));
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('renders Matches component with pending and accepted users', async () => {
  render(<Matches />);

  // Wait for component to load data
  expect(await screen.findByText(/Pending Requests/i)).toBeInTheDocument();
  expect(screen.getByText(/Accepted Matches/i)).toBeInTheDocument();

  expect(screen.getByText('Alice')).toBeInTheDocument();
  expect(screen.getByText('Charlie')).toBeInTheDocument();
  expect(screen.getByText('Bob')).toBeInTheDocument();
});

test('accepts a pending request', async () => {
  render(<Matches />);
  await screen.findByText('Alice');

  const acceptButton = screen.getAllByRole('button', { name: /accept/i })[0];
  userEvent.click(acceptButton);

  await waitFor(() => {
    expect(screen.getByText(/Skill swap accepted!/i)).toBeInTheDocument();
    expect(screen.queryByText('Alice')).not.toBeNull(); // Moved to accepted
  });
});

test('rejects a pending request', async () => {
  render(<Matches />);
  await screen.findByText('Charlie');

  const rejectButton = screen.getAllByRole('button', { name: /reject/i })[1];
  userEvent.click(rejectButton);

  await waitFor(() => {
    expect(screen.getByText(/Request rejected/i)).toBeInTheDocument();
    expect(screen.queryByText('Charlie')).toBeNull();
  });
});