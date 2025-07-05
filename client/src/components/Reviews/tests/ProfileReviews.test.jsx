// ProfileReviews.test.jsx
import React from 'react';
import { render, screen, within } from '@testing-library/react';
import ProfileReviews from '../ProfileReviews';

describe('ProfileReviews Component', () => {
  const fakeReviews = [
    {
      review_id: 1,
      review_title: 'Amazing Service',
      content: 'The service was outstanding.',
      rating: 5,
      date_posted: '2024-03-20T12:00:00Z',
      last_updated: '2024-03-22T15:00:00Z',
      reviewer_username: 'Alice'
    },
    {
      review_id: 2,
      review_title: 'Good, but room for improvement',
      content: 'Overall a positive experience.',
      rating: 3,
      date_posted: '2024-03-21T10:30:00Z',
      last_updated: null,
      reviewer_username: 'Bob'
    }
  ];

  // Mock function to simulate fetching reviews for a profile
  const mockFetchProfileReviews = jest.fn().mockResolvedValue(fakeReviews);

  const setup = () =>
    render(<ProfileReviews fetchProfileReviews={mockFetchProfileReviews} />);

  test('renders all reviews for a specific profile', async () => {
    setup();
    
    // Wait for review titles to appear
    expect(await screen.findByText(/Amazing Service/i)).toBeInTheDocument();
    expect(await screen.findByText(/Good, but room for improvement/i)).toBeInTheDocument();
  });

  test('renders all components of a review card', async () => {
    setup();
    
    // Loop through each fake review and verify its key components
    for (const review of fakeReviews) {
      // Assert review title and content are rendered
      const titleElement = await screen.findByText(review.review_title);
      expect(titleElement).toBeInTheDocument();
      expect(await screen.findByText(review.content)).toBeInTheDocument();

      // Find the review card container by locating the closest parent with a MUI Card class
      const cardContainer = titleElement.closest('.MuiCard-root');
      expect(cardContainer).toBeInTheDocument();

      // Assert that the rating is displayed correctly.
      // We match a string that starts with "Rating:" followed by the rating value.
      const ratingRegex = new RegExp(`Rating:\\s*${review.rating}`, 'i');
      expect(within(cardContainer).getByText(ratingRegex)).toBeInTheDocument();

      // Assert that the posted date appears in the card.
      expect(within(cardContainer).getByText(/Posted on:/i)).toBeInTheDocument();

      // If last_updated exists and differs from date_posted, assert that the Last Updated text appears.
      if (review.last_updated && review.last_updated !== review.date_posted) {
        expect(within(cardContainer).getByText(/Last Updated:/i)).toBeInTheDocument();
      }

      // Assert the "Written by:" line is rendered.
      const writtenByText = `Written by: ${review.reviewer_username || 'Anonymous'}`;
      expect(within(cardContainer).getByText(new RegExp(writtenByText, 'i'))).toBeInTheDocument();
    }
  });

  test('renders "No reviews available yet." when there are no reviews', async () => {
    const emptyFetch = jest.fn().mockResolvedValue([]);
    render(<ProfileReviews fetchProfileReviews={emptyFetch} />);
    
    expect(await screen.findByText(/No reviews available yet\./i)).toBeInTheDocument();
  });
});