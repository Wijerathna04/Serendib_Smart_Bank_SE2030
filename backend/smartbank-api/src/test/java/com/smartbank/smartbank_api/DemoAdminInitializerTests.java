package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.config.DemoAdminInitializer;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.time.Clock;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DemoAdminInitializerTests {
    @Test void createsActiveAdministratorWithHashedPassword(){
        var users=mock(UserRepository.class);var roles=mock(RoleRepository.class);var encoder=new BCryptPasswordEncoder();
        Role admin=new Role();admin.setRoleName("Admin");
        when(users.findByUsername("admin")).thenReturn(Optional.empty());when(roles.findByRoleNameIgnoreCase("Admin")).thenReturn(Optional.of(admin));
        new DemoAdminInitializer(users,roles,encoder,Clock.systemUTC()).run(null);
        var saved=ArgumentCaptor.forClass(User.class);verify(users).save(saved.capture());
        User user=saved.getValue();assertEquals("admin",user.getUsername());assertSame(admin,user.getRole());assertEquals("ACTIVE",user.getStatus());assertNotEquals("admin",user.getPasswordHash());assertTrue(encoder.matches("admin",user.getPasswordHash()));
    }
    @Test void doesNotResetOrElevateAnExistingUser(){
        var users=mock(UserRepository.class);var roles=mock(RoleRepository.class);var encoder=mock(BCryptPasswordEncoder.class);
        when(users.findByUsername("admin")).thenReturn(Optional.of(new User()));
        new DemoAdminInitializer(users,roles,encoder,Clock.systemUTC()).run(null);
        verify(users,never()).save(any());verifyNoInteractions(roles,encoder);
    }
}
