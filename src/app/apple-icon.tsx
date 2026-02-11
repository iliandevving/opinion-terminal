import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#000',
          borderRadius: '22%',
        }}
      >
        <svg width="140" height="140" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" stroke="#EE6332" strokeWidth="2"/>
          <circle cx="16" cy="16" r="4" fill="#EE6332"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
