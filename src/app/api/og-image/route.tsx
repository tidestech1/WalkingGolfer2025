import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title') || 'Walking Golfer'
    const type = searchParams.get('type') || 'default'
    const subtitle = searchParams.get('subtitle') || 'Find walkable golf courses across the USA'

    // You'll need to add fonts - this is a simplified version
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0A3357',
            color: 'white',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Background gradient */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, #0A3357 0%, #1e5a8a 100%)',
            }}
          />
          
          {/* Logo area - you'd replace with actual logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '40px',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                backgroundColor: '#00FFFF',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                color: '#0A3357',
                fontWeight: 'bold',
                marginRight: '24px',
              }}
            >
              WG
            </div>
            <div style={{ fontSize: '36px', fontWeight: 'bold' }}>
              Walking Golfer
            </div>
          </div>

          {/* Main title */}
          <div
            style={{
              fontSize: title.length > 50 ? '48px' : '56px',
              fontWeight: 'bold',
              textAlign: 'center',
              maxWidth: '1000px',
              lineHeight: '1.2',
              marginBottom: '24px',
            }}
          >
            {title}
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: '28px',
              color: '#00FFFF',
              textAlign: 'center',
              maxWidth: '800px',
            }}
          >
            {subtitle}
          </div>

          {/* Type indicator */}
          {type !== 'default' && (
            <div
              style={{
                position: 'absolute',
                bottom: '40px',
                right: '40px',
                backgroundColor: '#00FFFF',
                color: '#0A3357',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '18px',
                fontWeight: 'bold',
                textTransform: 'uppercase',
              }}
            >
              {type}
            </div>
          )}
        </div>
      ),
      {
        width: 1200,
        height: 630,
      },
    )
  } catch (e) {
    console.error('Error generating OG image:', e)
    return new Response('Failed to generate image', {
      status: 500,
    })
  }
} 