package com.popquiz.config;

import com.popquiz.service.JwtService;
import com.popquiz.service.UserDetailsServiceImpl;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private final JwtService jwtService;
    private final UserDetailsServiceImpl userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsServiceImpl userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String username;
        logger.info("[JWT过滤器] 处理请求路径: {}", request.getRequestURI());
        logger.info("[JWT过滤器] Authorization header: {}", authHeader);
        // 检查Authorization头部
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            logger.warn("[JWT过滤器] 没有Bearer token，继续过滤器链");
            filterChain.doFilter(request, response);
            return;
        }
        // 提取JWT token
        jwt = authHeader.substring(7);
        logger.info("[JWT过滤器] 提取到token前20位: {}", jwt.substring(0, Math.min(20, jwt.length())));
        try {
            // 从token中提取用户名
            username = jwtService.extractUsername(jwt);
            logger.info("[JWT过滤器] 提取到用户名: {}", username);
            // 如果用户名存在且当前没有认证信息
            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                // 加载用户详情
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);
                logger.info("[JWT过滤器] 加载用户详情: {}", userDetails.getUsername());
                // 验证token
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    logger.info("[JWT过滤器] token验证成功");
                    // 创建认证token
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );
                    authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                } else {
                    logger.warn("[JWT过滤器] token验证失败");
                }
            } else {
                logger.warn("[JWT过滤器] 用户名为空或已认证: {}", username);
            }
        } catch (Exception e) {
            logger.error("[JWT过滤器] 解析或认证token异常: {}", e.getMessage(), e);
        }
        filterChain.doFilter(request, response);
    }
} 