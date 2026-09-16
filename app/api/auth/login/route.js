import { NextResponse } from 'next/server';
import { generateToken, getCookieName, getExpiresSeconds } from '@/lib/auth';

export async function POST(request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json({ error: '服务器未配置管理员密码' }, { status: 500 });
    }
    if (!password || password !== adminPassword) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 });
    }

    const token = generateToken();
    const response = NextResponse.json({ success: true });
    response.cookies.set(getCookieName(), token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: getExpiresSeconds(),
      path: '/',
    });
    return response;
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
