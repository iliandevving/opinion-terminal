import { ImageResponse } from 'next/og'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <svg width="32" height="32" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" stroke="#EE6332" strokeWidth="2.5"/>
          <circle cx="16" cy="16" r="4" fill="#EE6332"/>
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
