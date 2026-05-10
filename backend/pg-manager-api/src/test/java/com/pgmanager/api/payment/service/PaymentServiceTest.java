package com.pgmanager.api.payment.service;

import com.pgmanager.common.util.SecurityUtils;
import com.pgmanager.api.payment.client.NotificationServiceClient;
import com.pgmanager.api.payment.client.TenantServiceClient;
import com.pgmanager.api.payment.dto.PaymentRequest;
import com.pgmanager.api.payment.dto.PaymentResponse;
import com.pgmanager.api.payment.entity.RentPayment;
import com.pgmanager.common.enums.PaymentMode;
import com.pgmanager.common.enums.PaymentStatus;
import com.pgmanager.api.payment.repository.PaymentRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentServiceTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private TenantServiceClient tenantClient;
    @Mock private NotificationServiceClient notificationClient;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private MockedStatic<SecurityUtils> securityUtils;
    private Long ownerId = 1L;

    @BeforeEach
    void setUp() {
        securityUtils = mockStatic(SecurityUtils.class);
        securityUtils.when(SecurityUtils::getCurrentOwnerId).thenReturn(ownerId);
    }

    @AfterEach
    void tearDown() {
        securityUtils.close();
    }

    @Test
    void recordPayment_FullPayment_Success() {
        // Given
        LocalDate rentMonth = LocalDate.now().withDayOfMonth(1);
        PaymentRequest request = PaymentRequest.builder()
                .tenantId(101L)
                .rentMonth(rentMonth)
                .amountPaid(new BigDecimal("5000"))
                .paymentMode(PaymentMode.UPI)
                .paymentDate(LocalDate.now())
                .build();

        RentPayment existingDue = RentPayment.builder()
                .id(1L)
                .ownerId(ownerId)
                .tenantId(101L)
                .rentMonth(rentMonth)
                .rentAmount(new BigDecimal("5000"))
                .amountPaid(BigDecimal.ZERO)
                .status(PaymentStatus.PENDING)
                .build();

        when(paymentRepository.findByOwnerIdAndTenantIdAndRentMonth(ownerId, 101L, rentMonth))
                .thenReturn(Optional.of(existingDue));
        when(paymentRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);
        
        TenantServiceClient.TenantInfo tenantInfo = new TenantServiceClient.TenantInfo();
        tenantInfo.setId(101L);
        tenantInfo.setFullName("Ravi Kumar");
        tenantInfo.setEmail("ravi@example.com");
        when(tenantClient.getTenant(101L)).thenReturn(tenantInfo);

        // When
        PaymentResponse response = paymentService.recordPayment(request);

        // Then
        assertNotNull(response);
        assertEquals(PaymentStatus.PAID, response.getStatus());
        assertEquals(BigDecimal.ZERO, response.getBalance());
        verify(notificationClient).send(any());
    }

    @Test
    void recordPayment_PartialPayment_Success() {
        // Given
        LocalDate rentMonth = LocalDate.now().withDayOfMonth(1);
        PaymentRequest request = PaymentRequest.builder()
                .tenantId(101L)
                .rentMonth(rentMonth)
                .amountPaid(new BigDecimal("2000"))
                .paymentMode(PaymentMode.CASH)
                .build();

        RentPayment existingDue = RentPayment.builder()
                .id(1L)
                .ownerId(ownerId)
                .tenantId(101L)
                .rentMonth(rentMonth)
                .rentAmount(new BigDecimal("5000"))
                .amountPaid(BigDecimal.ZERO)
                .status(PaymentStatus.PENDING)
                .build();

        when(paymentRepository.findByOwnerIdAndTenantIdAndRentMonth(ownerId, 101L, rentMonth))
                .thenReturn(Optional.of(existingDue));
        when(paymentRepository.save(any())).thenAnswer(i -> i.getArguments()[0]);

        // When
        PaymentResponse response = paymentService.recordPayment(request);

        // Then
        assertNotNull(response);
        assertEquals(PaymentStatus.PARTIAL, response.getStatus());
        assertEquals(new BigDecimal("3000"), response.getBalance());
    }
}
