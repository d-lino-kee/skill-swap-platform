describe('Search functionality', () => {
    beforeEach(() => {
      // Visit the root URL
      cy.visit('/');
      
      // Handle login
      cy.get('input').first().type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('button').contains(/sign/i).click();
      
      // Wait for login to complete
      cy.wait(2000);
      
      // Debug: Log the current URL after login
      cy.url().then(url => {
        cy.log(`Current URL after login: ${url}`);
      });
      
      // Debug: Log available navigation options
      cy.get('button').then($buttons => {
        const buttonTexts = Array.from($buttons).map(el => el.innerText);
        cy.log(`Available buttons: ${buttonTexts.join(', ')}`);
      });
      
      // Try to navigate to Search using the button in the navbar
      cy.get('button').then($buttons => {
        const searchButton = Array.from($buttons).find(el => 
          el.innerText.toLowerCase().includes('search'));
        
        if (searchButton) {
          cy.wrap(searchButton).click();
        } else {
          // If we can't find the button, try direct navigation
          cy.visit('/Search');
        }
      });
      
      // Wait for page to load
      cy.wait(2000);
    });
  
    it('should be on a page with search functionality', () => {
      // Debug: Log the current URL
      cy.url().then(url => {
        cy.log(`Current URL on search page: ${url}`);
      });
      
      // Debug: Log the page content
      cy.get('body').invoke('text').then(text => {
        cy.log(`Page content: ${text.substring(0, 200)}...`);
      });
      
      // Check for input fields (which should exist on the search page)
      cy.get('input').should('exist');
      
      // Look for any button that might be the clear button
      cy.get('button').then($buttons => {
        const buttonTexts = Array.from($buttons).map(el => el.innerText);
        cy.log(`Available buttons on search page: ${buttonTexts.join(', ')}`);
      });
    });
  
    it('should be able to type in search fields', () => {
      // Get all input fields
      cy.get('input').then($inputs => {
        // Type in the first input field
        if ($inputs.length > 0) {
          cy.wrap($inputs[0]).clear().type('JavaScript');
        }
        
        // Type in the second input field if it exists
        if ($inputs.length > 1) {
          cy.wrap($inputs[1]).clear().type('Evening');
        }
      });
      
      // Verify we can type in the fields
      cy.get('input').first().should('have.value', 'JavaScript');
    });
    
    it('should display search results when query is submitted', () => {
      // Type search query
      cy.get('input').first().clear().type('JavaScript');
      
      // Look for any button with MUI classes that might be the search button
      cy.get('button.MuiButtonBase-root.MuiButton-root').first().click();
      
      // Alternatively, press Enter key which often triggers search
      cy.get('input').first().type('{enter}');
      
      // Wait for results to load
      cy.wait(1000);
      
      // Verify some content exists after search
      cy.get('body').should('contain.text', 'JavaScript');
    });
    
  });
  