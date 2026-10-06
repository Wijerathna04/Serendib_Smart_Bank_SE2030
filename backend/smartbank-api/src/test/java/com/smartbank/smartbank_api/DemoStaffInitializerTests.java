package com.smartbank.smartbank_api;

import com.smartbank.smartbank_api.config.DemoStaffInitializer;
import com.smartbank.smartbank_api.entity.*;
import com.smartbank.smartbank_api.repository.*;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.time.Clock;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DemoStaffInitializerTests {
    @Test void createsBothRolesWithHashedPasswordsAndEmployeeProfiles(){
        var users=mock(UserRepository.class);var roles=mock(RoleRepository.class);var employees=mock(EmployeeRepository.class);
        var encoder=new BCryptPasswordEncoder();Role manager=new Role();manager.setRoleName("Manager");Role staff=new Role();staff.setRoleName("Employee");
        when(roles.findByRoleNameIgnoreCase("Manager")).thenReturn(Optional.of(manager));
        when(roles.findByRoleNameIgnoreCase("Employee")).thenReturn(Optional.of(staff));
        new DemoStaffInitializer(users,roles,employees,encoder,Clock.systemUTC()).run(null);
        var saved=ArgumentCaptor.forClass(User.class);verify(users,times(2)).save(saved.capture());
        var profiles=ArgumentCaptor.forClass(Employee.class);verify(employees,times(2)).save(profiles.capture());
        assertEquals("clb1020",saved.getAllValues().get(0).getUsername());assertSame(manager,saved.getAllValues().get(0).getRole());
        assertEquals("pf2030",saved.getAllValues().get(1).getUsername());assertSame(staff,saved.getAllValues().get(1).getRole());
        for(int i=0;i<2;i++){
            User user=saved.getAllValues().get(i);assertEquals("ACTIVE",user.getStatus());assertTrue(encoder.matches(user.getUsername(),user.getPasswordHash()));
            assertSame(user,profiles.getAllValues().get(i).getUser());assertNotNull(profiles.getAllValues().get(i).getDateJoined());
        }
    }
    @Test void preservesExistingUsers(){
        var users=mock(UserRepository.class);var roles=mock(RoleRepository.class);var employees=mock(EmployeeRepository.class);var encoder=mock(BCryptPasswordEncoder.class);
        when(users.findByUsername(anyString())).thenReturn(Optional.of(new User()));
        new DemoStaffInitializer(users,roles,employees,encoder,Clock.systemUTC()).run(null);
        verify(users,never()).save(any());verifyNoInteractions(roles,employees,encoder);
    }
}
