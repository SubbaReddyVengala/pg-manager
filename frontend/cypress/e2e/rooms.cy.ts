describe('Room Management Flow', () => {
  const roomNum = 'ROOM-999';

  const authData = {
    accessToken: 'dummy-token',
    refreshToken: 'dummy-refresh',
    tokenType: 'Bearer',
    userId: 1,
    email: 'test@gmail.com',
    fullName: 'Test Owner',
    role: 'OWNER'
  };

  beforeEach(() => {
    // Inject auth token before loading the page
    cy.visit('/dashboard/rooms', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('pg_auth', JSON.stringify(authData));
      }
    });
    // Ensure we are on the page by checking for the "Add Room" button
    cy.get('.add-room-btn').should('exist');
  });

  it('1. should add a new room and verify it appears', () => {
    // If the room already exists from a previous failed run, delete it first
    cy.get('body').then(($body) => {
      const existing = $body.find('table:contains("' + roomNum + '")');
      if (existing.length > 0) {
        cy.contains('tr', roomNum).find('.icon-btn.delete').click();
      }
    });

    // Click "Add Room" button
    cy.get('.add-room-btn').click();
    
    // Fill the form
    cy.get('input[formControlName="roomNumber"]').type(roomNum);
    cy.get('input[formControlName="floor"]').clear().type('9');
    cy.get('input[formControlName="rentAmount"]').type('99000');
    
    // Save
    cy.get('.btn-submit').should('not.be.disabled').click();

    // Verify drawer closed and room appears in table
    cy.get('.drawer').should('not.exist');
    cy.get('table').contains('td', roomNum).should('exist');
  });

  it('2. should persist the room after a page refresh', () => {
    // Verify room is currently there
    cy.get('table').contains('td', roomNum).should('exist');
    
    // Refresh the browser
    cy.reload();
    
    // Re-verify the room exists (This tests the fix for the refresh visibility bug)
    cy.get('table').contains('td', roomNum).should('exist');
  });

  it('3. should delete the test room', () => {
    // Locate the row for our room and click delete
    cy.contains('tr', roomNum).find('.icon-btn.delete').click();
    
    // Cypress automatically accepts window.confirm dialogs
    
    // Verify room is removed from the table
    cy.get('table').contains('td', roomNum).should('not.exist');
  });
});
