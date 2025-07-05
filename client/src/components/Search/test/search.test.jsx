import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Search from '../Search';

// Mock useNavigate from react-router-dom
const mockedNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockedNavigate,
}));

global.fetch = jest.fn();

describe('Search Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const setup = () => render(
    <BrowserRouter>
      <Search />
    </BrowserRouter>
  );

  test('renders inputs and clear button', () => {
    setup();
    expect(screen.getByLabelText(/search by skill/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/search by time availability/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
  });

  test('performs search and displays results', async () => {
    const mockUsers = [{
      id: 1,
      name: 'Alice',
      skill: 'React',
      location: 'NYC',
      time_availability: 'Weekends',
      portfolio_link: 'https://portfolio.com/alice',
      profile_picture: '/profile.jpg',
    }];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    setup();
    fireEvent.change(screen.getByLabelText(/search by skill/i), { target: { value: 'React' } });
    fireEvent.change(screen.getByLabelText(/search by time availability/i), { target: { value: 'Weekends' } });

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText(/react/i)).toBeInTheDocument();
    expect(screen.getByText(/nyc/i)).toBeInTheDocument();
    expect(screen.getByText(/weekends/i)).toBeInTheDocument();
  });

  test('navigates to user profile on image click', async () => {
    const mockUsers = [{
      id: 1,
      name: 'Alice',
      skill: 'React',
      location: 'NYC',
      time_availability: 'Weekends',
      portfolio_link: '',
      profile_picture: '/profile.jpg',
    }];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    setup();
    fireEvent.change(screen.getByLabelText(/search by skill/i), { target: { value: 'React' } });
    fireEvent.change(screen.getByLabelText(/search by time availability/i), { target: { value: 'Weekends' } });

    await waitFor(() => screen.getByRole('img', { name: /alice/i }));
    fireEvent.click(screen.getByRole('img', { name: /alice/i }));

    expect(mockedNavigate).toHaveBeenCalledWith('/profile/1');
  });

  test('displays success message after sending invite', async () => {
    const mockUsers = [{
      id: 1,
      name: 'Alice',
      skill: 'React',
      location: 'NYC',
      time_availability: 'Weekends',
      portfolio_link: '',
      profile_picture: '/profile.jpg',
    }];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    localStorage.setItem('currentUser', JSON.stringify({ userId: 99 }));

    setup();
    fireEvent.change(screen.getByLabelText(/search by skill/i), { target: { value: 'React' } });
    fireEvent.change(screen.getByLabelText(/search by time availability/i), { target: { value: 'Weekends' } });

    await waitFor(() => screen.getByText('Alice'));

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Invite sent successfully!' }),
    });

    fireEvent.click(screen.getByRole('button', { name: /send invite/i }));

    expect(await screen.findByText(/invite sent successfully!/i)).toBeInTheDocument();
  });

  test('displays error message when invite fails', async () => {
    const mockUsers = [{
      id: 1,
      name: 'Bob',
      skill: 'Vue',
      location: 'LA',
      time_availability: 'Evenings',
      portfolio_link: '',
      profile_picture: '/profile.jpg',
    }];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    localStorage.setItem('currentUser', JSON.stringify({ userId: 99 }));

    setup();
    fireEvent.change(screen.getByLabelText(/search by skill/i), { target: { value: 'Vue' } });
    fireEvent.change(screen.getByLabelText(/search by time availability/i), { target: { value: 'Evenings' } });

    await waitFor(() => screen.getByText('Bob'));

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Failed to send invite' }),
    });

    fireEvent.click(screen.getByRole('button', { name: /send invite/i }));

    expect(await screen.findByText(/failed to send invite/i)).toBeInTheDocument();
  });
});