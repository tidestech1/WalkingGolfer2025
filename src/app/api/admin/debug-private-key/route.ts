import { NextResponse, NextRequest } from 'next/server';

export async function GET(_request: NextRequest) {
  try {
    const privateKey = process.env['FIREBASE_ADMIN_PRIVATE_KEY'];
    
    if (!privateKey) {
      return NextResponse.json({
        error: 'Private key is not defined'
      }, { status: 500 });
    }
    
    // Extract information about the key without revealing it
    const keyInfo = {
      // Length of the key
      length: privateKey.length,
      
      // Check if it has the right beginning and ending
      hasBeginMarker: privateKey.includes('-----BEGIN PRIVATE KEY-----'),
      hasEndMarker: privateKey.includes('-----END PRIVATE KEY-----'),
      
      // Check for newlines
      containsNewlines: privateKey.includes('\n'),
      containsEscapedNewlines: privateKey.includes('\\n'),
      
      // Count occurrences of markers (should be exactly 1 each)
      beginMarkerCount: (privateKey.match(/-----BEGIN PRIVATE KEY-----/g) || []).length,
      endMarkerCount: (privateKey.match(/-----END PRIVATE KEY-----/g) || []).length,
      
      // First few characters (without revealing the key)
      beginsWith: privateKey.substring(0, 27) + '...',
      
      // Check for extra quotes or spaces
      hasExtraQuotes: privateKey.includes('"') || privateKey.includes("'"),
      
      // Check if it starts with actual PEM markers or if there's whitespace
      startsWithMarker: privateKey.trim().startsWith('-----BEGIN'),
      
      // Check line breaks format
      lineBreakType: privateKey.includes('\r\n') ? 'CRLF' : 
                     privateKey.includes('\n') ? 'LF' : 'None'
    };
    
    return NextResponse.json({ keyInfo });
  } catch (error) {
    return NextResponse.json({
      error: 'Error analyzing private key',
      message: (error as Error).message
    }, { status: 500 });
  }
} 