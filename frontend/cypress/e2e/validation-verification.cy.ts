describe('PG Manager - Minute Validation Verification E2E', () => {
  
  const authData = {
    accessToken: 'dummy-token', refreshToken: 'dummy-refresh', tokenType: 'Bearer',
    userId: 1, email: 'test@gmail.com', fullName: 'Test Owner', role: 'OWNER'
  };

  beforeEach(() => {
    cy.visit('/dashboard/tenants', {
      onBeforeLoad: (win) => { win.localStorage.setItem('pg_auth', JSON.stringify(authData)); }
    });
  });

  it('Validation: Tenant Form Minute Details', () => {
    cy.get('.add-btn').click();

    // 1. Test Phone Number (9 digits should fail)
    cy.get('input[formControlName="phone"]').type('123456789').blur();
    cy.contains('10 digits required').should('be.visible');

    // 2. Test Phone Number (11 digits should fail - by pattern)
    cy.get('input[formControlName="phone"]').clear().type('12345678901').blur();
    cy.contains('10 digits required').should('be.visible');

    // 3. Test Full Name (Numbers should fail)
    cy.get('input[formControlName="fullName"]').type('Ravi 123').blur();
    cy.contains('Letters and spaces only').should('be.visible');

    // 4. Test Email (Invalid format)
    cy.get('input[formControlName="email"]').type('not-an-email').blur();
    cy.contains('Enter valid email').should('be.visible');

    // 5. Test Negative Rent
    cy.get('input[formControlName="monthlyRent"]').type('-500').blur();
    cy.contains('Min 0').should('be.visible');
  });

  it('Validation: Room Form Minute Details', () => {
    cy.visit('/dashboard/rooms');
    cy.get('.add-room-btn').click();

    // 1. Test Room Number (Special characters not allowed)
    cy.get('input[formControlName="roomNumber"]').type('Room#1').blur();
    cy.contains('Letters/Numbers/Hyphens only').should('be.visible');

    // 2. Test Floor (Too high)
    cy.get('input[formControlName="floor"]').type('101').blur();
    cy.contains('Max floor is 100').should('be.visible');

    // 3. Test Rent (Zero or Negative)
    cy.get('input[formControlName="rentAmount"]').type('0').blur();
    cy.contains('Must be greater than 0').should('be.visible');
  });
});
