package com.pgmanager.auth.service;

import com.pgmanager.auth.entity.StaffUser;
import com.pgmanager.auth.repository.StaffUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StaffService {

    private final StaffUserRepository staffUserRepository;

    public StaffUser createStaff(StaffUser staff) {
        if (staffUserRepository.findByEmail(staff.getEmail()).isPresent()) {
            throw new RuntimeException("Email already exists for a staff member");
        }
        return staffUserRepository.save(staff);
    }

    public List<StaffUser> getStaffByOwner(Long ownerId) {
        return staffUserRepository.findByOwnerId(ownerId);
    }

    public List<StaffUser> getStaffByTenant(UUID tenantId) {
        return staffUserRepository.findByTenantId(tenantId);
    }

    public void deleteStaff(UUID id) {
        staffUserRepository.deleteById(id);
    }

    public StaffUser updateStatus(UUID id, boolean active) {
        StaffUser staff = staffUserRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Staff not found"));
        staff.setActive(active);
        return staffUserRepository.save(staff);
    }
}
