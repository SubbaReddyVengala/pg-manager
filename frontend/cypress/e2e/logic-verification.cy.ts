describe('PG Manager - Advanced Business Logic E2E', () => {
  const testId = Date.now();
  const sharedRoom = `SR-${testId}`;
  
  const authData = {
    accessToken: 'dummy-token', refreshToken: 'dummy-refresh', tokenType: 'Bearer',
    userId: 1, email: 'test@gmail.com', fullName: 'Test Owner', role: 'OWNER'
  };

  beforeEach(() => {
    cy.visit('/dashboard/rooms', {
      onBeforeLoad: (win) => { win.localStorage.setItem('pg_auth', JSON.stringify(authData)); }
    });
  });

  it('Logic Test: Room Capacity & Deletion Lifecycle', () => {
    // 1. Create a room with capacity 2
    cy.get('.add-room-btn').click();
    cy.get('input[formControlName="roomNumber"]').type(sharedRoom);
    cy.get('input[formControlName="maxCapacity"]').clear().type('2');
    cy.get('input[formControlName="rentAmount"]').type('5000');
    cy.get('.btn-submit').click();
    cy.contains(sharedRoom).parent('tr').within(() => {
      cy.get('.status-badge').should('contain', 'AVAILABLE');
      cy.contains('0/2').should('exist');
    });

    // 2. Assign 1st Tenant -> Room should still be AVAILABLE (1/2)
    cy.visit('/dashboard/tenants');
    cy.get('.add-btn').click();
    cy.get('input[formControlName="fullName"]').type(`T1-${testId}`);
    cy.get('input[formControlName="phone"]').type('1111111111');
    cy.get('input[formControlName="email"]').type(`t1-${testId}@test.com`);
    cy.get('select[formControlName="roomId"]').select(`Room ${sharedRoom}`);
    cy.get('input[formControlName="monthlyRent"]').type('5000');
    cy.get('input[formControlName="securityDeposit"]').type('10000');
    cy.get('.btn-submit').click();

    cy.visit('/dashboard/rooms');
    cy.contains(sharedRoom).parent('tr').within(() => {
      cy.get('.status-badge').should('contain', 'AVAILABLE'); // Rule: Not full yet
      cy.contains('1/2').should('exist');
      // Rule: Should NOT be deletable because occupancy > 0
      cy.get('.icon-btn.delete').should('have.class', 'disabled');
    });

    // 3. Assign 2nd Tenant -> Room should turn OCCUPIED (2/2)
    cy.visit('/dashboard/tenants');
    cy.get('.add-btn').click();
    cy.get('input[formControlName="fullName"]').type(`T2-${testId}`);
    cy.get('input[formControlName="phone"]').type('2222222222');
    cy.get('input[formControlName="email"]').type(`t2-${testId}@test.com`);
    cy.get('select[formControlName="roomId"]').select(`Room ${sharedRoom}`);
    cy.get('input[formControlName="monthlyRent"]').type('5000');
    cy.get('input[formControlName="securityDeposit"]').type('10000');
    cy.get('.btn-submit').click();

    cy.visit('/dashboard/rooms');
    cy.contains(sharedRoom).parent('tr').within(() => {
      cy.get('.status-badge').should('contain', 'OCCUPIED'); // Rule: Capacity reached
      cy.contains('2/2').should('exist');
      cy.get('.icon-btn.delete').should('have.class', 'disabled');
    });
  });

  it('Logic Test: Payment & Overdue Synchronization', () => {
    // This requires a tenant to already exist or be created
    const tName = `Finance-Tenant-${testId}`;
    cy.visit('/dashboard/tenants');
    cy.get('.add-btn').click();
    cy.get('input[formControlName="fullName"]').type(tName);
    cy.get('input[formControlName="phone"]').type('3333333333');
    cy.get('input[formControlName="email"]').type(`f1-${testId}@test.com`);
    cy.get('input[formControlName="monthlyRent"]').type('1000');
    cy.get('input[formControlName="securityDeposit"]').type('1000');
    cy.get('.btn-submit').click();

    // 1. Record Partial Payment (₹400 of ₹1000)
    cy.visit('/dashboard/payments');
    cy.get('.record-btn').click();
    cy.get('select[formControlName="tenantId"]').select(`${tName} — Room —`);
    cy.get('input[formControlName="amountPaid"]').clear().type('400');
    cy.get('.btn-submit').click();

    // Verify status is PARTIAL and balance is ₹600
    cy.contains('tr', tName).within(() => {
      cy.get('.status-badge').should('contain', 'PARTIAL');
      cy.get('.status-badge').should('contain', '₹600');
    });

    // 2. Try to Overpay (₹700 more, total 1100) -> Should show error or be blocked
    cy.contains('tr', tName).find('.balance-btn').click();
    cy.get('input[formControlName="amountPaid"]').clear().type('700');
    cy.get('.btn-submit').click();
    // Verify drawer still open or error toast shown (assuming backend throws error)
    cy.get('.drawer').should('exist');
  });
});
