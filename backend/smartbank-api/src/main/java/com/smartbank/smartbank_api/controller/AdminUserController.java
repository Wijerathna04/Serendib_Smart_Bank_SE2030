package com.smartbank.smartbank_api.controller;
import com.smartbank.smartbank_api.service.*;
import com.smartbank.smartbank_api.dto.BankRequests.*;
import com.smartbank.smartbank_api.dto.BankResponses.*;
import lombok.RequiredArgsConstructor;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/admin/users") @RequiredArgsConstructor
public class AdminUserController {
private final UserService service;
@GetMapping public PageResult<UserView> list(@RequestParam(required=false) String search,@RequestParam(required=false) String status,@RequestParam(defaultValue="0") int page,@RequestParam(defaultValue="20") int size) {return service.users(search,status,page,size);}
@GetMapping("/{id}") public UserView get(@PathVariable Integer id) {return service.user(id);}
@PostMapping("/staff") public UserView create(@Valid @RequestBody Staff r) {return service.createStaff(r);}
@PatchMapping("/{id}/status") public UserView status(@PathVariable Integer id,@Valid @RequestBody Status r) {return service.status(id,r.status());}
@PatchMapping("/{id}/role") public UserView role(@PathVariable Integer id,@Valid @RequestBody RoleChange r) {return service.changeRole(id,r.role());}
}
