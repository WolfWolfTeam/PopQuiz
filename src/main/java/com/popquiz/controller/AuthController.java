package com.popquiz.controller;

import com.popquiz.model.User;
import com.popquiz.model.Role;
import com.popquiz.repository.RoleRepository;
import com.popquiz.repository.UserRepository;
import com.popquiz.service.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    
    public AuthController(
            AuthenticationManager authenticationManager,
            UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        // 检查用户名和邮箱是否已存在
        if (userRepository.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "用户名已存在"));
        }
        
        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "邮箱已存在"));
        }
        
        // 获取角色 - 根据角色ID查找
        Role role;
        try {
            int roleId = Integer.parseInt(request.getRole());
            role = roleRepository.findById(roleId)
                    .orElseThrow(() -> new RuntimeException("角色不存在"));
        } catch (NumberFormatException e) {
            // 如果角色ID不是数字，尝试根据名称查找
            role = roleRepository.findByName(request.getRole())
                    .orElseThrow(() -> new RuntimeException("角色不存在"));
        }
        
        // 创建新用户
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setRoles(Collections.singleton(role));
        user.setNickname(request.getNickname());
        user.setEnabled(true);
        
        userRepository.save(user);
        
        return ResponseEntity.ok(Map.of("message", "用户注册成功"));
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // 认证
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        // 生成JWT
        org.springframework.security.core.userdetails.User userDetails = 
                (org.springframework.security.core.userdetails.User) authentication.getPrincipal();

        User user = userRepository.findByUsername(userDetails.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("用户不存在"));

        String jwt = jwtService.generateToken(userDetails);

        // 构建 user 对象
        Map<String, Object> userMap = new HashMap<>();
        userMap.put("userId", user.getId());
        userMap.put("username", user.getUsername());
        userMap.put("role", user.getRoles().stream().findFirst().map(Role::getName).orElse("UNKNOWN"));
        userMap.put("fullName", user.getFullName());
        userMap.put("nickname", user.getNickname());
        userMap.put("email", user.getEmail());

        // 构建响应
        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("user", userMap);

        return ResponseEntity.ok(response);
    }
    
    // 请求DTO类
    public static class RegisterRequest {
        private String username;
        private String password;
        private String email;
        private String fullName;
        private String role;
        private String nickname;
        
        // getter and setter
        
        public String getUsername() {
            return username;
        }
        
        public void setUsername(String username) {
            this.username = username;
        }
        
        public String getPassword() {
            return password;
        }
        
        public void setPassword(String password) {
            this.password = password;
        }
        
        public String getEmail() {
            return email;
        }
        
        public void setEmail(String email) {
            this.email = email;
        }
        
        public String getFullName() {
            return fullName;
        }
        
        public void setFullName(String fullName) {
            this.fullName = fullName;
        }
        
        public String getRole() {
            return role;
        }
        
        public void setRole(String role) {
            this.role = role;
        }
        
        public String getNickname() {
            return nickname;
        }
        
        public void setNickname(String nickname) {
            this.nickname = nickname;
        }
    }
    
    public static class LoginRequest {
        private String username;
        private String password;
        
        // getter and setter
        
        public String getUsername() {
            return username;
        }
        
        public void setUsername(String username) {
            this.username = username;
        }
        
        public String getPassword() {
            return password;
        }
        
        public void setPassword(String password) {
            this.password = password;
        }
    }
} 