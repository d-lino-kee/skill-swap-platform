describe('Matches Page Basic Tests', () => {
  beforeEach(() => {
    // Set up localStorage with a user
    cy.window().then((win) => {
      win.localStorage.setItem('currentUser', JSON.stringify({ 
        userId: '123', 
        name: 'Test User' 
      }));
    });

    // Visit the matches page directly
    cy.visit('/Matches');
  });

  // Test 1: Basic page load
  it('loads the matches page', () => {
    // Just verify the page loads without crashing
    cy.get('body').should('be.visible');
  });

  // Test 2: Check for container elements
  it('contains main container elements', () => {
    // Look for container elements that should exist
    cy.get('div').should('exist');
    cy.get('body').should('exist');
  });


  // Test 4: Check for buttons
  it('contains interactive elements', () => {
    // Look for buttons
    cy.get('button').should('exist');
  });

  // Test 5: Check navigation
  it('maintains navigation state', () => {
    // Verify URL contains matches
    cy.url().should('include', '/Matches');
  });
});