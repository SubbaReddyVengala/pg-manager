describe('Full E2E with Real Auth', () => {
  const ts = Date.now();
  const roomNum = 'R-' + ts;

  beforeEach(() => {
    Cypress.on('uncaught:exception', (err, runnable) => {
      // Returning false here prevents Cypress from failing the test
      if (err.message.includes('NG0103')) {
        return false;
      }
      return true;
    });
  });

  it('should login, add a room, and delete it', () => {
    // 1. Login via API to get real token
    cy.request({
      method: 'POST',
      url: 'http://localhost:8080/api/v1/auth/login',
      body: {
        email: 'admin@pgmanager.com',
        password: 'admin1234'
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      const authData = response.body;

      // 2. Visit dashboard with the real token
      cy.visit('/dashboard/rooms', {
        onBeforeLoad: (win) => {
          win.localStorage.setItem('pg_auth', JSON.stringify(authData));
        }
      });

      // 3. Verify page loaded
      cy.get('.add-room-btn').should('exist');

      // 4. Add Room
      cy.get('.add-room-btn').click();
      cy.get('input[formControlName="roomNumber"]').type(roomNum);
      cy.get('input[formControlName="floor"]').clear().type('1');
      cy.get('input[formControlName="rentAmount"]').type('5000');
      cy.get('.btn-submit').click();

      // 5. Verify room in table
      cy.get('table').contains('td', roomNum).should('exist');

      // 6. Delete Room
      cy.contains('tr', roomNum).find('.icon-btn.delete').click();
      cy.get('table').contains('td', roomNum).should('not.exist');
    });
  });
});
