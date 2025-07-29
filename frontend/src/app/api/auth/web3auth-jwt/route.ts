// app/api/auth/web3auth-jwt/route.ts
import jwt from 'jsonwebtoken'
import { createServerSupabaseClient } from '../../../../lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('API Route received:', Object.keys(body))
    
    const { userInfo } = body

    if (!userInfo) {
      console.error('Missing userInfo in request body:', body)
      return NextResponse.json(
        { error: 'Missing userInfo' },
        { status: 400 }
      )
    }

    console.log('Creating JWT for user:', userInfo.email || userInfo.name)
    console.log('User info received:', {
      email: userInfo.email,
      name: userInfo.name,
      sub: userInfo.sub,
      verifierId: userInfo.verifierId
    })

    // Create Supabase admin client
    const supabaseAdmin = createServerSupabaseClient()

    // Use email or create one from sub/verifierId
    const userEmail = userInfo.email || `${userInfo.sub || userInfo.verifierId}@web3auth.io`
    const userId = userInfo.sub || userInfo.verifierId

    console.log('Using email:', userEmail, 'and ID:', userId)

    // Create or update user in Supabase
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: userEmail,
      user_metadata: {
        name: userInfo.name,
        picture: userInfo.profileImage,
        web3auth_sub: userId,
        provider: userInfo.typeOfLogin,
        original_user_info: userInfo
      },
      email_confirm: true, // Auto-confirm email
    })

    if (userError && !userError.message.includes('already been registered')) {
      console.error('Supabase user creation error:', userError)
      return NextResponse.json(
        { error: 'Failed to create user: ' + userError.message },
        { status: 500 }
      )
    }

    // If user already exists, get their data
    let supabaseUserId = user?.user?.id
    if (!supabaseUserId) {
      // Try to find user by email or web3auth_sub
      const { data: userList } = await supabaseAdmin.auth.admin.listUsers()
      const foundUser = userList.users.find(u => 
        u.email === userEmail || 
        u.user_metadata?.web3auth_sub === userId
      )
      supabaseUserId = foundUser?.id
    }

    if (!supabaseUserId) {
      return NextResponse.json(
        { error: 'Could not create or find user' },
        { status: 500 }
      )
    }

    // Create custom JWT for Supabase
    const payload = {
      sub: supabaseUserId,
      email: userEmail,
      user_metadata: {
        name: userInfo.name,
        picture: userInfo.profileImage,
        web3auth_sub: userId,
        provider: userInfo.typeOfLogin,
      },
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24), // 24 hours
    }

    const jwtSecret = process.env.SUPABASE_JWT_SECRET
    if (!jwtSecret) {
      return NextResponse.json(
        { error: 'Missing JWT secret' },
        { status: 500 }
      )
    }

    const supabaseJwt = jwt.sign(payload, jwtSecret)

    console.log('JWT created successfully for user:', supabaseUserId)

    return NextResponse.json({ supabaseJwt })

  } catch (error) {
    console.error('JWT creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}