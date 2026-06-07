import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
  ) {}

  async login(dto: LoginDto) {
    const openid = await this.resolveOpenid(dto.code);
    const user = await this.prisma.user.upsert({
      where: { openid },
      update: {
        nickname: dto.nickname,
        avatar: dto.avatar
      },
      create: {
        openid,
        nickname: dto.nickname,
        avatar: dto.avatar
      }
    });

    const token = this.jwt.sign({ sub: user.id.toString(), openid: user.openid });
    return {
      token,
      userInfo: {
        id: Number(user.id),
        openid: user.openid,
        nickname: user.nickname,
        avatar: user.avatar,
        phone: user.phone
      }
    };
  }

  private async resolveOpenid(code: string) {
    if (process.env.NODE_ENV !== 'production') {
      return `dev-${code}`;
    }

    const { data } = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WECHAT_APP_ID,
        secret: process.env.WECHAT_APP_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    if (!data.openid) {
      throw new Error(data.errmsg || '微信登录失败');
    }
    return data.openid as string;
  }
}
