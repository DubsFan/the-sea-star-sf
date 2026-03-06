import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/auth'

// super_admin: full access to all users
// admin: can view all, add/remove crew only
function canManageUsers(role: string) {
  return role === 'super_admin' || role === 'admin'
}

export async function GET(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session || !canManageUsers(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('admin_users')
    .select('id, username, role, display_name, created_at')
    .order('created_at')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session || !canManageUsers(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { username, password, display_name, role } = await request.json()
  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
  }

  const targetRole = role || 'crew'

  // Admin can only create crew accounts
  if (session.role === 'admin' && targetRole !== 'crew') {
    return NextResponse.json({ error: 'You can only create crew accounts' }, { status: 403 })
  }

  const password_hash = await bcrypt.hash(password, 10)
  const { data, error } = await supabase
    .from('admin_users')
    .insert({ username, password_hash, display_name: display_name || username, role: targetRole })
    .select('id, username, role, display_name, created_at')
    .single()

  if (error) {
    if (error.message.includes('duplicate')) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const session = await requireAdmin(request)
  if (!session || !canManageUsers(session.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await request.json()

  // Prevent deleting yourself
  const { data: target } = await supabase.from('admin_users').select('username, role').eq('id', id).single()
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (target.username === session.username) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }

  // Admin can only delete crew
  if (session.role === 'admin' && target.role !== 'crew') {
    return NextResponse.json({ error: 'You can only remove crew accounts' }, { status: 403 })
  }

  const { error } = await supabase.from('admin_users').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
