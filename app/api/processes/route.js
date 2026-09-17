import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { isAuthed } from '@/lib/auth';

export async function GET() {
  try {
    const rows = await sql`SELECT * FROM processes1 ORDER BY style ASC, process_name ASC`;
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: '未登录，无权操作' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const { process_name, style, specification, description, work_seconds, is_tested } = body;
    if (!process_name || !style || !work_seconds || work_seconds <= 0) {
      return NextResponse.json({ error: '请填写所有必填字段，且工时必须大于0秒' }, { status: 400 });
    }
    const existing = await sql`SELECT id FROM processes1 WHERE process_name = ${process_name}`;
    if (existing.length > 0) {
      return NextResponse.json({ error: '工艺名称已存在' }, { status: 400 });
    }
    const result = await sql`
      INSERT INTO processes1 (process_name, style, specification, description, work_seconds, is_tested)
      VALUES (${process_name}, ${style}, ${specification || ''}, ${description || ''}, ${work_seconds}, ${!!is_tested})
      RETURNING *
    `;
    return NextResponse.json(result[0], { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
