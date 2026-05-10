package com.pgmanager.api.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.Filter;
import com.pgmanager.api.common.constant.TenantConstants;

@Entity
@Table(name = "pg_settings")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@Filter(name = TenantConstants.TENANT_FILTER_NAME, condition = TenantConstants.TENANT_COLUMN_NAME + " = :" + TenantConstants.TENANT_PARAMETER_NAME)
public class PgSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long ownerId;

    private String pgName;
    private String ownerName;
    private String phone;
    private String address;
    private String upiId;

    @Builder.Default
    private boolean whatsappReminders = true;
    @Builder.Default
    private boolean emailNotifications = true;
    @Builder.Default
    private boolean overdueAlerts = true;
    @Builder.Default
    private boolean maintenanceAlerts = false;
    @Builder.Default
    private boolean monthlyReportEmail = false;

    @Builder.Default
    private int defaultRentDueDay = 1;
    @Builder.Default
    private int lateFeeAfterDays = 5;
    @Builder.Default
    private double lateFeeAmount = 50.0;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getPgName() { return pgName; }
    public void setPgName(String pgName) { this.pgName = pgName; }
    public String getOwnerName() { return ownerName; }
    public void setOwnerName(String ownerName) { this.ownerName = ownerName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public boolean isWhatsappReminders() { return whatsappReminders; }
    public void setWhatsappReminders(boolean whatsappReminders) { this.whatsappReminders = whatsappReminders; }
    public boolean isEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(boolean emailNotifications) { this.emailNotifications = emailNotifications; }
    public boolean isOverdueAlerts() { return overdueAlerts; }
    public void setOverdueAlerts(boolean overdueAlerts) { this.overdueAlerts = overdueAlerts; }
    public boolean isMaintenanceAlerts() { return maintenanceAlerts; }
    public void setMaintenanceAlerts(boolean maintenanceAlerts) { this.maintenanceAlerts = maintenanceAlerts; }
    public boolean isMonthlyReportEmail() { return monthlyReportEmail; }
    public void setMonthlyReportEmail(boolean monthlyReportEmail) { this.monthlyReportEmail = monthlyReportEmail; }
    public int getDefaultRentDueDay() { return defaultRentDueDay; }
    public void setDefaultRentDueDay(int defaultRentDueDay) { this.defaultRentDueDay = defaultRentDueDay; }
    public int getLateFeeAfterDays() { return lateFeeAfterDays; }
    public void setLateFeeAfterDays(int lateFeeAfterDays) { this.lateFeeAfterDays = lateFeeAfterDays; }
    public double getLateFeeAmount() { return lateFeeAmount; }
    public void setLateFeeAmount(double lateFeeAmount) { this.lateFeeAmount = lateFeeAmount; }
}




