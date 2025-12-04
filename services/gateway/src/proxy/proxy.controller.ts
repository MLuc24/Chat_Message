import {
  All,
  Controller,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { AuthGuard } from '../guards/auth.guard';

@Controller()
export class ProxyController {
  private authProxy = createProxyMiddleware({
    target: process.env.AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/auth': '',
    },
    timeout: 30000,
    proxyTimeout: 30000,
    onError: (err, req, res) => {
      console.error('Auth Service Proxy Error:', err.message);
      res.status(502).json({
        error: 'Bad Gateway',
        message: 'Auth service is unavailable',
      });
    },
  });

  private userProxy = createProxyMiddleware({
    target: process.env.USER_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/users': '',
    },
    timeout: 30000,
    proxyTimeout: 30000,
    onError: (err, req, res) => {
      console.error('User Service Proxy Error:', err.message);
      res.status(502).json({
        error: 'Bad Gateway',
        message: 'User service is unavailable',
      });
    },
  });

  private chatProxy = createProxyMiddleware({
    target: process.env.CHAT_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: {
      '^/api/chat': '',
    },
    timeout: 30000,
    proxyTimeout: 30000,
    onError: (err, req, res) => {
      console.error('Chat Service Proxy Error:', err.message);
      res.status(502).json({
        error: 'Bad Gateway',
        message: 'Chat service is unavailable',
      });
    },
  });

  private realtimeProxy = createProxyMiddleware({
    target: process.env.REALTIME_SERVICE_URL,
    changeOrigin: true,
    ws: true, // Enable WebSocket
    pathRewrite: {
      '^/ws': '',
    },
    onError: (err, req, res) => {
      console.error('Realtime Service Proxy Error:', err.message);
      res.status(502).json({
        error: 'Bad Gateway',
        message: 'Realtime service is unavailable',
      });
    },
  });

  // Auth routes (public)
  @All('auth/*')
  proxyAuth(@Req() req: Request, @Res() res: Response) {
    this.authProxy(req, res, () => {});
  }

  // User routes (protected)
  @All('users/*')
  @UseGuards(AuthGuard)
  proxyUser(@Req() req: Request, @Res() res: Response) {
    this.userProxy(req, res, () => {});
  }

  // Chat routes (protected)
  @All('chat/*')
  @UseGuards(AuthGuard)
  proxyChat(@Req() req: Request, @Res() res: Response) {
    this.chatProxy(req, res, () => {});
  }

  // WebSocket route (protected via socket handshake)
  @All('ws')
  proxyWebSocket(@Req() req: Request, @Res() res: Response) {
    this.realtimeProxy(req, res, () => {});
  }
}
