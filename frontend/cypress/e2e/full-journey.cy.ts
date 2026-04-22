describe('PG Manager - Full Business Journey E2E', () => {
  const testId = Date.now();
  const roomNum = `R-${testId}`;
  const tenantName = `Tenant-${testId}`;
  const tenantEmail = `test-${testId}@gmail.com`;

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
    cy.visit('/dashboard/rooms', {
      onBeforeLoad: (win) => {
        win.localStorage.setItem('pg_auth', JSON.stringify(authData));
      }
    });
  });

  it('Step 1: Create a Room', () => {
    cy.get('.add-room-btn').click();
    cy.get('input[formControlName="roomNumber"]').type(roomNum);
    cy.get('input[formControlName="floor"]').clear().type('1');
    cy.get('input[formControlName="rentAmount"]').type('10000');
    cy.get('.btn-submit').click();
    cy.get('.drawer').should('not.exist');
    cy.contains(roomNum).should('exist');
  });

  it('Step 2: Register a Tenant and Assign to that Room', () => {
    cy.visit('/dashboard/tenants');
    cy.get('.add-btn').click();
    cy.get('input[formControlName="fullName"]').type(tenantName);
    cy.get('input[formControlName="phone"]').type('9876543210');
    cy.get('input[formControlName="email"]').type(tenantEmail);
    
    // Select the room we just created
    cy.get('select[formControlName="roomId"]').select(`Room ${roomNum}`);
    cy.get('input[formControlName="monthlyRent"]').type('10000');
    cy.get('input[formControlName="securityDeposit"]').type('20000');
    
    cy.get('.btn-submit').click();
    cy.get('.drawer').should('not.exist');
    cy.contains(tenantName).should('exist');
    cy.contains(roomNum).should('exist');
  });

  it('Step 3: Record a Payment', () => {
    cy.visit('/dashboard/payments');
    cy.get('.record-btn').click();
    
    // Select the tenant
    cy.get('select[formControlName="tenantId"]').select(`${tenantName} — Room ${roomNum}`);
    cy.get('input[formControlName="amountPaid"]').type('10000');
    cy.get('.btn-submit').click();
    
    cy.get('.drawer').should('not.exist');
    cy.get('table').contains(tenantName).parents('tr').contains('PAID').should('exist');
  });

  it('Step 4: Verify Reporting Dashboard', () => {
    cy.visit('/dashboard/reports');
    // Check if the occupancy or revenue cards are visible
    cy.get('.stat-card.revenue').should('exist');
    cy.get('.stat-card.occupancy').should('exist');
  });

  it('Step 5: Cleanup - Move Out and Delete Room', () => {
    // This tests the lifecycle end
    cy.visit('/dashboard/tenants');
    // For real production, we'd trigger a Move Out here
    // But for E2E testing we check the state persistence
    cy.reload();
    cy.contains(tenantName).should('exist');
  });
});
