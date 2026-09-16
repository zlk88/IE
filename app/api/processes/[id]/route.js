import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id, 10);
    const rows = await sql`SELECT * FROM processes1 WHERE id = ${id}`;
    if (rows.length === 0) return NextResponse.json({ error: '工艺不存在' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id, 10);
    const body = await request.json();
    const { process_name, style, specification, description, work_seconds, is_tested } = body;
    if (!process_name || !style || !work_seconds || work_seconds <= 0) {
      return NextResponse.json({ error: '请填写所有必填字段，且工时必须大于0秒' }, { status: 400 });
    }
    const existing = await sql`SELECT id FROM processes1 WHERE process_name = ${process_name} AND id != ${id}`;
    if (existing.length > 0) return NextResponse.json({ error: '工艺名称已存在' }, { status: 400 });
    const result = await sql`
      UPDATE processes1
      SET process_name = ${process_name}, style = ${style},
          specification = ${specification || ''}, description = ${description || ''},
          work_seconds = ${work_seconds}, is_tested = ${!!is_tested}
      WHERE id = ${id} RETURNING *
    `;
    return NextResponse.json(result[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id, 10);
    await sql`DELETE FROM processes1 WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
