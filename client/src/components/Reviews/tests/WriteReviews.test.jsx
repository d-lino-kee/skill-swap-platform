// src/components/Reviews/tests/WriteReviews.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WriteReviews from '../WriteReviews';
import { FirebaseContext } from '../../Firebase/context';
import { BrowserRouter } from 'react-router-dom';

// Mock useLocation to provide a recipientId via state
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    state: { recipientId: 2 },
  }),
}));

// Mock the MUI Rating component so that it renders an input element for testing.
// When its value changes, we call the onChange prop with the new value (as a number).
jest.mock('@mui/material/Rating', () => (props) => {
  return (
    <input
      data-testid="rating"
      type="number"
      value={props.value || 0}
      onChange={(e) => props.onChange(e, Number(e.target.value))}
    />
  );
});

describe('WriteReviews Component', () => {
  const fakeUser = { userId: '1' };

  beforeEach(() => {
    localStorage.setItem('currentUser', JSON.stringify(fakeUser));
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
  });

  // Utility wrapper for rendering the component
  const renderComponent = (props = {}) =>
    render(
      <FirebaseContext.Provider value={{ auth: { currentUser: fakeUser } }}>
        <BrowserRouter>
          <WriteReviews {...props} />
        </BrowserRouter>
      </FirebaseContext.Provider>
    );

  test('renders review form fields and submit button', () => {
    renderComponent();
    expect(screen.getByLabelText(/Title your review/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Write a review/i)).toBeInTheDocument();
    expect(screen.getByTestId('rating')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Submit Review/i })).toBeInTheDocument();
  });

  test('submits a review successfully', async () => {
    // Mock the successful POST submission
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Review submitted successfully!' }),
    });

    const onSuccess = jest.fn();
    const onClose = jest.fn();

    renderComponent({ onSuccess, onClose });

    // Fill in the form fields.
    fireEvent.change(screen.getByLabelText(/Title your review/i), {
      target: { value: 'Test Title' },
    });
    fireEvent.change(screen.getByLabelText(/Write a review/i), {
      target: { value: 'Test review content' },
    });

    // Simulate selecting a rating.
    const ratingInput = screen.getByTestId('rating');
    fireEvent.change(ratingInput, { target: { value: '4' } });

    // Click the submit button.
    fireEvent.click(screen.getByRole('button', { name: /Submit Review/i }));

    // Wait for the fetch call to be made.
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    // Extract the arguments with which fetch was called.
    const [url, options] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/reviews');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({
      'Content-Type': 'application/json',
      'user-id': fakeUser.userId,
    });

    // Parse the body and verify its content.
    const body = JSON.parse(options.body);
    expect(body).toEqual({
      reviewer_id: fakeUser.userId,
      recipient_id: 2,
      review_title: 'Test Title',
      content: 'Test review content',
      rating: 4,
      date_posted: expect.any(String),
    });

    // Wait for the success callbacks to be invoked.
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });

    // Check that the success message is displayed.
    expect(screen.getByText(/Review submitted successfully!/i)).toBeInTheDocument();
  });

  test('shows error if required fields are missing', async () => {
    renderComponent();
    // Click the submit button without filling out any fields.
    fireEvent.click(screen.getByRole('button', { name: /Submit Review/i }));
    await waitFor(() => {
      expect(
        screen.getByText(/Please provide a title, review text, and rating\./i)
      ).toBeInTheDocument();
    });
  });
});