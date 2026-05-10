package com.pgmanager.api.notification.service;

public interface EmailSender {
    void send(String to, String subject, String body);
}




