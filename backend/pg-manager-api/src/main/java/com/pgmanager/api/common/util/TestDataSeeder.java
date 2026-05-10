package com.pgmanager.api.common.util;

import com.pgmanager.api.auth.entity.*;
import com.pgmanager.common.enums.*;
import com.pgmanager.api.auth.repository.*;
import com.pgmanager.api.room.entity.Room;
import com.pgmanager.common.enums.*;
import com.pgmanager.api.room.repository.RoomRepository;
import com.pgmanager.api.tenant.entity.Tenant;
import com.pgmanager.common.enums.*;
import com.pgmanager.api.tenant.repository.TenantRepository;
import com.pgmanager.api.payment.entity.RentPayment;
import com.pgmanager.common.enums.PaymentStatus;
import com.pgmanager.api.payment.repository.PaymentRepository;
import com.pgmanager.api.maintenance.entity.*;
import com.pgmanager.common.enums.*;
import com.pgmanager.api.maintenance.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
public class TestDataSeeder {

    private final UserRepository userRepository;
    private final OwnerProfileRepository ownerProfileRepository;
    private final RoomRepository roomRepository;
    private final TenantRepository tenantRepository;
    private final PaymentRepository paymentRepository;
    private final MaintenanceTicketRepository ticketRepository;
    private final GeneralExpenseRepository expenseRepository;
    private final PasswordEncoder passwordEncoder;

    // @Bean
    // @Profile("dev")
    public CommandLineRunner seedData() {
        return args -> {
            if (userRepository.count() > 1) return; // Only seed if empty

            // 1. Create a Premium PG Owner
            User owner = User.builder()
                    .email("owner@test.com")
                    .fullName("Premium PG Owner")
                    .passwordHash(passwordEncoder.encode("owner123"))
                    .role(Role.OWNER)
                    .active(true)
                    .build();
            owner = userRepository.save(owner);
            owner.setOwnerId(owner.getId());
            userRepository.save(owner);

            OwnerProfile profile = OwnerProfile.builder()
                    .userId(owner.getId())
                    .maxRooms(50)
                    .maxTenants(100)
                    .dashboardEnabled(true)
                    .paymentsEnabled(true)
                    .reportsEnabled(true)
                    .maintenanceEnabled(true)
                    .build();
            ownerProfileRepository.save(profile);

            // 2. Seed Rooms (Minute Detail: Exact capacity boundaries)
            Room r1 = Room.builder().ownerId(owner.getId()).roomNumber("101").floor(1).roomType(RoomType.SINGLE).maxCapacity(1).rentAmount(new BigDecimal("8000")).status(RoomStatus.AVAILABLE).build();
            Room r2 = Room.builder().ownerId(owner.getId()).roomNumber("201").floor(2).roomType(RoomType.DOUBLE).maxCapacity(2).rentAmount(new BigDecimal("5000")).status(RoomStatus.AVAILABLE).build();
            r1 = roomRepository.save(r1);
            r2 = roomRepository.save(r2);

            // 3. Seed Tenants (Minute Detail: 10-digit phone, various statuses)
            Tenant t1 = Tenant.builder()
                    .ownerId(owner.getId())
                    .fullName("John Doe")
                    .email("john@test.com")
                    .phone("9876543210") // Exactly 10 digits
                    .roomId(r1.getId())
                    .roomNumber("101")
                    .monthlyRent(new BigDecimal("8000"))
                    .status(TenantStatus.ACTIVE)
                    .moveInDate(LocalDate.now().minusMonths(2))
                    .rentDueDay(5)
                    .build();
            t1 = tenantRepository.save(t1);
            
            r1.setOccupancy(1);
            r1.setStatus(RoomStatus.OCCUPIED);
            roomRepository.save(r1);

            // 4. Seed Payments (Past and Overdue)
            RentPayment p1 = RentPayment.builder()
                    .ownerId(owner.getId())
                    .tenantId(t1.getId())
                    .tenantName(t1.getFullName())
                    .roomId(t1.getRoomId())
                    .roomNumber(t1.getRoomNumber())
                    .rentMonth(LocalDate.now().minusMonths(1).withDayOfMonth(1))
                    .rentAmount(new BigDecimal("8000"))
                    .amountPaid(new BigDecimal("8000"))
                    .balance(BigDecimal.ZERO)
                    .status(PaymentStatus.PAID)
                    .paymentDate(LocalDate.now().minusMonths(1))
                    .build();
            paymentRepository.save(p1);

            // 5. Seed Maintenance (Minute Detail: Resolution costs)
            MaintenanceTicket ticket = MaintenanceTicket.builder()
                    .ownerId(owner.getId())
                    .roomId(r1.getId())
                    .roomNumber("101")
                    .description("Leaking tap in bathroom")
                    .priority(MaintenancePriority.MEDIUM)
                    .status(MaintenanceStatus.RESOLVED)
                    .cost(new BigDecimal("250.00"))
                    .reportedAt(LocalDateTime.now().minusDays(10))
                    .resolvedAt(LocalDateTime.now().minusDays(5))
                    .build();
            ticketRepository.save(ticket);

            System.out.println(">>> [SEEDER] Comprehensive Test Data Seeded Successfully.");
        };
    }
}




