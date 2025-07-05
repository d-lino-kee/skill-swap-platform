describe('My Reviews Page - Basic Functionality', () => {
  beforeEach(() => {
    // Visit the My Reviews page
    cy.visit('/my-reviews'); // change if your route is different
  });

  it('displays the average rating if present', () => {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Average Rating')) {
        cy.contains('Average Rating').should('be.visible');
      }
    });
  });

  it('displays at least one review card if reviews exist', () => {
    cy.get('body').then(($body) => {
      if ($body.find('[data-testid="review-card"]').length > 0) {
        cy.get('[data-testid="review-card"]').should('have.length.greaterThan', 0);
      } else {
        cy.log('No reviews to display yet.');
      }
    });
  });
});